const fetch = require('node-fetch');
const GeocodeCache = require('../models/GeocodeCache');

const MAX_GEOCODE_RETRIES = 3;
const BASE_GEOCODE_RETRY_DELAY_MS = 800;

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function fetchWithRetry(url, options = {}, maxAttempts = MAX_GEOCODE_RETRIES) {
  let attempt = 0;

  while (attempt < maxAttempts) {
    attempt += 1;

    try {
      const response = await fetch(url, options);
      if (response.ok) {
        return response;
      }

      if ([429, 502, 503, 504].includes(response.status) && attempt < maxAttempts) {
        const delay = BASE_GEOCODE_RETRY_DELAY_MS * attempt;
        console.warn(`Geocoding service rate limit or transient error (${response.status}). Retrying in ${delay}ms...`);
        await sleep(delay);
        continue;
      }

      return response;
    } catch (error) {
      if (attempt >= maxAttempts) {
        throw error;
      }
      const delay = BASE_GEOCODE_RETRY_DELAY_MS * attempt;
      console.warn(`Geocoding fetch error, retrying in ${delay}ms: ${error.message}`);
      await sleep(delay);
    }
  }

  throw new Error('Geocoding service unavailable after retries.');
}

/**
 * Resolves a place name to coordinates and timezone, with caching in MongoDB.
 */
async function geocodePlace(query) {
  if (!query) throw new Error("Geocoding query is required.");

  const normalizedQuery = query.trim().toLowerCase();

  try {
    const cached = await GeocodeCache.findOne({ query: normalizedQuery });
    if (cached) {
      console.log(`🎯 Geocoding Cache Hit: "${query}" -> Lat: ${cached.latitude}, Lng: ${cached.longitude}, TZ: ${cached.timezone}`);
      return {
        latitude: cached.latitude,
        longitude: cached.longitude,
        timezone: cached.timezone
      };
    }
  } catch (err) {
    console.error("Geocoding cache lookup error:", err);
  }

  console.log(`🌐 Geocoding Cache Miss: "${query}"`);

  let latitude, longitude;
  try {
    const nominatimUrl = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(query)}&format=json&limit=1`;
    const response = await fetchWithRetry(nominatimUrl, {
      headers: {
        'User-Agent': 'Aradhana-AstroAgent/1.0 (contact@aradhana.ai)'
      }
    });

    if (!response.ok) {
      throw new Error(`Nominatim responded ${response.status}: ${response.statusText}`);
    }

    const data = await response.json();
    if (!data || data.length === 0) {
      throw new Error(`Could not resolve location: "${query}". Please check the spelling.`);
    }

    latitude = parseFloat(data[0].lat);
    longitude = parseFloat(data[0].lon);
  } catch (error) {
    console.error("Nominatim API error:", error);
    throw new Error(`Location geocoding failed: ${error.message}`);
  }

  let timezone = 'UTC';
  try {
    const geonamesUser = process.env.GEONAMES_USERNAME || 'astroagent_demo';
    const tzResponse = await fetch(`http://api.geonames.org/timezoneJSON?lat=${latitude}&lng=${longitude}&username=${geonamesUser}`);
    
    if (tzResponse.ok) {
      const tzData = await tzResponse.json();
      if (tzData.timezoneId) {
        timezone = tzData.timezoneId;
      }
    } else {
      console.warn("Timezone API warning, falling back to estimated timezone.");
      timezone = estimateTimezoneByLongitude(longitude);
    }
  } catch (tzError) {
    console.error("Timezone fetch error:", tzError);
    timezone = estimateTimezoneByLongitude(longitude);
  }

  try {
    await GeocodeCache.create({
      query: normalizedQuery,
      latitude,
      longitude,
      timezone
    });
    console.log(`💾 Saved geocode cache for: "${query}"`);
  } catch (saveErr) {
    console.error("Geocode cache save error:", saveErr);
  }

  return { latitude, longitude, timezone };
}

function estimateTimezoneByLongitude(lng) {
  const hoursOffset = Math.round(lng / 15);
  if (hoursOffset === 5 || hoursOffset === 6) return "Asia/Kolkata";
  if (hoursOffset === 0) return "UTC";
  if (hoursOffset === -5) return "America/New_York";
  if (hoursOffset === -8) return "America/Los_Angeles";
  if (hoursOffset === 8) return "Asia/Shanghai";
  if (hoursOffset === 1) return "Europe/London";
  if (hoursOffset === 2) return "Europe/Paris";

  const prefix = hoursOffset >= 0 ? '+' : '';
  return `Etc/GMT${prefix}${hoursOffset}`;
}

module.exports = {
  geocodePlace
};

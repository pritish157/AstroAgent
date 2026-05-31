const Astronomy = require('astronomy-engine');

const ZODIAC_SIGNS = [
  "Aries", "Taurus", "Gemini", "Cancer", "Leo", "Virgo",
  "Libra", "Scorpio", "Sagittarius", "Capricorn", "Aquarius", "Pisces"
];

const PLANET_BODIES = [
  { name: 'Sun', body: Astronomy.Body.Sun },
  { name: 'Moon', body: Astronomy.Body.Moon },
  { name: 'Mercury', body: Astronomy.Body.Mercury },
  { name: 'Venus', body: Astronomy.Body.Venus },
  { name: 'Mars', body: Astronomy.Body.Mars },
  { name: 'Jupiter', body: Astronomy.Body.Jupiter },
  { name: 'Saturn', body: Astronomy.Body.Saturn },
  { name: 'Uranus', body: Astronomy.Body.Uranus },
  { name: 'Neptune', body: Astronomy.Body.Neptune },
  { name: 'Pluto', body: Astronomy.Body.Pluto }
];

function normalizeAngle(degrees) {
  let angle = degrees % 360;
  if (angle < 0) angle += 360;
  return angle;
}

function getObliquity(jd) {
  const T = (jd - 2451545.0) / 36525;
  const eps = 23.4392911 - (46.8150 / 3600) * T - (0.00059 / 3600) * T * T + (0.001813 / 3600) * T * T * T;
  return eps * Math.PI / 180;
}

function calculateAyanamsa(jd) {
  // Julian centuries since epoch January 0.5, 1900 (JD = 2415020.0)
  const T = (jd - 2415020.0) / 36525;
  // NC Lahiri formula for Ayanamsa:
  const ayanamsa = 22.460148 + 1.396042 * T + 0.000308 * T * T;
  return ayanamsa;
}

function calculateAscendant(utcDate, lat, lng) {
  const gmst = Astronomy.SiderealTime(utcDate);
  const localSiderealTime = normalizeAngle((gmst + (lng / 15)) * 15);
  
  const ramc = localSiderealTime * Math.PI / 180;
  const latRad = lat * Math.PI / 180;
  
  const msSince2000 = utcDate.getTime() - new Date(Date.UTC(2000, 0, 1, 12, 0, 0)).getTime();
  const jd = 2451545.0 + (msSince2000 / (1000 * 60 * 60 * 24));
  const eps = getObliquity(jd);
  
  const y = Math.cos(ramc);
  const x = -Math.sin(ramc) * Math.cos(eps) - Math.tan(latRad) * Math.sin(eps);
  
  let ascRad = Math.atan2(y, x);
  let ascDeg = normalizeAngle(ascRad * 180 / Math.PI);
  
  return ascDeg;
}

function calculateLunarNodes(utcDate) {
  const msSince2000 = utcDate.getTime() - new Date(Date.UTC(2000, 0, 1, 12, 0, 0)).getTime();
  const jd = 2451545.0 + (msSince2000 / (1000 * 60 * 60 * 24));
  const T = (jd - 2451545.0) / 36525;
  
  let omega = 125.0445550 - 1934.1361849 * T + 0.00207562 * T * T;
  omega = normalizeAngle(omega);
  
  const rahu = omega;
  const ketu = normalizeAngle(omega + 180);
  
  return { rahu, ketu };
}

function getZodiacInfo(longitude) {
  const normalized = normalizeAngle(longitude);
  const index = Math.floor(normalized / 30);
  const sign = ZODIAC_SIGNS[index];
  const degree = normalized % 30;
  return { sign, degree };
}

function computeBirthChart(date, time, lat, lng, timezone, system = 'western') {
  const birthLocalString = `${date}T${time}:00`;
  let utcDate;
  try {
    const formatter = new Intl.DateTimeFormat('en-US', {
      timeZone: timezone,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false
    });
    
    const offsetDate = new Date(birthLocalString + "Z");
    const parts = formatter.formatToParts(offsetDate);
    const partMap = Object.fromEntries(parts.map(p => [p.type, p.value]));
    
    const formattedLocal = `${partMap.year}-${partMap.month}-${partMap.day}T${partMap.hour}:${partMap.minute}:00`;
    const diffMs = new Date(birthLocalString + "Z").getTime() - new Date(formattedLocal + "Z").getTime();
    
    utcDate = new Date(offsetDate.getTime() + diffMs);
  } catch (err) {
    console.error("Intl timezone error, using system default:", err);
    utcDate = new Date(birthLocalString);
  }

  const ascendantDegree = calculateAscendant(utcDate, lat, lng);
  
  // Calculate Ayanamsa offset if system is Vedic (Sidereal)
  let ayanamsa = 0;
  if (system === 'vedic') {
    const msSince2000 = utcDate.getTime() - new Date(Date.UTC(2000, 0, 1, 12, 0, 0)).getTime();
    const jd = 2451545.0 + (msSince2000 / (1000 * 60 * 60 * 24));
    ayanamsa = calculateAyanamsa(jd);
  }

  const adjustedAscendantDegree = normalizeAngle(ascendantDegree - ayanamsa);
  const ascZodiac = getZodiacInfo(adjustedAscendantDegree);
  
  const ascendant = {
    name: 'Ascendant',
    longitude: adjustedAscendantDegree,
    sign: ascZodiac.sign,
    degree: ascZodiac.degree,
    house: 1
  };

  const placements = [];
  
  for (const bodyInfo of PLANET_BODIES) {
    const geoVec = Astronomy.GeoVector(bodyInfo.body, utcDate, false);
    const ecliptic = Astronomy.Ecliptic(geoVec);
    const lon = ecliptic.elon;
    
    const adjustedLon = normalizeAngle(lon - ayanamsa);
    const zodiac = getZodiacInfo(adjustedLon);
    
    const relativeDegree = normalizeAngle(adjustedLon - adjustedAscendantDegree);
    const house = Math.floor(relativeDegree / 30) + 1;
    
    placements.push({
      name: bodyInfo.name,
      longitude: adjustedLon,
      sign: zodiac.sign,
      degree: zodiac.degree,
      house
    });
  }

  const nodes = calculateLunarNodes(utcDate);
  
  const rahuLon = normalizeAngle(nodes.rahu - ayanamsa);
  const rahuZodiac = getZodiacInfo(rahuLon);
  const rahuRelative = normalizeAngle(rahuLon - adjustedAscendantDegree);
  placements.push({
    name: 'Rahu',
    longitude: rahuLon,
    sign: rahuZodiac.sign,
    degree: rahuZodiac.degree,
    house: Math.floor(rahuRelative / 30) + 1
  });

  const ketuLon = normalizeAngle(nodes.ketu - ayanamsa);
  const ketuZodiac = getZodiacInfo(ketuLon);
  const ketuRelative = normalizeAngle(ketuLon - adjustedAscendantDegree);
  placements.push({
    name: 'Ketu',
    longitude: ketuLon,
    sign: ketuZodiac.sign,
    degree: ketuZodiac.degree,
    house: Math.floor(ketuRelative / 30) + 1
  });

  return {
    ascendant,
    planets: placements
  };
}

function getDailyTransits(natalPlanets, transitDate, system = 'western') {
  const dateObj = new Date(transitDate + "T12:00:00Z");
  
  const ascendantPlanet = natalPlanets.find(p => p.name === 'Ascendant') || { longitude: 0 };
  const ascendantDegree = ascendantPlanet.longitude;
  
  let ayanamsa = 0;
  if (system === 'vedic') {
    const msSince2000 = dateObj.getTime() - new Date(Date.UTC(2000, 0, 1, 12, 0, 0)).getTime();
    const jd = 2451545.0 + (msSince2000 / (1000 * 60 * 60 * 24));
    ayanamsa = calculateAyanamsa(jd);
  }
  
  const transits = [];

  for (const bodyInfo of PLANET_BODIES.slice(0, 7)) {
    const geoVec = Astronomy.GeoVector(bodyInfo.body, dateObj, false);
    const ecliptic = Astronomy.Ecliptic(geoVec);
    const lon = ecliptic.elon;
    
    const adjustedLon = normalizeAngle(lon - ayanamsa);
    const zodiac = getZodiacInfo(adjustedLon);
    
    const relativeDegree = normalizeAngle(adjustedLon - ascendantDegree);
    const transitHouse = Math.floor(relativeDegree / 30) + 1;
    
    const aspects = [];
    for (const natal of natalPlanets) {
      if (natal.name === 'Ascendant') continue;
      const diff = Math.abs(normalizeAngle(adjustedLon - natal.longitude));
      const minDiff = Math.min(diff, 360 - diff);
      if (minDiff <= 5.0) {
        aspects.push({
          aspect: 'Conjunction',
          natalPlanet: natal.name,
          orb: parseFloat(minDiff.toFixed(2))
        });
      }
    }

    transits.push({
      name: bodyInfo.name,
      longitude: adjustedLon,
      sign: zodiac.sign,
      degree: parseFloat(zodiac.degree.toFixed(2)),
      house: transitHouse,
      aspects
    });
  }

  return transits;
}

module.exports = {
  computeBirthChart,
  getZodiacInfo,
  getDailyTransits
};

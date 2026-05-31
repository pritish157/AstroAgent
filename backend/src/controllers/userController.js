const User = require('../models/User');
const { geocodePlace } = require('../tools/geocoder');
const { computeBirthChart } = require('../tools/astrology');

/**
 * Controller: Handles user profile creation.
 * 1. Geocodes the birth place to get lat/lng/timezone
 * 2. Computes real natal chart using astronomy-engine
 * 3. Saves everything to MongoDB
 */
const submitBirthDetails = async (req, res) => {
  try {
    const { name, date, time, place, system } = req.body;
    
    if (!name || !date || !time || !place) {
      return res.status(400).json({ error: 'Name, date, time, and place are required.' });
    }

    // Step 1: Geocode the place to get coordinates and timezone
    let geoResult;
    try {
      geoResult = await geocodePlace(place);
    } catch (geoErr) {
      return res.status(400).json({ error: `Could not resolve location: ${geoErr.message}` });
    }

    const { latitude, longitude, timezone } = geoResult;

    // Step 2: Compute real natal chart using astronomy-engine
    let chartResult;
    try {
      chartResult = computeBirthChart(date, time, latitude, longitude, timezone, system || 'western');
    } catch (chartErr) {
      return res.status(400).json({ error: chartErr.message });
    }

    // Step 3: Build the natal chart array (Ascendant + all planets)
    const natalChart = [chartResult.ascendant, ...chartResult.planets];

    // Step 4: Save to MongoDB
    const userProfile = {
      name,
      birthDetails: { date, time, place, latitude, longitude, timezone, system: system || 'western' },
      natalChart
    };

    const newUser = await User.create(userProfile);
    
    res.status(201).json({
      message: 'Birth details captured and natal chart computed.',
      user: newUser
    });
  } catch (error) {
    console.error('Error in submitBirthDetails controller:', error);
    res.status(500).json({ error: 'Failed to create user record.' });
  }
};

module.exports = {
  submitBirthDetails
};

const mongoose = require('mongoose');

const GeocodeCacheSchema = new mongoose.Schema({
  query: { type: String, required: true, unique: true, index: true },
  latitude: { type: Number, required: true },
  longitude: { type: Number, required: true },
  timezone: { type: String, required: true },
  createdAt: { type: Date, default: Date.now, expires: '30d' }
});

module.exports = mongoose.model('GeocodeCache', GeocodeCacheSchema);

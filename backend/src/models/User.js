const mongoose = require('mongoose');

const PlanetPlacementSchema = new mongoose.Schema({
  name: { type: String, required: true },
  longitude: { type: Number, required: true },
  sign: { type: String, required: true },
  degree: { type: Number },
  house: { type: Number, required: true }
});

const UserSchema = new mongoose.Schema({
  name: { type: String, required: true },
  birthDetails: {
    date: { type: String, required: true },
    time: { type: String, required: true },
    place: { type: String, required: true },
    latitude: { type: Number, required: true },
    longitude: { type: Number, required: true },
    timezone: { type: String, required: true },
    system: { type: String, default: 'western' }
  },
  natalChart: [PlanetPlacementSchema],
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('User', UserSchema);

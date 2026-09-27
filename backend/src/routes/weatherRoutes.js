const express = require('express');
const router = express.Router();
const { fetchCurrentWeather } = require('../services/weatherService');

/**
 * Public/authenticated endpoint for fetching live weather safety evaluation
 */
router.get('/safety-check', async (req, res) => {
  try {
    const { lat, lng } = req.query;
    if (lat == null || lng == null) {
      return res.status(400).json({ error: 'Latitude and longitude are required' });
    }

    const weather = await fetchCurrentWeather(Number(lat), Number(lng));
    res.json({ success: true, weather });
  } catch (error) {
    console.error('[WeatherRoutes] Error:', error);
    res.status(500).json({ error: 'Failed to fetch weather data' });
  }
});

module.exports = router;

const axios = require('axios');

// WMO Weather code interpretations for precipitation/rain
const RAIN_WEATHER_CODES = [
  51, 53, 55, // Drizzle
  61, 63, 65, // Rain: Slight, Moderate, Heavy
  66, 67,     // Freezing rain
  80, 81, 82, // Rain showers
  95, 96, 99  // Thunderstorm with heavy rain/hail
];

const HEAVY_RAIN_CODES = [65, 82, 95, 96, 99];

/**
 * Fetch current weather from Open-Meteo API for given lat/lng
 * @param {number} latitude 
 * @param {number} longitude 
 * @returns {Promise<{ temperature: number, precipitation: number, weatherCode: number, condition: string, isHeatRisk: boolean, isRainRisk: boolean, riskLevel: 'NONE'|'WARNING'|'CRITICAL', riskMessage: string|null }>}
 */
async function fetchCurrentWeather(latitude, longitude) {
  try {
    if (latitude == null || longitude == null) {
      return {
        temperature: 32,
        precipitation: 0,
        weatherCode: 0,
        condition: 'Clear / Normal',
        isHeatRisk: false,
        isRainRisk: false,
        riskLevel: 'NONE',
        riskMessage: null,
      };
    }

    const url = `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current=temperature_2m,relative_humidity_2m,precipitation,weather_code,wind_speed_10m`;
    const response = await axios.get(url, { timeout: 4000 });

    if (response.data && response.data.current) {
      const current = response.data.current;
      const temp = current.temperature_2m;
      const precip = current.precipitation;
      const code = current.weather_code;

      const isHeatRisk = temp >= 40.0;
      const isRainRisk = precip > 5.0 || HEAVY_RAIN_CODES.includes(code);

      let condition = 'Normal / Clear';
      if (isHeatRisk && isRainRisk) {
        condition = 'Severe Weather: Extreme Heat & Torrential Rain';
      } else if (isHeatRisk) {
        condition = `Extreme Heat Wave (${temp}°C)`;
      } else if (isRainRisk) {
        condition = 'Heavy Rain / Thunderstorm';
      } else if (RAIN_WEATHER_CODES.includes(code) || precip > 0.5) {
        condition = 'Light to Moderate Rain';
      } else if (temp >= 36) {
        condition = `High Temperature (${temp}°C)`;
      }

      let riskLevel = 'NONE';
      let riskMessage = null;

      if (isHeatRisk || isRainRisk) {
        riskLevel = 'CRITICAL';
        if (isHeatRisk && isRainRisk) {
          riskMessage = `Critical Safety Advisory: Temperature is ${temp}°C and severe rain is detected. Outdoor physical labor poses immediate health hazards.`;
        } else if (isHeatRisk) {
          riskMessage = `Severe Heat Advisory: Ambient temperature is ${temp}°C (exceeds 40°C safety threshold). Mandatory hydration breaks & shade required.`;
        } else {
          riskMessage = `Severe Rain / Storm Alert: Heavy precipitation (${precip}mm) or thunderstorm active. Slippery surfaces & electrical hazards present.`;
        }
      } else if (temp >= 36 || RAIN_WEATHER_CODES.includes(code)) {
        riskLevel = 'WARNING';
        riskMessage = `Weather Caution: Temperature is ${temp}°C with wet or humid conditions. Stay hydrated and use appropriate gear.`;
      }

      return {
        temperature: temp,
        precipitation: precip,
        weatherCode: code,
        condition,
        isHeatRisk,
        isRainRisk,
        riskLevel,
        riskMessage,
      };
    }
  } catch (error) {
    console.warn('[WeatherService] Failed to fetch live weather from Open-Meteo:', error.message);
  }

  // Graceful fallback if offline or request timeout
  return {
    temperature: 33.5,
    precipitation: 0,
    weatherCode: 1,
    condition: 'Clear Sky / Normal',
    isHeatRisk: false,
    isRainRisk: false,
    riskLevel: 'NONE',
    riskMessage: null,
  };
}

module.exports = { fetchCurrentWeather };

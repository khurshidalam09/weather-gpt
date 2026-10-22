
const GEOCODING_URL =
  "https://geocoding-api.open-meteo.com/v1/search";

const FORECAST_URL =
  "https://api.open-meteo.com/v1/forecast";

async function getWeatherByCity(city) {
  const geoUrl = new URL(GEOCODING_URL);
  geoUrl.searchParams.set("name", city);
  geoUrl.searchParams.set("count", "1");
  geoUrl.searchParams.set("language", "en");
  geoUrl.searchParams.set("format", "json");

  const geoResponse = await fetch(geoUrl);

  if (!geoResponse.ok) {
    throw new Error("Could not reach the geocoding service.");
  }

  const geoData = await geoResponse.json();
  const place = geoData.results?.[0];

  if (!place) {
    const error = new Error("City not found. Try another city name.");
    error.status = 404;
    throw error;
  }

  const forecastUrl = new URL(FORECAST_URL);

  forecastUrl.searchParams.set("latitude", place.latitude);
  forecastUrl.searchParams.set("longitude", place.longitude);
  forecastUrl.searchParams.set("current", [
    "temperature_2m",
    "relative_humidity_2m",
    "apparent_temperature",
    "is_day",
    "precipitation",
    "weather_code",
    "wind_speed_10m",
  ].join(","));

  forecastUrl.searchParams.set("daily", [
    "weather_code",
    "temperature_2m_max",
    "temperature_2m_min",
    "sunrise",
    "sunset",
  ].join(","));

  forecastUrl.searchParams.set("timezone", "auto");
  forecastUrl.searchParams.set("forecast_days", "5");

  const weatherResponse = await fetch(forecastUrl);

  if (!weatherResponse.ok) {
    throw new Error("Could not retrieve weather data.");
  }

  const weather = await weatherResponse.json();

  return {
    location: {
      city: place.name,
      country: place.country,
      latitude: place.latitude,
      longitude: place.longitude,
      timezone: weather.timezone,
    },
    current: weather.current,
    currentUnits: weather.current_units,
    daily: weather.daily,
    dailyUnits: weather.daily_units,
  };
}

module.exports = { getWeatherByCity };


const { getWeatherByCity } = require("../services/weatherService");

async function getWeather(req, res) {
  const city = req.query.city?.trim();

  if (!city) {
    return res.status(400).json({
      success: false,
      message: "Please provide a city using ?city=Delhi",
    });
  }

  if (city.length > 100) {
    return res.status(400).json({
      success: false,
      message: "City name is too long.",
    });
  }

  try {
    const data = await getWeatherByCity(city);

    return res.status(200).json({
      success: true,
      data,
    });
  } catch (error) {
    console.error("Weather API error:", error.message);

    return res.status(error.status || 502).json({
      success: false,
      message: error.status
        ? error.message
        : "Unable to retrieve weather. Please try again.",
    });
  }
}

module.exports = { getWeather };

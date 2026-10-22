
import { useEffect, useState } from "react";
import "./App.css";

const API_URL = "http://localhost:5000/api/weather";
const AI_URL = "http://localhost:5000/api/ai/chat";

function getWeatherInfo(code, isDay = 1) {
  if (code === 0) return { label: "Clear sky", icon: isDay ? "☀️" : "🌙" };
  if (code <= 2) return { label: "Partly cloudy", icon: isDay ? "🌤️" : "☁️" };
  if (code === 3) return { label: "Overcast", icon: "☁️" };
  if (code <= 48) return { label: "Foggy", icon: "🌫️" };
  if (code <= 57) return { label: "Drizzle", icon: "🌦️" };
  if (code <= 67) return { label: "Rain", icon: "🌧️" };
  if (code <= 77) return { label: "Snow", icon: "❄️" };
  if (code <= 82) return { label: "Rain showers", icon: "🌦️" };
  if (code <= 86) return { label: "Snow showers", icon: "🌨️" };
  if (code >= 95) return { label: "Thunderstorm", icon: "⛈️" };
  return { label: "Cloudy", icon: "🌥️" };
}

function formatDay(dateString, index) {
  if (index === 0) return "Today";

  return new Date(`${dateString}T12:00:00`).toLocaleDateString(
    "en-US",
    { weekday: "short" }
  );
}

function App() {
const [cityInput, setCityInput] = useState("Delhi");
const [weather, setWeather] = useState(null);
const [loading, setLoading] = useState(false);
const [error, setError] = useState("");
const [locationLoading, setLocationLoading] = useState(false);

  const [chatInput, setChatInput] = useState("");
  const [chatMessages, setChatMessages] = useState([]);
  const [chatLoading, setChatLoading] = useState(false);
  const [chatError, setChatError] = useState("");

  async function searchWeather(city) {
    const query = city.trim();

    if (!query) {
      setError("Enter a city name to check its weather.");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const response = await fetch(
        `${API_URL}?city=${encodeURIComponent(query)}`
      );
      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.message || "Could not fetch weather.");
      }

      setWeather(result.data);
      setCityInput(result.data.location.city);
    } catch (err) {
      setError(
        err.message === "Failed to fetch"
          ? "Can't connect to the backend. Make sure it's running on port 5000."
          : err.message || "Something went wrong. Please try again."
      );
    } finally {
      setLoading(false);
    }
  }

async function useMyLocation() {
  if (!navigator.geolocation) {
    setError("Your browser does not support location detection.");
    return;
  }

  setLocationLoading(true);
  setError("");

  navigator.geolocation.getCurrentPosition(
    async (position) => {
      try {
        const { latitude, longitude } = position.coords;

        const url =
          `https://nominatim.openstreetmap.org/reverse` +
          `?format=jsonv2&lat=${latitude}&lon=${longitude}`;

        const response = await fetch(url);

        if (!response.ok) {
          throw new Error("Could not identify your location. Please search manually.");
        }

        const result = await response.json();

const address = result.address || {};

const candidates = [
  address.city,
  address.town,
  address.municipality,
  address.village,
  address.city_district,
  address.county,
  address.state_district,
  address.state,
].filter(Boolean);

let foundCity = null;

for (const candidate of [...new Set(candidates)]) {
  try {
    const weatherResponse = await fetch(
      `http://localhost:5000/api/weather?city=${encodeURIComponent(candidate)}`
    );

    const weatherResult = await weatherResponse.json();

    if (weatherResponse.ok && weatherResult.success) {
      foundCity = weatherResult.data.location.city;
      break;
    }
  } catch {
    // Try the next location candidate.
  }
}

if (!foundCity) {
  throw new Error(
    "Could not match your location to a supported city. Please use city search."
  );
}

await searchWeather(foundCity);

      } catch (err) {
        setError(
          err.message ||
            "Location lookup failed. Please search for a city manually."
        );
      } finally {
        setLocationLoading(false);
      }
    },
    (geoError) => {
      const message =
        geoError.code === 1
          ? "Location permission was denied. Allow location access in your browser or search manually."
          : geoError.code === 2
            ? "Your location could not be determined. Please search manually."
            : "Location request timed out. Please try again.";

      setError(message);
      setLocationLoading(false);
    },
    {
      enableHighAccuracy: false,
      timeout: 10000,
      maximumAge: 300000,
    }
  );
}

  async function sendChatMessage(event) {
    event.preventDefault();

    const message = chatInput.trim();

    if (!message || chatLoading) return;

    if (!weather) {
      setChatError("Load a city's weather before asking about its conditions.");
      return;
    }

    setChatInput("");
    setChatError("");
    setChatMessages((previous) => [
      ...previous,
      { role: "user", text: message },
    ]);
    setChatLoading(true);

    try {
      const response = await fetch(AI_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          message,
          weather: {
            location: weather.location,
            current: weather.current,
            currentUnits: weather.currentUnits,
            daily: weather.daily,
            dailyUnits: weather.dailyUnits,
          },
        }),
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.message || "The AI could not respond.");
      }

      setChatMessages((previous) => [
        ...previous,
        { role: "assistant", text: result.reply },
      ]);
    } catch (err) {
      setChatError(
        err.message === "Failed to fetch"
          ? "Cannot connect to the AI backend. Check that your server is running."
          : err.message || "Something went wrong. Please try again."
      );
    } finally {
      setChatLoading(false);
    }
  }

  useEffect(() => {
    searchWeather("Delhi");
  }, []);

  const current = weather?.current;
  const daily = weather?.daily;
  const weatherCode = current?.weather_code;
const isDay = current?.is_day === 1;

let weatherTheme = "weather-default";

if (current) {
  if (!isDay) {
    weatherTheme = "weather-night";
  } else if (weatherCode === 0) {
    weatherTheme = "weather-sunny";
  } else if (weatherCode <= 2) {
    weatherTheme = "weather-partly-cloudy";
  } else if (weatherCode === 3 || weatherCode === 45 || weatherCode === 48) {
    weatherTheme = "weather-cloudy";
  } else if (weatherCode >= 95) {
    weatherTheme = "weather-storm";
  } else if (
    (weatherCode >= 71 && weatherCode <= 77) ||
    (weatherCode >= 85 && weatherCode <= 86)
  ) {
    weatherTheme = "weather-snow";
  } else if (
    (weatherCode >= 51 && weatherCode <= 67) ||
    (weatherCode >= 80 && weatherCode <= 82)
  ) {
    weatherTheme = "weather-rain";
  }
}

  const currentInfo = current
    ? getWeatherInfo(current.weather_code, current.is_day)
    : null;

  return (
<main className={`app-shell ${weatherTheme}`}>
      <header className="topbar">
        <a className="brand" href="#home" aria-label="Weather GPT home">
          <span className="brand-icon">☀</span>
          <span>weather<span className="brand-accent">gpt</span></span>
        </a>

        <div className="live-indicator">
          <span className="live-dot" />
          Live weather
        </div>
      </header>

      <section className="hero" id="home">
        <div className="hero-copy">
          <span className="eyebrow">YOUR PERSONAL WEATHER ASSISTANT</span>
          <h1>
            The world,
            <br />
            <span>at a glance.</span>
          </h1>
          <p>
            Real-time conditions and upcoming forecasts,
            all in one place.
          </p>
        </div>

        <form
          className="search-form"
          onSubmit={(event) => {
            event.preventDefault();
            searchWeather(cityInput);
          }}
        >
          <span className="search-icon">⌕</span>
          <input
            value={cityInput}
            onChange={(event) => setCityInput(event.target.value)}
            placeholder="Search any city..."
            aria-label="City name"
          />
         <button type="submit" disabled={loading || locationLoading}>
  {loading ? "Searching..." : "Search"}
</button>

<button
  type="button"
  onClick={useMyLocation}
  disabled={loading || locationLoading}
>
  {locationLoading ? "Finding location..." : "◎ Use My Location"}
</button>
        </form>
      </section>

      {error && (
        <div className="error-banner" role="alert">
          <span>⚠️ {error}</span>
          <button onClick={() => searchWeather(cityInput)}>Retry</button>
        </div>
      )}

      {loading && !weather && (
        <section className="loading-card">
          <span className="loading-spinner" />
          <p>Finding the latest weather...</p>
        </section>
      )}

      {weather && current && daily && (
        <>
          <section className="weather-layout">
            <article className="current-card">
              <div className="current-card-top">
                <div>
                  <span className="card-label">CURRENT WEATHER</span>
                  <h2>
                    {weather.location.city}
                    {weather.location.country
                      ? `, ${weather.location.country}`
                      : ""}
                  </h2>
                  <p className="updated-label">
                    Local time zone: {weather.location.timezone}
                  </p>
                </div>
                <span className="weather-symbol" aria-hidden="true">
                  {currentInfo.icon}
                </span>
              </div>

              <div className="temperature-row">
                <div className="temperature">
                  {Math.round(current.temperature_2m)}
                  <span>°</span>
                </div>
                <div className="condition">
                  <strong>{currentInfo.label}</strong>
                  <span>
                    Feels like {Math.round(current.apparent_temperature)}°
                  </span>
                </div>
              </div>

              <div className="current-divider" />

              <div className="sun-info">
                <div>
                  <span className="mini-icon">↑</span>
                  <span className="sun-label">High</span>
                  <strong>{Math.round(daily.temperature_2m_max[0])}°</strong>
                </div>
                <div>
                  <span className="mini-icon">↓</span>
                  <span className="sun-label">Low</span>
                  <strong>{Math.round(daily.temperature_2m_min[0])}°</strong>
                </div>
                <div>
                  <span className="mini-icon">☀</span>
                  <span className="sun-label">Sunrise</span>
                  <strong>
                    {new Date(daily.sunrise[0]).toLocaleTimeString("en-US", {
                      hour: "numeric",
                      minute: "2-digit",
                    })}
                  </strong>
                </div>
                <div>
                  <span className="mini-icon">☾</span>
                  <span className="sun-label">Sunset</span>
                  <strong>
                    {new Date(daily.sunset[0]).toLocaleTimeString("en-US", {
                      hour: "numeric",
                      minute: "2-digit",
                    })}
                  </strong>
                </div>
              </div>
            </article>

            <article className="details-panel">
              <div className="section-heading">
                <div>
                  <span className="card-label">WEATHER DETAILS</span>
                  <h2>Right now</h2>
                </div>
                <span className="detail-heading-icon">◉</span>
              </div>

              <div className="detail-grid">
                <div className="detail-card">
                  <span className="detail-icon">💧</span>
                  <span className="detail-label">Humidity</span>
                  <strong>{current.relative_humidity_2m}%</strong>
                  <span className="detail-foot">Relative humidity</span>
                </div>

                <div className="detail-card">
                  <span className="detail-icon">💨</span>
                  <span className="detail-label">Wind speed</span>
                  <strong>
                    {Math.round(current.wind_speed_10m)}
                    <small> km/h</small>
                  </strong>
                  <span className="detail-foot">Surface wind</span>
                </div>

                <div className="detail-card">
                  <span className="detail-icon">🌧️</span>
                  <span className="detail-label">Precipitation</span>
                  <strong>
                    {current.precipitation}
                    <small> mm</small>
                  </strong>
                  <span className="detail-foot">Current amount</span>
                </div>

                <div className="detail-card">
                  <span className="detail-icon">🌡️</span>
                  <span className="detail-label">Feels like</span>
                  <strong>{Math.round(current.apparent_temperature)}°</strong>
                  <span className="detail-foot">Perceived temperature</span>
                </div>
              </div>
            </article>
          </section>

         

          <section className="chat-section" aria-labelledby="chat-title">
            <div className="chat-heading">
              <div className="chat-heading-icon">✦</div>
              <div>
                <span className="card-label">POWERED BY GEMINI</span>
                <h2 id="chat-title">Ask Weather GPT</h2>
                <p>
                  Ask about {weather.location.city}'s weather, forecast, or
                  what to wear today.
                </p>
              </div>
            </div>

            <div className="chat-suggestions">
              {[
                "Should I carry an umbrella?",
                "What should I wear today?",
                "Explain today's weather",
              ].map((question) => (
                <button
                  key={question}
                  type="button"
                  disabled={chatLoading}
                  onClick={() => {
                    setChatInput(question);
                  }}
                >
                  {question}
                </button>
              ))}
            </div>

            <div className="chat-messages" aria-live="polite">
              {chatMessages.length === 0 && (
                <div className="chat-welcome">
                  <span>☁️</span>
                  <p>
                    Hi! I've got the weather data for{" "}
                    <strong>{weather.location.city}</strong>. What would you
                    like to know?
                  </p>
                </div>
              )}

              {chatMessages.map((item, index) => (
                <div
                  className={`chat-message ${item.role === "user" ? "user-message" : "assistant-message"}`}
                  key={`${index}-${item.role}`}
                >
                  {item.role === "assistant" && (
                    <span className="message-avatar">✦</span>
                  )}
                  <div className="message-bubble">{item.text}</div>
                </div>
              ))}

              {chatLoading && (
                <div className="chat-message assistant-message">
                  <span className="message-avatar">✦</span>
                  <div className="message-bubble typing-indicator">
                    <span />
                    <span />
                    <span />
                    <span className="sr-only">Gemini is thinking</span>
                  </div>
                </div>
              )}
            </div>

            {chatError && (
              <div className="chat-error" role="alert">
                {chatError}
              </div>
            )}

            <form className="chat-form" onSubmit={sendChatMessage}>
              <input
                value={chatInput}
                onChange={(event) => setChatInput(event.target.value)}
                placeholder="Ask anything about the weather..."
                aria-label="Ask Weather GPT a question"
                disabled={chatLoading}
              />
              <button
                type="submit"
                disabled={chatLoading || !chatInput.trim()}
              >
                {chatLoading ? "Thinking..." : "Ask AI ↑"}
              </button>
            </form>

            <p className="chat-disclaimer">
              AI responses can be inaccurate. Check official weather alerts
              for safety-critical decisions.
            </p>
          </section>
           <section className="forecast-section">
            <div className="section-heading forecast-heading">
              <div>
                <span className="card-label">PLAN AHEAD</span>
                <h2>5-day forecast</h2>
              </div>
              <span className="forecast-note">Next few days</span>
            </div>

            <div className="forecast-grid">
              {daily.time.map((date, index) => {
                const info = getWeatherInfo(daily.weather_code[index]);

                return (
                  <article className="forecast-card" key={date}>
                    <span className="forecast-day">
                      {formatDay(date, index)}
                    </span>
                    <span className="forecast-date">
                      {new Date(`${date}T12:00:00`).toLocaleDateString(
                        "en-US",
                        { day: "numeric", month: "short" }
                      )}
                    </span>
                    <span className="forecast-icon" aria-hidden="true">
                      {info.icon}
                    </span>
                    <span className="forecast-condition">{info.label}</span>
                    <div className="forecast-temps">
                      <strong>
                        {Math.round(daily.temperature_2m_max[index])}°
                      </strong>
                      <span>
                        {Math.round(daily.temperature_2m_min[index])}°
                      </span>
                    </div>
                  </article>
                );
              })}
            </div>
          </section>

          <footer className="page-footer">
            <span className="footer-brand">weathergpt</span>
            <span>Weather data provided by Open-Meteo</span>
          </footer>
        </>
      )}
    </main>
  );
}

export default App;

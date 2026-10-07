import { useEffect, useMemo, useState } from 'react';
import axios from 'axios';
import {
  CloudRain,
  CloudSun,
  Droplets,
  MapPin,
  Search,
  Sun,
  Wind,
  Thermometer,
  Gauge,
  CalendarDays,
  LoaderCircle
} from 'lucide-react';

const weatherCodes = {
  0: { label: 'Clear sky', icon: '☀️' },
  1: { label: 'Mainly clear', icon: '🌤️' },
  2: { label: 'Partly cloudy', icon: '⛅' },
  3: { label: 'Overcast', icon: '☁️' },
  45: { label: 'Fog', icon: '🌫️' },
  48: { label: 'Rime fog', icon: '🌫️' },
  51: { label: 'Light drizzle', icon: '🌦️' },
  53: { label: 'Moderate drizzle', icon: '🌦️' },
  55: { label: 'Dense drizzle', icon: '🌧️' },
  56: { label: 'Freezing drizzle', icon: '🌧️' },
  57: { label: 'Heavy freezing drizzle', icon: '🌧️' },
  61: { label: 'Slight rain', icon: '🌦️' },
  63: { label: 'Moderate rain', icon: '🌧️' },
  65: { label: 'Heavy rain', icon: '🌧️' },
  66: { label: 'Freezing rain', icon: '🌧️' },
  67: { label: 'Heavy freezing rain', icon: '🌧️' },
  71: { label: 'Slight snow', icon: '🌨️' },
  73: { label: 'Moderate snow', icon: '🌨️' },
  75: { label: 'Heavy snow', icon: '❄️' },
  77: { label: 'Snow grains', icon: '❄️' },
  80: { label: 'Rain showers', icon: '🌦️' },
  81: { label: 'Heavy showers', icon: '🌧️' },
  82: { label: 'Violent showers', icon: '⛈️' },
  85: { label: 'Snow showers', icon: '🌨️' },
  86: { label: 'Heavy snow showers', icon: '❄️' },
  95: { label: 'Thunderstorm', icon: '⛈️' },
  96: { label: 'Thunderstorm hail', icon: '⛈️' },
  99: { label: 'Severe thunderstorm', icon: '⛈️' }
};

const defaultCity = 'New York';

const formatHour = (iso) => {
  const date = new Date(iso);
  return new Intl.DateTimeFormat('en-US', {
    hour: 'numeric',
    hour12: true
  }).format(date);
};

const formatDay = (iso) => {
  const date = new Date(iso);
  return new Intl.DateTimeFormat('en-US', {
    weekday: 'short'
  }).format(date);
};

const formatClock = (iso) => {
  const date = new Date(iso);
  return new Intl.DateTimeFormat('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true
  }).format(date);
};

function App() {
  const [city, setCity] = useState(defaultCity);
  const [weather, setWeather] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchWeather = async (query) => {
    setLoading(true);
    setError('');

    try {
      const geoResp = await axios.get('https://geocoding-api.open-meteo.com/v1/search', {
        params: {
          name: query,
          count: 1,
          language: 'en',
          format: 'json'
        }
      });

      const result = geoResp.data?.results?.[0];
      if (!result) {
        throw new Error('City not found. Please try another city.');
      }

      const wr = await axios.get('https://api.open-meteo.com/v1/forecast', {
        params: {
          latitude: result.latitude,
          longitude: result.longitude,
          current:
            'temperature_2m,apparent_temperature,relative_humidity_2m,precipitation,weather_code,wind_speed_10m',
          hourly: 'temperature_2m,weather_code',
          daily: 'weather_code,temperature_2m_max,temperature_2m_min,sunrise,sunset',
          timezone: 'auto',
          forecast_days: 7
        }
      });

      setWeather({
        city: `${result.name}, ${result.country}`,
        current: wr.data.current,
        hourly: wr.data.hourly,
        daily: wr.data.daily,
        timezone: wr.data.timezone
      });
    } catch (err) {
      setError(err.message || 'Something went wrong while fetching weather.');
      setWeather(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWeather(defaultCity);
  }, []);

  const currentMeta = useMemo(() => {
    if (!weather) return { label: 'Loading...', icon: '⏳' };
    return weatherCodes[weather.current.weather_code] || { label: 'Weather', icon: '🌤️' };
  }, [weather]);

  const hourlyCards = weather?.hourly
    ? weather.hourly.time.slice(0, 6).map((time, index) => ({
        time,
        temp: weather.hourly.temperature_2m[index],
        code: weather.hourly.weather_code[index]
      }))
    : [];

  const dailyCards = weather?.daily
    ? weather.daily.time.slice(0, 7).map((day, index) => ({
        day,
        code: weather.daily.weather_code[index],
        min: weather.daily.temperature_2m_min[index],
        max: weather.daily.temperature_2m_max[index]
      }))
    : [];

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!city.trim()) return;
    fetchWeather(city.trim());
  };

  const handleUseLocation = () => {
    if (!navigator.geolocation) {
      setError('Geolocation is not supported in this browser.');
      return;
    }

    setLoading(true);
    navigator.geolocation.getCurrentPosition(
      async ({ coords }) => {
        try {
          const weatherResp = await axios.get('https://api.open-meteo.com/v1/forecast', {
            params: {
              latitude: coords.latitude,
              longitude: coords.longitude,
              current:
                'temperature_2m,apparent_temperature,relative_humidity_2m,precipitation,weather_code,wind_speed_10m',
              hourly: 'temperature_2m,weather_code',
              daily: 'weather_code,temperature_2m_max,temperature_2m_min,sunrise,sunset',
              timezone: 'auto',
              forecast_days: 7
            }
          });

          setWeather({
            city: 'Your Location',
            current: weatherResp.data.current,
            hourly: weatherResp.data.hourly,
            daily: weatherResp.data.daily,
            timezone: weatherResp.data.timezone
          });
          setError('');
        } catch (err) {
          setError('Could not fetch weather for your location.');
        } finally {
          setLoading(false);
        }
      },
      () => {
        setLoading(false);
        setError('Location access denied. Please search for a city manually.');
      }
    );
  };

  return (
    <div className="app-shell">
      <header className="topbar">
        <div className="brand">
          <div className="brand-icon">☀️</div>
          <span>WeatherFlow</span>
        </div>

        <form className="search-box" onSubmit={handleSubmit}>
          <input
            value={city}
            onChange={(e) => setCity(e.target.value)}
            placeholder="Search city..."
            aria-label="Search city"
          />
          <button type="submit" aria-label="Search weather">
            <Search size={16} />
          </button>
        </form>

        <button className="location-btn" onClick={handleUseLocation} type="button">
          Use My Location
        </button>
      </header>

      {loading ? (
        <div className="loading-state">
          <LoaderCircle className="spinner" size={32} />
          <p>Fetching live weather...</p>
        </div>
      ) : error ? (
        <div className="error-state">{error}</div>
      ) : weather ? (
        <main className="dashboard">
          <section className="card hero-card">
            <div className="hero-head">
              <div>
                <p className="eyebrow">
                  <MapPin size={14} /> {weather.city}
                </p>
                <h1>{Math.round(weather.current.temperature_2m)}°C</h1>
              </div>
              <div className="hero-icon">{currentMeta.icon}</div>
            </div>

            <div className="meta-grid">
              <div>
                <span className="label">Feels like</span>
                <strong>{Math.round(weather.current.apparent_temperature)}°C</strong>
              </div>
              <div>
                <span className="label">Condition</span>
                <strong>{currentMeta.label}</strong>
              </div>
              <div>
                <span className="label">Wind</span>
                <strong>{Math.round(weather.current.wind_speed_10m)} km/h</strong>
              </div>
            </div>
          </section>

          <section className="stats-grid">
            <div className="card stat-card">
              <div className="stat-header">
                <Droplets size={18} />
                <span>Humidity</span>
              </div>
              <strong>{Math.round(weather.current.relative_humidity_2m)}%</strong>
            </div>

            <div className="card stat-card">
              <div className="stat-header">
                <CloudRain size={18} />
                <span>Rain</span>
              </div>
              <strong>{Math.round(weather.current.precipitation)} mm</strong>
            </div>

            <div className="card stat-card">
              <div className="stat-header">
                <Sun size={18} />
                <span>Sunrise</span>
              </div>
              <strong>{formatClock(weather.daily.sunrise[0])}</strong>
            </div>

            <div className="card stat-card">
              <div className="stat-header">
                <CloudSun size={18} />
                <span>Sunset</span>
              </div>
              <strong>{formatClock(weather.daily.sunset[0])}</strong>
            </div>
          </section>

          <section className="card forecast-panel">
            <div className="panel-head">
              <CalendarDays size={18} />
              <h2>Hourly Forecast</h2>
            </div>
            <div className="hourly-grid">
              {hourlyCards.map((item) => {
                const meta = weatherCodes[item.code] || { icon: '🌤️', label: 'Weather' };
                return (
                  <div key={item.time} className="hour-item">
                    <span>{formatHour(item.time)}</span>
                    <div className="hour-icon">{meta.icon}</div>
                    <strong>{Math.round(item.temp)}°C</strong>
                  </div>
                );
              })}
            </div>
          </section>

          <section className="card forecast-panel">
            <div className="panel-head">
              <Gauge size={18} />
              <h2>7-Day Forecast</h2>
            </div>
            <div className="daily-list">
              {dailyCards.map((day) => {
                const meta = weatherCodes[day.code] || { icon: '🌤️', label: 'Weather' };
                return (
                  <div key={day.day} className="day-row">
                    <span className="day-name">{formatDay(day.day)}</span>
                    <span className="day-icon">{meta.icon}</span>
                    <span className="day-temp">{Math.round(day.min)}° / {Math.round(day.max)}°</span>
                    <span className="day-condition">{meta.label}</span>
                  </div>
                );
              })}
            </div>
          </section>
        </main>
      ) : null}
    </div>
  );
}

export default App;

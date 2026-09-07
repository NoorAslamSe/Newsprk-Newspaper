"use server";

/**
 * Fetches live weather data using entirely free APIs (no API key needed):
 *  - bigdatacloud.net  → reverse geocoding (lat/lon → city name)
 *  - open-meteo.com    → forward geocoding (city name → lat/lon)
 *  - open-meteo.com    → actual weather forecast
 *
 * Two entry paths: coordinates (from browser geolocation) or city name string.
 */
export async function getWeatherDataAction(options: { city?: string; lat?: number; lon?: number } = { city: "London" }) {
  try {
    let latitude: number;
    let longitude: number;
    let cityName: string;

    if (options.lat !== undefined && options.lon !== undefined) {
      // Path A: coordinates provided (browser Geolocation API)
      latitude = options.lat;
      longitude = options.lon;
      cityName = "Your Location";

      // Attempt to resolve a human-readable city name from the raw coordinates
      try {
        const reverseGeoRes = await fetch(`https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${latitude}&longitude=${longitude}&localityLanguage=en`);
        const reverseGeoData = await reverseGeoRes.json();
        if (reverseGeoData.city || reverseGeoData.locality) {
          cityName = reverseGeoData.city || reverseGeoData.locality;
        }
      } catch (e) {
        console.warn("Reverse geocoding failed:", e); // Non-fatal — falls back to "Your Location"
      }
    } else {
      // Path B: city name string → resolve to coordinates via Open-Meteo geocoding
      const city = options.city || "London";
      const geoRes = await fetch(`https://geocoding-api.open-meteo.com/v1/search?name=${city}&count=1&language=en&format=json`);
      const geoData = await geoRes.json();

      if (!geoData.results || geoData.results.length === 0) {
        throw new Error("City not found");
      }

      latitude = geoData.results[0].latitude;
      longitude = geoData.results[0].longitude;
      cityName = geoData.results[0].name;
    }
    
    // Fetch current conditions + today's high/low from Open-Meteo (no API key required)
    const weatherRes = await fetch(`https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current=temperature_2m,relative_humidity_2m,apparent_temperature,precipitation,weather_code,wind_speed_10m&daily=weather_code,temperature_2m_max,temperature_2m_min&timezone=auto`);
    const weatherData = await weatherRes.json();
    
    return {
      success: true,
      data: {
        city: cityName,
        temp: Math.round(weatherData.current.temperature_2m),
        high: Math.round(weatherData.daily.temperature_2m_max[0]),
        low: Math.round(weatherData.daily.temperature_2m_min[0]),
        wind: Math.round(weatherData.current.wind_speed_10m),
        conditionCode: weatherData.current.weather_code,
        isRain: weatherData.current.precipitation > 0 || [51, 53, 55, 61, 63, 65, 80, 81, 82].includes(weatherData.current.weather_code)
      }
    };
  } catch (error) {
    console.error("Weather data fetch error:", error);
    return { success: false, error: "Failed to fetch weather data" };
  }
}

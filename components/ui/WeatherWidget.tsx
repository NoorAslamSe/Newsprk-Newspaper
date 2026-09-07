"use client";

import { formatDate } from "@/lib/dateFormat";
import { useTranslations } from "@/hooks/useTranslations";

const forecast = [
  { day: "Sun", icon: "wi wi-day-sunny", temp: "45" },
  { day: "Mon", icon: "wi wi-day-cloudy-high", temp: "21" },
  { day: "Tue", icon: "wi wi-day-sleet", temp: "29" },
  { day: "Wed", icon: "wi wi-day-lightning", temp: "19" },
  { day: "Thu", icon: "wi wi-sleet", temp: "54" },
  { day: "Fri", icon: "wi wi-smog", temp: "68" },
  { day: "Sat", icon: "wi wi-lightning", temp: "28" },
];

export default function WeatherWidget() {
  const tWeather = useTranslations("widgets.weather");
  const today = new Date();
  const dateStr = formatDate(today.toISOString(), { weekday: "long", month: "long", day: "numeric" });

  return (
    <div
      className="mb-5 relative overflow-hidden"
      style={{
        backgroundImage: "url('/images/wethear-bg.jpg')",
        backgroundSize: "cover",
        backgroundPosition: "center",
        backgroundColor: "#fa424a",
        color: "#fff",
        textAlign: "center",
      }}
    >
      {/* Dark overlay */}
      <div
        className="absolute inset-0"
        style={{ backgroundColor: "rgba(0,0,0,0.35)" }}
      />

      {/* Content */}
      <div className="relative z-10">
        {/* Current Temperature + Icon */}
        <div
          className="flex items-center justify-center"
          style={{ padding: "50px 10px 0", lineHeight: 1 }}
        >
          {/* Temperature (left half) */}
          <div style={{ width: "50%", textAlign: "right", paddingRight: "10px" }}>
            <span
              style={{
                fontSize: "clamp(50px, 8vw, 70px)",
                fontWeight: 500,
                lineHeight: 1,
                fontFamily: "'Roboto', sans-serif",
              }}
            >
              39
            </span>
            <span
              style={{
                fontSize: "clamp(50px, 8vw, 70px)",
                position: "relative",
                top: "-6px",
                lineHeight: 1,
                verticalAlign: "top",
              }}
            >
              °
            </span>
            <span
              style={{
                fontSize: "16px",
                position: "relative",
                top: "-4px",
                fontWeight: 400,
                opacity: 0.6,
                left: "-2px",
                lineHeight: 1,
                verticalAlign: "top",
              }}
            >
              C
            </span>
          </div>

          {/* Weather Icon (right half) */}
          <div style={{ width: "50%", textAlign: "left", paddingLeft: "10px" }}>
            <i
              className="wi wi-day-lightning"
              style={{ fontSize: "clamp(50px, 8vw, 70px)" }}
            />
          </div>
        </div>

        {/* Weather Info */}
        <div style={{ padding: "20px 10px" }}>
          <div
            style={{
              fontSize: "21px",
              fontWeight: 300,
              fontFamily: "'Roboto', sans-serif",
              marginBottom: "4px",
            }}
          >
            {tWeather("partlySunny")}
          </div>
          <div style={{ fontSize: "14px", opacity: 0.8 }}>
            {tWeather("realFeel")}: 67<sup>°</sup>
          </div>
          <div style={{ fontSize: "14px", opacity: 0.8 }}>{tWeather("chanceOfRain")}</div>
        </div>

        {/* 7-Day Forecast */}
        <div
          className="flex"
          style={{
            backgroundColor: "rgba(255,255,255,0.1)",
            padding: "15px 20px",
            fontFamily: "'Roboto', sans-serif",
            lineHeight: 1,
          }}
        >
          {forecast.map((d) => (
            <div
              key={d.day}
              className="flex flex-col items-center"
              style={{ width: "14.28%", textAlign: "center", textTransform: "uppercase" }}
            >
              <div
                style={{
                  marginBottom: "10px",
                  fontSize: "12px",
                  fontWeight: 500,
                }}
              >
                {tWeather(d.day.toLowerCase())}
              </div>
              <div style={{ marginBottom: "10px" }}>
                <i className={d.icon} style={{ fontSize: "21px" }} />
              </div>
              <div
                style={{
                  fontSize: "15px",
                  position: "relative",
                  left: "4px",
                  lineHeight: "14px",
                  opacity: 0.7,
                }}
              >
                {d.temp}
                <span style={{ position: "relative", right: "5px" }}>°</span>
              </div>
            </div>
          ))}
        </div>

        {/* Footer */}
        <div
          className="flex justify-between"
          style={{ padding: "15px 10px 30px" }}
        >
          <span
            style={{
              fontSize: "21px",
              fontWeight: 300,
              fontFamily: "'Roboto', sans-serif",
            }}
          >
            {dateStr}
          </span>
          <span
            style={{
              fontSize: "21px",
              fontWeight: 300,
              fontFamily: "'Roboto', sans-serif",
            }}
          >
            {tWeather("location")}
          </span>
        </div>
      </div>
    </div>
  );
}

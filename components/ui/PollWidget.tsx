"use client";
import { useState } from "react";
import { useTranslations } from "@/hooks/useTranslations";

const options = [
  { label: "Yes, they have invested in developing talent", pct: 45 },
  { label: "No, this is restraint of trade", pct: 30 },
];

export default function PollWidget() {
  const tPoll = useTranslations("widgets.poll");
  const [selected, setSelected] = useState<number | null>(null);

  return (
    <div style={{ padding: "15px", marginTop: "20px" }}>
      <div style={{ padding: "0 0 10px", borderBottom: "2px solid #eb0254", marginBottom: "15px" }}>
        <h4 style={{ color: "var(--heading-color, #fff)", fontSize: "17px", fontWeight: 400, textTransform: "uppercase", margin: 0 }}>
          <strong>{tPoll("title")}</strong>
        </h4>
      </div>
      <form method="get" id="home_poll">
        <h6 style={{ color: "var(--heading-color, #fff)", fontSize: "15px", fontWeight: 600, marginBottom: "12px", lineHeight: "20px" }}>
          {tPoll("question")}
        </h6>
        <div className="space-y-2">
          {options.map((opt, i) => (
            <label key={i} className="flex items-start gap-2 cursor-pointer" style={{ color: "var(--excerpt-color, #bbb)", fontSize: "15px" }}>
              <input
                type="radio"
                name="poll"
                className="mt-1"
                style={{ accentColor: "#EF4444" }}
                onChange={() => setSelected(i)}
                checked={selected === i}
              />
              <span>{i === 0 ? tPoll("optionYes") : tPoll("optionNo")}</span>
            </label>
          ))}
        </div>
        <button type="button" className="mt-3" style={{ backgroundColor: "#EF4444", color: "#fff", padding: "6px 20px", fontSize: "12px", fontWeight: 600, border: "none", cursor: "pointer", letterSpacing: "0.5px", textTransform: "uppercase" }}>
          {tPoll("submit")}
        </button>
      </form>
    </div>
  );
}

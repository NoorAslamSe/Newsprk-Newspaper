import { upcomingMatches } from "@/lib/data";

export default function UpcomingMatches() {
  return (
    <section className="section-padding" style={{ background: "#f8f8f8" }}>
      <div className="container">
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "25px" }}>
          <h3 className="widget-title" style={{ border: 0, margin: 0, padding: 0 }}>Upcoming Matches</h3>
          <a href="#" className="see-all">See all</a>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
          {upcomingMatches.map((match) => (
            <div key={match.id} style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              padding: "15px 20px",
              background: "#fff",
              borderRadius: "5px",
              border: "1px solid #e9eaeb",
            }}>
              <div style={{ flex: 1 }}>
                <div style={{ display: "flex", alignItems: "center", gap: "15px" }}>
                  <div style={{ width: "40px", height: "40px", borderRadius: "50%", background: "#f0f0f1", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "12px", fontWeight: 600 }}>
                    {match.team1.substring(0, 3).toUpperCase()}
                  </div>
                  <span style={{ fontSize: "14px", fontWeight: 600, color: "#17222b" }}>{match.team1}</span>
                </div>
              </div>
              <div style={{ padding: "0 20px", textAlign: "center" }}>
                <div style={{
                  width: "60px",
                  height: "60px",
                  borderRadius: "50%",
                  border: "3px solid #1091ff",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  position: "relative",
                }}>
                  <svg width="60" height="60" viewBox="0 0 60 60" style={{ position: "absolute", top: 0, left: 0, transform: "rotate(-90deg)" }}>
                    <circle cx="30" cy="30" r="27" fill="none" stroke="#e9eaeb" strokeWidth="3" />
                    <circle cx="30" cy="30" r="27" fill="none" stroke="#1091ff" strokeWidth="3" strokeDasharray="170" strokeDashoffset="40" />
                  </svg>
                  <span style={{ fontSize: "11px", fontWeight: 600, color: "#17222b" }}>VS</span>
                </div>
              </div>
              <div style={{ flex: 1, textAlign: "right" }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "flex-end", gap: "15px" }}>
                  <span style={{ fontSize: "14px", fontWeight: 600, color: "#17222b" }}>{match.team2}</span>
                  <div style={{ width: "40px", height: "40px", borderRadius: "50%", background: "#f0f0f1", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "12px", fontWeight: 600 }}>
                    {match.team2.substring(0, 3).toUpperCase()}
                  </div>
                </div>
                <div style={{ fontSize: "12px", color: "#888e92", marginTop: "5px" }}>
                  {match.date} | {match.time}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

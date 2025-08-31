import React, { useState } from "react";
import { useAuth } from "../hooks/useAuth";

const normalize = (v: string) => v.trim().toLowerCase().replace(/\s+/g, " ");

export default function PasswordLock() {
  const { setFaction } = useAuth();
  const [value, setValue] = useState("");
  const [err, setErr] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const submit = (e?: React.FormEvent) => {
    e?.preventDefault();
    const v = normalize(value);
    if (v === "marines") {
      setBusy(true);
      setTimeout(() => setFaction("marines"), 250);
    } else if (v === "seals" || v === "navy seals") {
      setBusy(true);
      setTimeout(() => setFaction("seals"), 250);
    } else {
      setErr("access denied");
    }
  };

  return (
    <div style={{ minHeight: "100vh", display: "grid", placeItems: "center", padding: "2rem" }}>
      <section style={{ width: "100%", maxWidth: 640 }}>
        <header className="d-flex align-items-center gap-2 mb-2">
          <h1 className="h-ox fw-semibold fs-4 mb-0">SECURE ACCESS • UNIT VERIFICATION</h1>
          <span className="badge" style={{ background: "rgba(16,185,129,0.15)", color: "#6ee7b7" }}>
            Status: LOCKED
          </span>
        </header>

        <div className="card-frame">
          <div className="terminal">
            <div className="mb-2 d-flex align-items-center gap-2" style={{ color: "rgba(167,243,208,0.8)" }}>
              <span className="rounded-circle" style={{ width: 8, height: 8, background: "#34d399", boxShadow: "0 0 10px rgba(16,185,129,0.8)" }} />
              <span className="small">CHANNEL 33 • AUTH CONSOLE</span>
            </div>

            <form onSubmit={submit} className="d-flex gap-2">
              <input
                autoFocus
                aria-label="Enter unit password"
                value={value}
                onChange={(e) => { setValue(e.target.value); setErr(null); }}
                placeholder="Type marines or seals"
                className="h-ox"
                style={{
                  flex: 1,
                  padding: "0.75rem 0.9rem",
                  borderRadius: "0.5rem",
                  border: "1px solid rgba(16,185,129,0.35)",
                  background: "rgba(0,0,0,0.6)",
                  color: "rgba(167,243,208,0.95)",
                }}
              />
              <button
                type="submit"
                disabled={busy}
                className="h-ox"
                style={{
                  padding: "0.75rem 1rem",
                  borderRadius: "0.5rem",
                  border: "1px solid rgba(16,185,129,0.6)",
                  background: "rgba(17,24,39,0.9)",
                  color: "rgb(209,250,229)",
                  cursor: "pointer",
                }}
              >
                {busy ? "…" : "Enter"}
              </button>
            </form>

            {err && (
              <div className="mt-2 h-ox" style={{ color: "#fca5a5" }}>
                {err}
              </div>
            )}

            <div style={{ marginTop: "1rem", fontFamily: "VT323, monospace" }}>
              <span>awaiting credentials</span>
              <span className="cursor" />
            </div>
          </div>

          <div className="mt-2 d-flex justify-content-end">
            <button
              onClick={() => { setValue(""); setErr(null); }}
              title="clear input"
              style={{
                fontSize: 12,
                opacity: 0.75,
                textDecoration: "underline",
                background: "transparent",
                border: "none",
                color: "inherit",
                cursor: "pointer",
              }}
            >
              reset
            </button>
          </div>
        </div>
      </section>
    </div>
  );
}
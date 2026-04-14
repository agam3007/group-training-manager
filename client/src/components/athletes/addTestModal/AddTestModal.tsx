import { useEffect, useState } from "react";
import {
  ZONES_CONFIG,
  buildZones,
  type SportType,
  type MethodType,
} from "../../../types/zoneConfig";
import "./AddTestModal.css";

type Props = {
  onAdd: (test: any) => void;
  onClose: () => void;
};

type ZoneType = "3" | "5" | "7";

export default function AddTestModal({ onAdd, onClose }: Props) {
  const [sport, setSport] = useState<SportType>("run");
  const [method, setMethod] = useState<MethodType>("threshold");
  const [testType, setTestType] = useState<string>("");

  const [zoneCount, setZoneCount] = useState<ZoneType>("5");

  const [inputMode, setInputMode] = useState<"time" | "pace">("time");

  const [minutes, setMinutes] = useState("");
  const [seconds, setSeconds] = useState("");

  const [paceMin, setPaceMin] = useState("");
  const [paceSec, setPaceSec] = useState("");

  const [hr, setHr] = useState("");
  const [power, setPower] = useState("");

  const [zones, setZones] = useState<any>(null);

  const [customZones, setCustomZones] = useState<any>({
    pace: [60, 70, 80, 90, 100],
    hr: [60, 70, 80, 90, 100],
    power: [60, 70, 80, 90, 100],
  });

  const [distance, setDistance] = useState("");
  const [cssMode, setCssMode] = useState<"time" | "pace">("time");
  const [css400Min, setCss400Min] = useState("");
  const [css400Sec, setCss400Sec] = useState("");

  const [css200Min, setCss200Min] = useState("");
  const [css200Sec, setCss200Sec] = useState("");

  useEffect(() => {
    if (method === "custom") {
      const count = Number(zoneCount);

      setCustomZones({
        pace: Array(count).fill(60),
        hr: Array(count).fill(60),
        power: Array(count).fill(60),
      });
    }
  }, [zoneCount, method]);

  /* 🔥 METHODS לפי SPORT */
  const methodOptions = Object.keys(ZONES_CONFIG[sport] || {}) as MethodType[];

  /* 🔥 TESTS לפי SPORT+METHOD */
  const testOptions = Object.keys(ZONES_CONFIG[sport]?.[method]?.tests || {});

  /* 🔄 כשמשנים sport */
  useEffect(() => {
    const methods = Object.keys(ZONES_CONFIG[sport] || {}) as MethodType[];

    setMethod(methods[0] || "threshold");
  }, [sport]);

  /* 🔄 כשמשנים method */
  useEffect(() => {
    const tests = Object.keys(ZONES_CONFIG[sport]?.[method]?.tests || {});

    setTestType(tests[0] || "");
  }, [sport, method]);

  /* -------- DISTANCE -------- */

  const getDistance = () => {
    if (testType === "5k") return 5;
    if (testType === "10k") return 10;
    if (testType === "400m") return 0.4;
    if (testType === "1k") return 1;
    return 1;
  };

  /* -------- CALCULATE -------- */

  const calculate = () => {
    let pace = 0;
    let result: any;

    if (sport !== "bike") {
      if (inputMode === "time") {
        const total = Number(minutes) * 60 + Number(seconds);

        let dist = getDistance();
        if (sport === "swim") {
          if (method === "custom" && distance) {
            dist = Number(distance) / 100;
          } else {
            dist = dist * 10;
          }
          pace = total / dist;
        } else {
          // 🏃 run (km)
          if (method === "custom" && distance) {
            dist = Number(distance);
          }

          pace = total / dist;
        }
      } else {
        pace = Number(paceMin) * 60 + Number(paceSec);
      }
    }

    if (method === "custom") {
      result = {};

      if (showPace) {
        result.pace = customZones.pace.map((f: number) => pace / (f / 100));
      }

      if (showHR) {
        result.hr = customZones.hr.map((f: number) => Number(hr) * (f / 100));
      }

      if (showPower) {
        result.power = customZones.power.map(
          (f: number) => Number(power) * (f / 100),
        );
      }
    } else {
      if (sport === "swim" && testType === "css") {
        const t400 = Number(css400Min) * 60 + Number(css400Sec);

        const t200 = Number(css200Min) * 60 + Number(css200Sec);

        if (!t400 || !t200) {
          alert("Enter CSS values");
          return;
        }

        if (cssMode === "time") {
          // classic formula
          pace = (t400 - t200) / 2;
        } else {
          // אם הכניס pace ל־100m
          // צריך להפוך לזמן כולל קודם

          const total400 = t400 * 4;
          const total200 = t200 * 2;

          pace = (total400 - total200) / 2;
        }
      }
      result = buildZones({
        sport,
        method,
        testType,
        pace,
        hr: hr ? Number(hr) : undefined,
        power: power ? Number(power) : undefined,
      });
    }

    setZones(result);
  };

  /* -------- UPDATE ZONE -------- */

  const updateZone = (
    key: "pace" | "hr" | "power",
    index: number,
    value: number,
  ) => {
    const copy = { ...zones };
    copy[key][index] = value;
    setZones(copy);
  };

  /* -------- SAVE -------- */

  const submit = () => {
    if (!zones) return;

    let value = 0;

    if (sport === "bike") {
      value = Number(power);
    } else if (sport === "swim" && testType === "css") {
      value = Math.round(
        zones.pace[3] || zones.pace[zones.pace.length - 1] || 0,
      );
    } else {
      value = Number(minutes) * 60 + Number(seconds);
    }

    onAdd({
      id: Date.now().toString(),
      sport,
      type: testType,
      method,
      value,
      date: new Date().toISOString(),
      zones,
    });

    onClose();
  };

  /* 🔥 DISPLAY LOGIC */

  const showPace =
    sport !== "bike" &&
    method !== "max" &&
    !(sport === "swim" && testType === "css");
  const showHR = method !== "race" && sport !== "swim";
  const showPower = sport === "bike";
  const showDistance = method === "custom" && showPace && inputMode === "time";

  return (
    <div className="modal-overlay">
      <div className="modal large">
        <h3>Add Test</h3>

        {/* SPORT */}
        <select
          value={sport}
          onChange={(e) => setSport(e.target.value as SportType)}
        >
          <option value="run">🏃 Run</option>
          <option value="bike">🚴 Bike</option>
          <option value="swim">🏊 Swim</option>
        </select>

        {/* METHOD */}
        <select
          value={method}
          onChange={(e) => setMethod(e.target.value as MethodType)}
        >
          {methodOptions.map((m) => (
            <option key={m} value={m}>
              {m.toUpperCase()}
            </option>
          ))}
        </select>

        {/* TEST */}
        <select value={testType} onChange={(e) => setTestType(e.target.value)}>
          {testOptions.map((t) => (
            <option key={t} value={t}>
              {t.toUpperCase()}
            </option>
          ))}
        </select>
        {sport === "swim" && testType === "css" && (
          <div className="css-inputs">
            <h4>CSS Test</h4>

            {/* mode */}
            <select
              value={cssMode}
              onChange={(e) => setCssMode(e.target.value as any)}
            >
              <option value="time">Total Time</option>
              <option value="pace">Pace (/100m)</option>
            </select>

            {/* 400 */}
            <div>
              <label>400m</label>

              <div className="time-input">
                <input
                  placeholder="Min"
                  value={css400Min}
                  onChange={(e) => setCss400Min(e.target.value)}
                />
                :
                <input
                  placeholder="Sec"
                  value={css400Sec}
                  onChange={(e) => setCss400Sec(e.target.value)}
                />
              </div>
            </div>

            {/* 200 */}
            <div>
              <label>200m</label>

              <div className="time-input">
                <input
                  placeholder="Min"
                  value={css200Min}
                  onChange={(e) => setCss200Min(e.target.value)}
                />
                :
                <input
                  placeholder="Sec"
                  value={css200Sec}
                  onChange={(e) => setCss200Sec(e.target.value)}
                />
              </div>
            </div>
          </div>
        )}
        {/* INPUT MODE */}
        {showPace && (
          <select
            value={inputMode}
            onChange={(e) => setInputMode(e.target.value as any)}
          >
            <option value="time">Total Time</option>
            <option value="pace">Pace</option>
          </select>
        )}

        {/* INPUTS */}

        {showPace && inputMode === "time" && (
          <div className="time-input">
            <input
              placeholder="Min"
              value={minutes}
              onChange={(e) => setMinutes(e.target.value)}
            />
            :
            <input
              placeholder="Sec"
              value={seconds}
              onChange={(e) => setSeconds(e.target.value)}
            />
          </div>
        )}

        {showDistance && (
          <input
            type="number"
            placeholder={
              sport === "swim" ? "Distance (meters)" : "Distance (km)"
            }
            value={distance}
            onChange={(e) => setDistance(e.target.value)}
          />
        )}

        {showPace && inputMode === "pace" && (
          <div className="time-input">
            <input
              placeholder="Min/km"
              value={paceMin}
              onChange={(e) => setPaceMin(e.target.value)}
            />
            :
            <input
              placeholder="Sec"
              value={paceSec}
              onChange={(e) => setPaceSec(e.target.value)}
            />
          </div>
        )}

        {showPower && (
          <input
            placeholder="Watts"
            value={power}
            onChange={(e) => setPower(e.target.value)}
          />
        )}

        {showHR && (
          <input
            placeholder="Avg HR"
            value={hr}
            onChange={(e) => setHr(e.target.value)}
          />
        )}

        {method === "custom" && (
          <div className="custom-zones">
            <select
              value={zoneCount}
              onChange={(e) => setZoneCount(e.target.value as ZoneType)}
            >
              <option value="3">3 Zones</option>
              <option value="5">5 Zones</option>
              <option value="7">7 Zones</option>
            </select>

            <h4>Custom Zone %</h4>

            <table>
              <thead>
                <tr>
                  <th>Zone</th>
                  {showPace && <th>Pace %</th>}
                  {showHR && <th>HR %</th>}
                  {showPower && <th>Power %</th>}
                </tr>
              </thead>

              <tbody>
                {Array.from({ length: Number(zoneCount) }, (_, i) => (
                  <tr key={i}>
                    <td>Z{i + 1}</td>

                    {showPace && (
                      <td>
                        <input
                          value={customZones.pace[i]}
                          onChange={(e) => {
                            const copy = { ...customZones };
                            copy.pace[i] = Number(e.target.value);
                            setCustomZones(copy);
                          }}
                        />
                      </td>
                    )}

                    {showHR && (
                      <td>
                        <input
                          value={customZones.hr[i]}
                          onChange={(e) => {
                            const copy = { ...customZones };
                            copy.hr[i] = Number(e.target.value);
                            setCustomZones(copy);
                          }}
                        />
                      </td>
                    )}

                    {showPower && (
                      <td>
                        <input
                          value={customZones.power[i]}
                          onChange={(e) => {
                            const copy = { ...customZones };
                            copy.power[i] = Number(e.target.value);
                            setCustomZones(copy);
                          }}
                        />
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        <button onClick={calculate}>Calculate Zones</button>

        {/* PREVIEW */}
        {zones && (
          <ZonesPreview zones={zones} sport={sport} onChange={updateZone} />
        )}

        <div className="modal-buttons">
          <button onClick={submit}>Save</button>

          <button onClick={onClose}>Cancel</button>
        </div>
      </div>
    </div>
  );
}

/* -------- PREVIEW -------- */

function ZonesPreview({ zones, onChange }: any) {
  const format = (key: string, v: number) => {
    if (key === "power") {
      return `${Math.round(v)}w`;
    }

    if (key === "hr") {
      return `${Math.round(v)}`;
    }

    // pace
    const m = Math.floor(v / 60);
    const s = Math.round(v % 60);

    return `${m}:${s.toString().padStart(2, "0")}`;
  };

  const keys = Object.keys(zones);

  if (!keys.length) return null;

  return (
    <div className="zones-preview">
      <table>
        <thead>
          <tr>
            <th>Zone</th>
            {keys.map((k) => (
              <th key={k}>{k.toUpperCase()}</th>
            ))}
          </tr>
        </thead>

        <tbody>
          {zones[keys[0]].map((_: any, i: number) => (
            <tr key={i}>
              <td>Z{i + 1}</td>

              {keys.map((k) => (
                <td key={k}>
                  <input
                    value={format(k, zones[k][i])}
                    onChange={(e) => onChange(k, i, Number(e.target.value))}
                  />
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

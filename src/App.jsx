import React, { useMemo, useState } from "react";
import {
  ComposableMap,
  Geographies,
  Geography,
  Marker,
} from "react-simple-maps";
import { RadioTower, RotateCcw, Send } from "lucide-react";
import "./App.css";

const geoUrl = "https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json";
const REGIONS = {
  EU: {
    label: "Europe",
    code: 1,
    color: "#3b82f6",
    countries: [
      "Ireland",
      "United Kingdom",
      "France",
      "Germany",
      "Spain",
      "Portugal",
      "Italy",
      "Netherlands",
      "Belgium",
      "Switzerland",
      "Austria",
      "Poland",
      "Denmark",
      "Norway",
      "Sweden",
      "Finland",
      "Czechia",
      "Greece",
      "Romania",
      "Hungary",
      "Ukraine",
    ],
  },

 US_EAST: {
  label: "US East",
  code: 2,
  color: "#10b981",
  countries: ["United States of America", "United States"],
},

US_WEST: {
  label: "US West",
  code: 3,
  color: "#14b8a6",
  countries: [],
},

  AUS: {
    label: "Australia",
    code: 4,
    color: "#f97316",
    countries: ["Australia"],
  },

  ASIA: {
    label: "Asia",
    code: 5,
    color: "#a855f7",
    countries: [
      "China",
      "Japan",
      "South Korea",
      "North Korea",
      "Taiwan",
      "Mongolia",
    ],
  },
};

const BANDS = [
  { label: "80m", value: "80m", code: 1 },
  { label: "40m", value: "40m", code: 2 },
  { label: "20m", value: "20m", code: 3 },
  { label: "10m", value: "10m", code: 4 },
];

const TIME_BLOCKS = [
  { label: "00-02 UTC", value: "00-02", code: 1 },
  { label: "03-05 UTC", value: "03-05", code: 2 },
  { label: "06-08 UTC", value: "06-08", code: 3 },
  { label: "09-11 UTC", value: "09-11", code: 4 },
  { label: "12-14 UTC", value: "12-14", code: 5 },
  { label: "15-17 UTC", value: "15-17", code: 6 },
  { label: "18-20 UTC", value: "18-20", code: 7 },
  { label: "21-23 UTC", value: "21-23", code: 8 },
];

function getRegion(id) {
  if (!id) return null;
  return REGIONS[id] || null;
}

function getBand(value) {
  return BANDS.find((band) => band.value === value);
}

function getTimeBlock(value) {
  return TIME_BLOCKS.find((block) => block.value === value);
}

function getCountryName(geo) {
  return geo.properties.name || geo.properties.NAME || geo.properties.admin || "";
}

function getRegionFromCountry(countryName) {
  for (const [regionId, region] of Object.entries(REGIONS)) {
    if (region.countries.includes(countryName)) {
      return regionId;
    }
  }

  return null;
}

export default function App() {
  const [selectionMode, setSelectionMode] = useState("TX");
  const [txRegion, setTxRegion] = useState(null);
  const [rxRegion, setRxRegion] = useState(null);
  const [hoveredRegion, setHoveredRegion] = useState(null);
  const [band, setBand] = useState("20m");
  const [timeBlock, setTimeBlock] = useState("18-20");
  const [prediction, setPrediction] = useState(null);

  const tx = getRegion(txRegion);
  const rx = getRegion(rxRegion);
  const selectedBand = getBand(band);
  const selectedTimeBlock = getTimeBlock(timeBlock);

  const queryVector = useMemo(() => {
    if (!tx || !rx || !selectedBand || !selectedTimeBlock) {
      return null;
    }

    return {
      TimeBlock: selectedTimeBlock.code,
      BandCode: selectedBand.code,
      TXCode: tx.code,
      RXCode: rx.code,
      MATLABQuery: `[${selectedTimeBlock.code}; ${selectedBand.code}; ${tx.code}; ${rx.code}]`,
    };
  }, [tx, rx, selectedBand, selectedTimeBlock]);

  function handleRegionClick(regionId) {
    if (!regionId || !REGIONS[regionId]) return;

    if (selectionMode === "TX") {
      setTxRegion(regionId);
      setSelectionMode("RX");
    } else {
      setRxRegion(regionId);
    }

    setPrediction(null);
  }

  function resetSelection() {
    setTxRegion(null);
    setRxRegion(null);
    setSelectionMode("TX");
    setHoveredRegion(null);
    setPrediction(null);
  }

  function handlePredict() {
    if (!queryVector) return;

    const placeholderPrediction = Math.round(
      80 +
        queryVector.TimeBlock * 25 +
        queryVector.BandCode * 40 +
        queryVector.TXCode * 12 +
        queryVector.RXCode * 9
    );

    setPrediction(placeholderPrediction);
  }

  return (
    <main className="app">
      <section className="header">
        <div>
          <div className="small-title">
            <RadioTower size={22} />
            WSPR Spot Predictor
          </div>

          <h1>Interactive world map interface</h1>

          <p>
            Hover over Europe, Asia, or Australia to highlight their exact map
            shapes. Use the US East and US West markers for America. Click TX
            first, then RX.
          </p>
        </div>

        <button className="reset-button" onClick={resetSelection}>
          <RotateCcw size={18} />
          Reset
        </button>
      </section>

      <section className="layout">
        <div className="map-card">
          <div className="mode-box">
            <span>Selection mode</span>
            <strong>Click {selectionMode}</strong>
          </div>

          {hoveredRegion && REGIONS[hoveredRegion] && (
            <div className="hover-label">
              Hovering: {REGIONS[hoveredRegion].label}
            </div>
          )}

        <ComposableMap
  projection="geoEqualEarth"
  projectionConfig={{
    scale: 175,
    center: [10, 15],
  }}
  width={980}
  height={520}
  className="react-map"
>
            <Geographies geography={geoUrl}>
              {({ geographies }) =>
                geographies.map((geo) => {
                  const countryName = getCountryName(geo);
                  const regionId = getRegionFromCountry(countryName);
                  const region = getRegion(regionId);
                  const isSelected =
                    regionId && (txRegion === regionId || rxRegion === regionId);

                  return (
                    <Geography
                      key={geo.rsmKey}
                      geography={geo}
                      onMouseEnter={() => {
                        if (regionId && region) {
                          setHoveredRegion(regionId);
                        }
                      }}
                      onMouseLeave={() => setHoveredRegion(null)}
                      onClick={() => {
                        if (regionId && region) {
                          handleRegionClick(regionId);
                        }
                      }}
                      style={{
                        default: {
                          fill:
  isSelected && region
    ? region.color
    : hoveredRegion === regionId && region
    ? region.color
    : regionId && region
    ? "#d8dee9"
    : "#94a3b8",
                          stroke: "#0f172a",
                          strokeWidth: 0.4,
                          outline: "none",
                          cursor: regionId && region ? "pointer" : "default",
                        },
                        hover: {
                          fill:
                            regionId && region ? region.color : "#94a3b8",
                          stroke: "#ffffff",
                          strokeWidth: regionId && region ? 1.2 : 0.4,
                          outline: "none",
                          cursor: regionId && region ? "pointer" : "default",
                        },
                        pressed: {
                          fill:
                            regionId && region ? region.color : "#94a3b8",
                          outline: "none",
                        },
                      }}
                    />
                  );
                })
              }
            </Geographies>

            <Marker coordinates={[-118, 38]}>
              <g
                className="us-marker"
                onMouseEnter={() => setHoveredRegion("US_WEST")}
                onMouseLeave={() => setHoveredRegion(null)}
                onClick={() => handleRegionClick("US_WEST")}
              >
                <circle r={13} fill={REGIONS.US_WEST.color} />
                <text textAnchor="middle" y={32}>
                  US West
                </text>
              </g>
            </Marker>

            <Marker coordinates={[-76, 39]}>
              <g
                className="us-marker"
                onMouseEnter={() => setHoveredRegion("US_EAST")}
                onMouseLeave={() => setHoveredRegion(null)}
                onClick={() => handleRegionClick("US_EAST")}
              >
                <circle r={13} fill={REGIONS.US_EAST.color} />
                <text textAnchor="middle" y={32}>
                  US East
                </text>
              </g>
            </Marker>
          </ComposableMap>
        </div>

        <div className="side-panel">
          <div className="panel-card">
            <h2>Prediction setup</h2>

            <div className="tx-rx-grid">
              <button
                className={selectionMode === "TX" ? "active-choice" : ""}
                onClick={() => setSelectionMode("TX")}
              >
                <span>TX</span>
                <strong>{tx ? tx.label : "Choose on map"}</strong>
              </button>

              <button
                className={selectionMode === "RX" ? "active-choice" : ""}
                onClick={() => setSelectionMode("RX")}
              >
                <span>RX</span>
                <strong>{rx ? rx.label : "Choose on map"}</strong>
              </button>
            </div>

            <label>
              Band
              <select value={band} onChange={(e) => setBand(e.target.value)}>
                {BANDS.map((item) => (
                  <option key={item.value} value={item.value}>
                    {item.label}
                  </option>
                ))}
              </select>
            </label>

            <label>
              Time of day
              <select
                value={timeBlock}
                onChange={(e) => setTimeBlock(e.target.value)}
              >
                {TIME_BLOCKS.map((item) => (
                  <option key={item.value} value={item.value}>
                    {item.label}
                  </option>
                ))}
              </select>
            </label>

            <button
              className="predict-button"
              onClick={handlePredict}
              disabled={!queryVector}
            >
              <Send size={18} />
              Predict spots
            </button>
          </div>

          <div className="panel-card">
            <h2>Neural network input</h2>

            {queryVector ? (
              <>
                <div className="code-grid">
                  <div>TimeBlock: {queryVector.TimeBlock}</div>
                  <div>BandCode: {queryVector.BandCode}</div>
                  <div>TXCode: {queryVector.TXCode}</div>
                  <div>RXCode: {queryVector.RXCode}</div>
                </div>

                <pre>q = {queryVector.MATLABQuery}</pre>
              </>
            ) : (
              <p className="empty-message">Select both TX and RX regions.</p>
            )}

            {prediction !== null && (
              <div className="prediction-box">
                <span>Predicted number of spots</span>
                <strong>{prediction}</strong>
                <p>
                  Placeholder prediction. Later this can connect to your trained
                  MATLAB neural network.
                </p>
              </div>
            )}
          </div>
        </div>
      </section>
    </main>
  );
}
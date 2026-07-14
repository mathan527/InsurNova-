/**
 * FraudMap.jsx — GPS Spoofing Detection Map
 * Interactive map showing real vs spoofed GPS coordinates with fraud analysis.
 */
import { useState, useEffect, useRef } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polyline, Circle, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Fix Leaflet default icon issue with Vite
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
  iconUrl:       'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
  shadowUrl:     'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
});

// Custom icons
const fakeIcon = new L.DivIcon({
  html: `<div style="background:#ef4444;border:3px solid #fff;border-radius:50%;width:20px;height:20px;box-shadow:0 0 12px #ef4444,0 0 24px #ef444488;display:flex;align-items:center;justify-content:center;font-size:10px;">📍</div>`,
  className: '', iconSize: [24, 24], iconAnchor: [12, 12],
});
const realIcon = new L.DivIcon({
  html: `<div style="background:#22c55e;border:3px solid #fff;border-radius:50%;width:20px;height:20px;box-shadow:0 0 12px #22c55e,0 0 24px #22c55e88;display:flex;align-items:center;justify-content:center;font-size:10px;">🛵</div>`,
  className: '', iconSize: [24, 24], iconAnchor: [12, 12],
});
const alertIcon = new L.DivIcon({
  html: `<div style="background:#f59e0b;border:3px solid #fff;border-radius:50%;width:20px;height:20px;box-shadow:0 0 12px #f59e0b;display:flex;align-items:center;justify-content:center;font-size:10px;">⚠️</div>`,
  className: '', iconSize: [24, 24], iconAnchor: [12, 12],
});

// GPS Spoofing Cases
const FRAUD_CASES = [
  {
    id: 'CLM-2024-005',
    worker: 'Suresh P.',
    platform: 'Swiggy',
    event: 'Heavy Rain',
    fraudScore: 0.94,
    spoofApp: 'FakeGPS Pro v3.2',
    reported:  { lat: 12.9816, lng: 80.2209, zone: 'Velachery, Chennai', label: 'Reported (Fake)' },
    actual:    { lat: 12.9229, lng: 80.1275, zone: 'Tambaram, Chennai',   label: 'Actual Platform Ping' },
    distanceKm: 18.4,
    timeGapSec: 4,
    impliedSpeedKmh: 16560,
    flags: ['GPS_SPOOFING', 'VELOCITY_ANOMALY', 'FAKE_LOCATION', 'PLATFORM_DATA_MISMATCH'],
    reasons: [
      'GPS teleported 18.4 km in 4 seconds — impossible at any vehicle speed',
      'Mock GPS app signature: FakeGPS Pro v3.2',
      'IMD rain sensor grid shows no rain event at reported coordinates',
      'Platform records 0 deliveries during claimed loss window',
    ],
    color: '#ef4444',
  },
  {
    id: 'CLM-2024-004',
    worker: 'Manoj R.',
    platform: 'Zomato',
    event: 'Curfew',
    fraudScore: 0.72,
    spoofApp: 'Mock Locations (Android Dev)',
    reported:  { lat: 13.0827, lng: 80.2707, zone: 'Chennai Central', label: 'Reported (Fake)' },
    actual:    { lat: 12.8406, lng: 80.1534, zone: 'Sholinganallur',   label: 'Actual Platform Ping' },
    distanceKm: 27.1,
    timeGapSec: 6,
    impliedSpeedKmh: 16260,
    flags: ['GPS_ANOMALY', 'LOCATION_MISMATCH'],
    reasons: [
      'Device ping appeared in non-curfew zone',
      'GPS coordinates outside the declared curfew perimeter',
      'Platform last active location contradicts claim zone',
    ],
    color: '#f59e0b',
  },
  {
    id: 'CLM-2024-007',
    worker: 'Anitha K.',
    platform: 'Swiggy',
    event: 'Pollution AQI > 300',
    fraudScore: 0.61,
    spoofApp: 'GPS Joystick v2.1',
    reported:  { lat: 13.0359, lng: 80.2659, zone: 'Perambur, Chennai', label: 'Reported (Fake)' },
    actual:    { lat: 13.0569, lng: 80.2425, zone: 'Kolathur, Chennai',  label: 'Actual Platform Ping' },
    distanceKm: 3.2,
    timeGapSec: 2,
    impliedSpeedKmh: 5760,
    flags: ['VELOCITY_ANOMALY', 'AQI_ZONE_MISMATCH'],
    reasons: [
      'AQI sensor at reported location registered only 187 — below 300 threshold',
      'Device moved 3.2 km in 2 seconds — impossible',
      'GPS Joystick app detected in device signature',
    ],
    color: '#a855f7',
  },
];

// Map auto-fitter component
function MapBoundsFitter({ positions }) {
  const map = useMap();
  useEffect(() => {
    if (positions.length >= 2) {
      const bounds = L.latLngBounds(positions);
      map.fitBounds(bounds, { padding: [60, 60] });
    }
  }, [positions, map]);
  return null;
}

export default function FraudMap() {
  const [selectedCase, setSelectedCase] = useState(FRAUD_CASES[0]);
  const [scanning, setScanning] = useState(false);
  const [scanResult, setScanResult] = useState(null);
  const [scanLog, setScanLog] = useState([]);
  const logRef = useRef(null);

  useEffect(() => {
    if (logRef.current) logRef.current.scrollTop = logRef.current.scrollHeight;
  }, [scanLog]);

  function addLog(msg, type = 'info') {
    const ts = new Date().toLocaleTimeString('en-US', { hour12: false });
    setScanLog(prev => [...prev.slice(-30), { msg, type, ts }]);
  }

  async function runScan() {
    setScanning(true);
    setScanResult(null);
    setScanLog([]);
    const c = selectedCase;

    addLog(`[INIT] Starting GPS fraud scan for ${c.id}...`, 'info');
    await delay(400);
    addLog(`[GPS] Reported coordinates: ${c.reported.lat}°N, ${c.reported.lng}°E`, 'info');
    await delay(350);
    addLog(`[GPS] Platform last ping: ${c.actual.lat}°N, ${c.actual.lng}°E`, 'info');
    await delay(400);
    addLog(`[CALC] Distance delta: ${c.distanceKm} km in ${c.timeGapSec}s`, 'warn');
    await delay(350);
    addLog(`[CALC] Implied speed: ${c.impliedSpeedKmh.toLocaleString()} km/h — IMPOSSIBLE`, 'risk');
    await delay(400);
    addLog(`[SENSOR] Cross-referencing IMD weather grid...`, 'info');
    await delay(500);
    addLog(`[SENSOR] Event not registered at spoofed coordinates`, 'risk');
    await delay(350);
    addLog(`[DEVICE] Scanning device fingerprint...`, 'info');
    await delay(400);
    addLog(`[DEVICE] Mock GPS app detected: ${c.spoofApp}`, 'risk');
    await delay(350);
    addLog(`[ML] Running fraud classifier v2.4...`, 'ai');
    await delay(600);
    addLog(`[ML] Fraud score: ${(c.fraudScore * 100).toFixed(0)}%`, c.fraudScore > 0.7 ? 'risk' : 'warn');
    await delay(350);
    addLog(`[RESULT] ${c.fraudScore > 0.7 ? '⛔ CLAIM BLOCKED — GPS SPOOFING CONFIRMED' : '⚠ CLAIM FLAGGED — MANUAL REVIEW REQUIRED'}`, c.fraudScore > 0.7 ? 'risk' : 'warn');
    setScanResult(c);
    setScanning(false);
  }

  const positions = [
    [selectedCase.reported.lat, selectedCase.reported.lng],
    [selectedCase.actual.lat,   selectedCase.actual.lng],
  ];

  return (
    <div className="space-y-6 animate-fade-in-up">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="page-title">📡 GPS Fraud Detection Map</h1>
          <p className="text-sm mt-1" style={{ color: 'var(--text-muted)' }}>
            Real-time GPS spoofing analysis — comparing reported vs actual platform coordinates
          </p>
        </div>
        <div className="flex items-center gap-2">
          <div className="live-dot" />
          <span className="text-xs font-mono" style={{ color: 'var(--neon-green)' }}>
            {FRAUD_CASES.length} ACTIVE CASES
          </span>
        </div>
      </div>

      {/* Case selector */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {FRAUD_CASES.map((c) => (
          <button
            key={c.id}
            onClick={() => { setSelectedCase(c); setScanResult(null); setScanLog([]); }}
            className="text-left rounded-2xl p-4 transition-all duration-200"
            style={{
              background: selectedCase.id === c.id
                ? `linear-gradient(135deg, ${c.color}22, ${c.color}11)`
                : 'var(--bg-surface)',
              border: `2px solid ${selectedCase.id === c.id ? c.color : 'var(--glass-border)'}`,
              outline: 'none',
            }}
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-mono" style={{ color: c.color }}>🚨 {c.id}</span>
              <span className="badge badge-danger text-xs">{(c.fraudScore * 100).toFixed(0)}%</span>
            </div>
            <p className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>{c.worker}</p>
            <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>{c.platform} · {c.event}</p>
            <div className="flex flex-wrap gap-1 mt-2">
              {c.flags.slice(0, 2).map(f => (
                <span key={f} className="text-xs px-1.5 py-0.5 rounded font-mono"
                  style={{ background: `${c.color}22`, color: c.color, border: `1px solid ${c.color}44` }}>
                  {f}
                </span>
              ))}
            </div>
          </button>
        ))}
      </div>

      {/* Main content: Map + Scanner */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">

        {/* Map - 3/5 width */}
        <div className="lg:col-span-3 rounded-2xl overflow-hidden" style={{
          border: '1px solid var(--glass-border)',
          height: 460,
          background: 'var(--bg-surface)',
        }}>
          <div className="flex items-center gap-2 px-4 py-2.5" style={{
            background: 'rgba(0,0,0,0.3)',
            borderBottom: '1px solid var(--glass-border)',
          }}>
            <span className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>
              🗺 Live GPS Map — {selectedCase.id}
            </span>
            <span className="ml-auto text-xs" style={{ color: 'var(--text-muted)' }}>Chennai, Tamil Nadu</span>
          </div>

          <MapContainer
            center={[selectedCase.reported.lat, selectedCase.reported.lng]}
            zoom={11}
            style={{ height: 'calc(100% - 42px)', width: '100%' }}
            zoomControl={true}
          >
            <TileLayer
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              attribution='&copy; <a href="https://openstreetmap.org">OpenStreetMap</a>'
            />
            <MapBoundsFitter positions={positions} />

            {/* Fake/reported location */}
            <Marker position={[selectedCase.reported.lat, selectedCase.reported.lng]} icon={fakeIcon}>
              <Popup>
                <div style={{ minWidth: 180 }}>
                  <p style={{ color: '#ef4444', fontWeight: 700, marginBottom: 4 }}>📍 Spoofed Location</p>
                  <p style={{ fontSize: 12, margin: 0 }}>{selectedCase.reported.zone}</p>
                  <p style={{ fontSize: 11, color: '#666', margin: '2px 0 0' }}>
                    {selectedCase.reported.lat}°N, {selectedCase.reported.lng}°E
                  </p>
                  <p style={{ fontSize: 11, color: '#ef4444', marginTop: 4 }}>
                    App: {selectedCase.spoofApp}
                  </p>
                </div>
              </Popup>
            </Marker>

            {/* Pulse circle around fake location */}
            <Circle
              center={[selectedCase.reported.lat, selectedCase.reported.lng]}
              radius={1500}
              pathOptions={{ color: '#ef4444', fillColor: '#ef4444', fillOpacity: 0.08, dashArray: '6 4' }}
            />

            {/* Real/actual location */}
            <Marker position={[selectedCase.actual.lat, selectedCase.actual.lng]} icon={realIcon}>
              <Popup>
                <div style={{ minWidth: 180 }}>
                  <p style={{ color: '#22c55e', fontWeight: 700, marginBottom: 4 }}>🛵 Actual Location</p>
                  <p style={{ fontSize: 12, margin: 0 }}>{selectedCase.actual.zone}</p>
                  <p style={{ fontSize: 11, color: '#666', margin: '2px 0 0' }}>
                    {selectedCase.actual.lat}°N, {selectedCase.actual.lng}°E
                  </p>
                  <p style={{ fontSize: 11, color: '#22c55e', marginTop: 4 }}>Platform verified ping</p>
                </div>
              </Popup>
            </Marker>

            <Circle
              center={[selectedCase.actual.lat, selectedCase.actual.lng]}
              radius={1000}
              pathOptions={{ color: '#22c55e', fillColor: '#22c55e', fillOpacity: 0.08 }}
            />

            {/* Line connecting the two showing impossible travel */}
            <Polyline
              positions={positions}
              pathOptions={{
                color: '#ef4444', weight: 3, dashArray: '8 6', opacity: 0.9,
              }}
            />
          </MapContainer>
        </div>

        {/* Right panel: Stats + Scanner */}
        <div className="lg:col-span-2 space-y-4">

          {/* Velocity anomaly stats */}
          <div className="card">
            <h3 className="text-sm font-semibold mb-3" style={{ color: 'var(--text-primary)' }}>
              ⚡ Velocity Analysis
            </h3>
            <div className="grid grid-cols-2 gap-3">
              {[
                { label: 'Distance Gap',   value: `${selectedCase.distanceKm} km`,     color: 'var(--neon-red)' },
                { label: 'Time Window',    value: `${selectedCase.timeGapSec} seconds`, color: 'var(--neon-yellow)' },
                { label: 'Implied Speed',  value: `${selectedCase.impliedSpeedKmh.toLocaleString()} km/h`, color: 'var(--neon-red)' },
                { label: 'Fraud Score',    value: `${(selectedCase.fraudScore * 100).toFixed(0)}%`, color: selectedCase.fraudScore > 0.7 ? 'var(--neon-red)' : 'var(--neon-yellow)' },
              ].map((s, i) => (
                <div key={i} className="rounded-xl p-3 text-center" style={{
                  background: 'rgba(255,255,255,0.03)',
                  border: `1px solid ${s.color}30`,
                }}>
                  <div className="text-lg font-bold font-mono" style={{ color: s.color }}>{s.value}</div>
                  <div className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>{s.label}</div>
                </div>
              ))}
            </div>

            {/* Flags */}
            <div className="flex flex-wrap gap-1.5 mt-3">
              {selectedCase.flags.map(f => (
                <span key={f} className="text-xs px-2 py-0.5 rounded-full font-mono"
                  style={{ background: 'rgba(239,68,68,0.15)', color: '#f87171', border: '1px solid rgba(239,68,68,0.3)' }}>
                  🚨 {f}
                </span>
              ))}
            </div>
          </div>

          {/* Reasons */}
          <div className="card">
            <h3 className="text-sm font-semibold mb-2" style={{ color: 'var(--text-primary)' }}>🔎 Detection Reasons</h3>
            <ul className="space-y-2">
              {selectedCase.reasons.map((r, i) => (
                <li key={i} className="text-xs rounded-lg px-3 py-2 flex gap-2"
                  style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.15)', color: '#fca5a5' }}>
                  <span style={{ color: '#ef4444' }}>▸</span> {r}
                </li>
              ))}
            </ul>
          </div>

          {/* Scan button */}
          <button
            onClick={runScan}
            disabled={scanning}
            className="btn-primary w-full flex items-center justify-center gap-2"
          >
            {scanning
              ? <><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> Scanning...</>
              : <>🔬 Run AI Fraud Scan</>
            }
          </button>
        </div>
      </div>

      {/* Scanner terminal */}
      {(scanLog.length > 0 || scanning) && (
        <div className="card">
          <div className="flex items-center gap-2 mb-3">
            <div className={scanning ? 'live-dot' : 'live-dot-red'} />
            <h3 className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>
              🖥 AI Fraud Scanner Terminal
            </h3>
            {scanResult && (
              <span className={`badge ml-auto ${scanResult.fraudScore > 0.7 ? 'badge-danger' : 'badge-warning'}`}>
                {scanResult.fraudScore > 0.7 ? '⛔ GPS SPOOFING CONFIRMED' : '⚠ FLAGGED FOR REVIEW'}
              </span>
            )}
          </div>
          <div
            ref={logRef}
            className="rounded-xl p-3 overflow-y-auto space-y-1"
            style={{ height: 220, background: 'rgba(0,0,0,0.5)', border: '1px solid rgba(255,255,255,0.05)' }}
          >
            {scanLog.map((log, i) => (
              <div key={i} className={`log-entry log-${log.type} text-xs`}>
                <span style={{ color: 'var(--text-muted)', marginRight: 8 }}>{log.ts}</span>
                {log.msg}
              </div>
            ))}
            {scanning && (
              <div className="text-xs font-mono animate-blink" style={{ color: 'var(--neon-cyan)' }}>▮</div>
            )}
          </div>
        </div>
      )}

      {/* GPS Evidence Card */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
        <div className="card">
          <h3 className="text-sm font-semibold mb-3" style={{ color: 'var(--neon-red)' }}>📍 Reported (Spoofed) Coordinates</h3>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span style={{ color: 'var(--text-muted)' }}>Zone</span>
              <span className="font-mono" style={{ color: 'var(--text-primary)' }}>{selectedCase.reported.zone}</span>
            </div>
            <div className="flex justify-between">
              <span style={{ color: 'var(--text-muted)' }}>Latitude</span>
              <span className="font-mono" style={{ color: '#f87171' }}>{selectedCase.reported.lat}°N</span>
            </div>
            <div className="flex justify-between">
              <span style={{ color: 'var(--text-muted)' }}>Longitude</span>
              <span className="font-mono" style={{ color: '#f87171' }}>{selectedCase.reported.lng}°E</span>
            </div>
            <div className="flex justify-between">
              <span style={{ color: 'var(--text-muted)' }}>Spoof App</span>
              <span className="font-mono text-xs" style={{ color: 'var(--neon-red)' }}>{selectedCase.spoofApp}</span>
            </div>
          </div>
        </div>

        <div className="card">
          <h3 className="text-sm font-semibold mb-3" style={{ color: 'var(--neon-green)' }}>🛵 Actual Platform Coordinates</h3>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span style={{ color: 'var(--text-muted)' }}>Zone</span>
              <span className="font-mono" style={{ color: 'var(--text-primary)' }}>{selectedCase.actual.zone}</span>
            </div>
            <div className="flex justify-between">
              <span style={{ color: 'var(--text-muted)' }}>Latitude</span>
              <span className="font-mono" style={{ color: '#4ade80' }}>{selectedCase.actual.lat}°N</span>
            </div>
            <div className="flex justify-between">
              <span style={{ color: 'var(--text-muted)' }}>Longitude</span>
              <span className="font-mono" style={{ color: '#4ade80' }}>{selectedCase.actual.lng}°E</span>
            </div>
            <div className="flex justify-between">
              <span style={{ color: 'var(--text-muted)' }}>Source</span>
              <span className="font-mono text-xs" style={{ color: 'var(--neon-green)' }}>{selectedCase.platform} API verified</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

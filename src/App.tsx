import React, { useEffect, useState, useRef } from "react";
import { 
  ShieldAlert, ShieldCheck, Activity, Terminal, Globe, 
  Settings, Network, Cpu, AlertTriangle, Play, Pause,
  Server, Lock, HardDrive, RefreshCw
} from "lucide-react";
import CyberLoader from "./components/CyberLoader";
import CyberGlobe from "./components/CyberGlobe";
import { CyberAttack, DefenseStats } from "./types";

export default function App() {
  const [isLoaderFinished, setIsLoaderFinished] = useState(false);
  const [isGlobeReady, setIsGlobeReady] = useState(false);
  
  // Real-time attack feed states
  const [attacksFeed, setAttacksFeed] = useState<CyberAttack[]>([]);
  const [lastAttack, setLastAttack] = useState<CyberAttack | null>(null);
  const [totalCount, setTotalCount] = useState(1480);
  const [attackTypeCounts, setAttackTypeCounts] = useState<Record<string, number>>({
    DDOS: 521,
    MALWARE: 340,
    PHISHING: 198,
    EXPLOIT: 220,
    BRUTE_FORCE: 110,
    RANSOMWARE: 91
  });

  // REST stats state
  const [stats, setStats] = useState<DefenseStats>({
    activeThreatsCount: 1420,
    mitigationRate: "99.98%",
    criticalIncidents: 3,
    lastDefendedPort: 443,
    systemStatus: "SECURE"
  });

  // Interactive self-defense states
  const [shieldsActive, setShieldsActive] = useState({
    cloudflareProxy: true,
    packetInspection: false,
    bruteForceDeflector: true,
    portSentinel: true
  });

  // Fetch initial stats from the REST server
  useEffect(() => {
    fetch("/api/defense-stats")
      .then((res) => {
        if (!res.ok) throw new Error("Network status invalid");
        return res.json();
      })
      .then((data: DefenseStats) => setStats(data))
      .catch((err) => console.error("Error fetching secure API stats:", err));
  }, []);

  // WebSockets live synchronization engine
  useEffect(() => {
    let ws: WebSocket | null = null;
    let reconnectTimeout: NodeJS.Timeout;

    function connectWS() {
      const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
      const wsUrl = `${protocol}//${window.location.host}`;
      ws = new WebSocket(wsUrl);

      ws.onmessage = (event) => {
        try {
          const attack: CyberAttack = JSON.parse(event.data);
          
          setLastAttack(attack);
          
          // Add to sliding log window (max 30 logs)
          setAttacksFeed((prev) => [attack, ...prev.slice(0, 29)]);
          
          // Fluctuate total attacks counter
          setTotalCount((c) => c + 1);

          // Update attack category metrics
          setAttackTypeCounts((prev) => ({
            ...prev,
            [attack.type]: (prev[attack.type] || 0) + 1
          }));

          // Fluctuate stats dynamically
          setStats((prev) => ({
            ...prev,
            activeThreatsCount: Math.floor(Math.random() * 200) + 1300,
            lastDefendedPort: attack.port
          }));
        } catch (err) {
          console.error("WS parse error:", err);
        }
      };

      ws.onclose = () => {
        console.log("WebSocket feed lost. Retrying link in 4 seconds...");
        reconnectTimeout = setTimeout(connectWS, 4000);
      };

      ws.onerror = (err) => {
        console.error("WS connection anomaly:", err);
        ws?.close();
      };
    }

    connectWS();

    return () => {
      if (ws) ws.close();
      clearTimeout(reconnectTimeout);
    };
  }, []);

  // Compute stats helper
  const totalSumOfRegisteredAttacks = (Object.values(attackTypeCounts) as number[]).reduce((a, b) => a + b, 0);

  return (
    <div className="relative min-h-screen bg-[#030509] text-gray-200 overflow-x-hidden selection:bg-cyan-500 selection:text-black">
      {/* 1. Sleek loading screen */}
      <CyberLoader 
        isReady={isGlobeReady} 
        onComplete={() => setIsLoaderFinished(true)} 
      />

      {/* Background ambient digital noise */}
      <div 
        className="absolute inset-0 opacity-[0.015] pointer-events-none"
        style={{
          backgroundImage: "linear-gradient(#00f0ff 1px, transparent 1px), linear-gradient(90deg, #00f0ff 1px, transparent 1px)",
          backgroundSize: "40px 40px"
        }}
      />

      {/* Main Container */}
      <div className="flex flex-col min-h-screen p-3 md:p-6 max-w-[1700px] mx-auto z-10 relative">
        
        {/* UPPER CONSOLE HEADER */}
        <header className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 mb-6 pb-4 border-b border-cyan-950/60">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-cyan-950/40 border border-cyan-800/80 rounded shadow-[0_0_15px_rgba(6,182,212,0.15)]">
              <ShieldAlert className="w-6 h-6 text-cyan-400 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl md:text-2xl font-bold tracking-widest text-white font-sans">
                  NEURAL THREAT VIGIL
                </h1>
                <span className="text-[9px] bg-cyan-950 border border-cyan-800 text-cyan-400 px-1.5 py-0.5 rounded font-mono">
                  LIVE FEED_
                </span>
              </div>
              <p className="text-xs text-cyan-600/80 font-mono tracking-wider">
                REAL-TIME GLOBAL CYBER WARFARE COMPILER
              </p>
            </div>
          </div>

          {/* Quick HUD telemetry metrics */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 w-full lg:w-auto text-xs font-mono">
            <div className="p-2.5 rounded bg-[#070b14] border border-cyan-950/80 flex flex-col justify-center">
              <span className="text-cyan-600 text-[10px] uppercase">Threat Severity</span>
              <span className="text-orange-500 font-bold flex items-center gap-1 mt-0.5">
                <AlertTriangle className="w-3.5 h-3.5 animate-bounce" /> ELEVATED
              </span>
            </div>

            <div className="p-2.5 rounded bg-[#070b14] border border-cyan-950/80 flex flex-col justify-center">
              <span className="text-cyan-600 text-[10px] uppercase">Active Mitigations</span>
              <span className="text-emerald-400 font-bold mt-0.5">{stats.mitigationRate}</span>
            </div>

            <div className="p-2.5 rounded bg-[#070b14] border border-cyan-950/80 flex flex-col justify-center">
              <span className="text-cyan-600 text-[10px] uppercase">Target Lock count</span>
              <span className="text-white font-bold mt-0.5">{totalCount.toLocaleString()}</span>
            </div>

            <div className="p-2.5 rounded bg-[#070b14] border border-cyan-950/80 flex flex-col justify-center">
              <span className="text-cyan-600 text-[10px] uppercase">Shield Integrity</span>
              <span className="text-cyan-400 font-bold flex items-center gap-1 mt-0.5">
                <ShieldCheck className="w-3.5 h-3.5 text-cyan-400" /> SECURE
              </span>
            </div>
          </div>
        </header>

        {/* MAIN TELEMETRY WORKSPACE */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch flex-1">
          
          {/* LEFT CONSOLE: SECURE ATTACKS LIVE FEED (Lg: 4/12 width) */}
          <section className="lg:col-span-4 xl:col-span-4 flex flex-col bg-[#05080f]/75 border border-cyan-950/60 rounded-xl p-4 backdrop-blur-md shadow-2xl h-[450px] lg:h-auto min-h-[400px]">
            <div className="flex justify-between items-center border-b border-cyan-950/70 pb-2.5 mb-3 select-none">
              <div className="flex items-center gap-2">
                <Terminal className="w-4 h-4 text-cyan-400" />
                <h2 className="text-xs font-bold tracking-widest uppercase font-mono text-cyan-300">
                  DEFENSE STREAM LOGS
                </h2>
              </div>
              <span className="text-[10px] font-mono text-cyan-600">
                BUFF_MAX: 30_SEC
              </span>
            </div>

            {/* Scrollable logs screen */}
            <div id="attacks-logs-viewport" className="flex-1 overflow-y-auto pr-1 space-y-2 text-xs font-mono scrollbar-thin scrollbar-thumb-cyan-950">
              {attacksFeed.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-cyan-800 text-center p-6">
                  <RefreshCw className="w-8 h-8 text-cyan-900 animate-spin mb-2" />
                  <p className="text-[11px] uppercase tracking-wider">Awaiting Secure Socket handshake...</p>
                </div>
              ) : (
                attacksFeed.map((atk, index) => {
                  const isCrit = atk.severity === "critical" || atk.severity === "high";
                  return (
                    <div
                      key={atk.id}
                      className={`p-2.5 rounded border transition-all duration-300 ${
                        index === 0 
                          ? "bg-cyan-950/15 border-cyan-500/30 animate-pulse" 
                          : "bg-black/40 border-cyan-950/40 hover:border-cyan-900/60"
                      }`}
                    >
                      {/* Log meta header */}
                      <div className="flex justify-between items-center mb-1 text-[10px]">
                        <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold ${
                          isCrit 
                            ? "bg-red-950/60 border border-red-900 text-red-400" 
                            : "bg-cyan-950/40 border border-cyan-900/50 text-cyan-400"
                        }`}>
                          {atk.type}
                        </span>
                        <span className="text-cyan-700">
                          {new Date(atk.timestamp).toLocaleTimeString()}
                        </span>
                      </div>

                      {/* Vector path mapping */}
                      <div className="grid grid-cols-5 items-center gap-1 py-1 text-cyan-100">
                        <div className="col-span-2 truncate">
                          <div className="font-semibold text-white truncate" title={atk.source.country}>
                            {atk.source.country}
                          </div>
                          <div className="text-[9px] text-cyan-600 tracking-tight">{atk.source.ip}</div>
                        </div>
                        
                        <div className="text-center text-cyan-600 font-bold font-mono text-[10px]">
                          &gt;&gt;&gt;
                        </div>

                        <div className="col-span-2 text-right truncate">
                          <div className="font-semibold text-white truncate" title={atk.target.country}>
                            {atk.target.country}
                          </div>
                          <div className="text-[9px] text-cyan-600 tracking-tight">{atk.target.ip}</div>
                        </div>
                      </div>

                      {/* Diagnostic details */}
                      <div className="flex justify-between items-center border-t border-cyan-950/40 pt-1 mt-1 text-[10px] text-cyan-600">
                        <span>PORT: <strong className="text-cyan-400 font-medium">{atk.port}</strong></span>
                        <span>BURST: <strong className="text-cyan-400 font-medium">{atk.byteSize}B</strong></span>
                        <span className={isCrit ? "text-red-400 font-semibold" : "text-cyan-400 font-semibold"}>
                          {atk.severity.toUpperCase()}
                        </span>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </section>

          {/* CENTER COGNITIVE STAGE: 3D THREE.JS GLOBE (Lg: 5/12 width) */}
          <section className="lg:col-span-5 xl:col-span-5 flex flex-col">
            <CyberGlobe 
              lastAttack={lastAttack} 
              onGlobeReady={() => setIsGlobeReady(true)} 
            />
          </section>

          {/* RIGHT PANELS: INTERACTIVE MATRIX CONTROLS & THREAT ANALYSIS (Lg: 3/12 width) */}
          <section className="lg:col-span-3 xl:col-span-3 flex flex-col gap-6">
            
            {/* 1. THREAT QUANTIFIER METRICS */}
            <div className="bg-[#05080f]/75 border border-cyan-950/60 rounded-xl p-4 backdrop-blur-md shadow-lg font-mono">
              <h2 className="text-xs font-bold tracking-widest text-cyan-300 uppercase flex items-center gap-2 mb-3 select-none">
                <Network className="w-4 h-4 text-cyan-400" />
                THREAT INCIDENCE RATIOS
              </h2>

              <div className="space-y-3 text-xs">
                {Object.entries(attackTypeCounts).map(([type, count]) => {
                  const countNum = count as number;
                  const percentage = Math.round((countNum / totalSumOfRegisteredAttacks) * 100) || 15;
                  const getProgressColor = () => {
                    if (type === "DDOS" || type === "RANSOMWARE") return "bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.5)]";
                    if (type === "MALWARE" || type === "EXPLOIT") return "bg-orange-500 shadow-[0_0_8px_rgba(249,115,22,0.5)]";
                    return "bg-cyan-400 shadow-[0_0_8px_rgba(34,211,238,0.5)]";
                  };

                  return (
                    <div key={type} className="flex flex-col">
                      <div className="flex justify-between items-center mb-1 text-[11px]">
                        <span className="text-white font-semibold">{type}</span>
                        <span className="text-cyan-500">{countNum.toLocaleString()} ({percentage}%)</span>
                      </div>
                      <div className="h-1.5 w-full bg-cyan-950/40 rounded border border-cyan-900/40 overflow-hidden">
                        <div 
                          className={`h-full rounded ${getProgressColor()} transition-all duration-500`}
                          style={{ width: `${percentage}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* 2. INTERACTIVE DEFENSIBILITY HUB */}
            <div className="bg-[#05080f]/75 border border-cyan-950/60 rounded-xl p-4 backdrop-blur-md shadow-lg font-mono flex-1 flex flex-col">
              <h2 className="text-xs font-bold tracking-widest text-cyan-300 uppercase flex items-center gap-2 mb-3.5 select-none">
                <Settings className="w-4 h-4 text-cyan-400" />
                SHIELD PROTOCOL OVERRIDES
              </h2>

              <p className="text-[11px] text-cyan-600/90 leading-relaxed mb-4">
                Toggle active cloud mitigation agents. Overriding shields will dynamically update routing.
              </p>

              <div className="space-y-3.5 flex-1 flex flex-col justify-center">
                {/* Protocol 1: Cloudflare Integration */}
                <div className="flex items-center justify-between p-2.5 rounded bg-black/40 border border-cyan-950/60">
                  <div className="flex gap-2.5 items-center">
                    <Server className={`w-4 h-4 ${shieldsActive.cloudflareProxy ? "text-cyan-400" : "text-cyan-800"}`} />
                    <div>
                      <div className="text-xs text-white font-semibold">Cloudflare Shield</div>
                      <div className="text-[9px] text-cyan-600">PROXY DDOS ABSORPTION</div>
                    </div>
                  </div>
                  <button
                    onClick={() => setShieldsActive(prev => ({ ...prev, cloudflareProxy: !prev.cloudflareProxy }))}
                    className={`text-[10px] font-bold tracking-widest px-3 py-1 rounded transition duration-200 border uppercase ${
                      shieldsActive.cloudflareProxy 
                        ? "bg-emerald-950/50 border-emerald-800 text-emerald-400" 
                        : "bg-red-950/40 border-red-900/60 text-red-500"
                    }`}
                  >
                    {shieldsActive.cloudflareProxy ? "Active" : "Bypassed"}
                  </button>
                </div>

                {/* Protocol 2: Deep Packet Inspection */}
                <div className="flex items-center justify-between p-2.5 rounded bg-black/40 border border-cyan-950/60">
                  <div className="flex gap-2.5 items-center">
                    <Cpu className={`w-4 h-4 ${shieldsActive.packetInspection ? "text-cyan-400" : "text-cyan-800"}`} />
                    <div>
                      <div className="text-xs text-white font-semibold">DPI Inspection</div>
                      <div className="text-[9px] text-cyan-600">STRICT PAYLOAD ANALYSIS</div>
                    </div>
                  </div>
                  <button
                    onClick={() => setShieldsActive(prev => ({ ...prev, packetInspection: !prev.packetInspection }))}
                    className={`text-[10px] font-bold tracking-widest px-3 py-1 rounded transition duration-200 border uppercase ${
                      shieldsActive.packetInspection 
                        ? "bg-emerald-950/50 border-emerald-800 text-emerald-400" 
                        : "bg-cyan-950/40 border-cyan-900/50 text-cyan-500"
                    }`}
                  >
                    {shieldsActive.packetInspection ? "Active" : "Inactive"}
                  </button>
                </div>

                {/* Protocol 3: Brute Force Deflection */}
                <div className="flex items-center justify-between p-2.5 rounded bg-black/40 border border-cyan-950/60">
                  <div className="flex gap-2.5 items-center">
                    <Lock className={`w-4 h-4 ${shieldsActive.bruteForceDeflector ? "text-cyan-400" : "text-cyan-800"}`} />
                    <div>
                      <div className="text-xs text-white font-semibold">SSH Sentinel</div>
                      <div className="text-[9px] text-cyan-600">IP BRUTEFORCE SHUNTING</div>
                    </div>
                  </div>
                  <button
                    onClick={() => setShieldsActive(prev => ({ ...prev, bruteForceDeflector: !prev.bruteForceDeflector }))}
                    className={`text-[10px] font-bold tracking-widest px-3 py-1 rounded transition duration-200 border uppercase ${
                      shieldsActive.bruteForceDeflector 
                        ? "bg-emerald-950/50 border-emerald-800 text-emerald-400" 
                        : "bg-cyan-950/40 border-cyan-900/50 text-cyan-500"
                    }`}
                  >
                    {shieldsActive.bruteForceDeflector ? "Active" : "Inactive"}
                  </button>
                </div>

                {/* Protocol 4: Port Sentinel */}
                <div className="flex items-center justify-between p-2.5 rounded bg-black/40 border border-cyan-950/60">
                  <div className="flex gap-2.5 items-center">
                    <HardDrive className={`w-4 h-4 ${shieldsActive.portSentinel ? "text-cyan-400" : "text-cyan-800"}`} />
                    <div>
                      <div className="text-xs text-white font-semibold">Port Deflector</div>
                      <div className="text-[9px] text-cyan-600">PORT HOVER ESCAPE</div>
                    </div>
                  </div>
                  <button
                    onClick={() => setShieldsActive(prev => ({ ...prev, portSentinel: !prev.portSentinel }))}
                    className={`text-[10px] font-bold tracking-widest px-3 py-1 rounded transition duration-200 border uppercase ${
                      shieldsActive.portSentinel 
                        ? "bg-emerald-950/50 border-emerald-800 text-emerald-400" 
                        : "bg-cyan-950/40 border-cyan-900/50 text-cyan-500"
                    }`}
                  >
                    {shieldsActive.portSentinel ? "Active" : "Inactive"}
                  </button>
                </div>
              </div>
            </div>
          </section>

        </div>

        {/* COMPREHENSIVE BOTTOM TERMINAL STATUS STRIP */}
        <footer className="mt-6 flex flex-col md:flex-row justify-between items-center gap-3 p-3 bg-[#05080f]/80 border border-cyan-950/60 rounded-xl text-[11px] font-mono select-none">
          <div className="flex items-center gap-2 text-cyan-500">
            <Activity className="w-4 h-4 text-cyan-400 animate-pulse" />
            <span>SYS_CORE: <strong className="text-emerald-400">NORMAL_OPERATION</strong></span>
            <span className="text-cyan-800">|</span>
            <span>CYBER_SHIELD: <strong className="text-cyan-400">CF_DEFENSIVE</strong></span>
            <span className="text-cyan-800">|</span>
            <span className="hidden sm:inline">LAST_MITIGATED_IP: <strong className="text-cyan-400">185.220.101.{Math.floor(Math.random() * 255)}</strong></span>
          </div>
          <div className="text-cyan-600/80">
            SECURE NETWORK GATEWAY // UTC SECURE TIMESTAMP: {new Date().toISOString()}
          </div>
        </footer>
      </div>
    </div>
  );
}

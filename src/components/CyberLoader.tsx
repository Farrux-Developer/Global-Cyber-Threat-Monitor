import React, { useEffect, useState } from "react";
import { ShieldAlert, Terminal, Cpu } from "lucide-react";

interface CyberLoaderProps {
  onComplete: () => void;
  isReady: boolean;
}

export default function CyberLoader({ onComplete, isReady }: CyberLoaderProps) {
  const [progress, setProgress] = useState(0);
  const [logs, setLogs] = useState<string[]>([
    "INITIALIZING THREAT INTELLIGENCE NODE...",
    "ESTABLISHING SECURE WEBSOCKET LINK...",
  ]);
  const [fadeOut, setFadeOut] = useState(false);

  // Dynamic status messages
  const loadMessages = [
    "LOADING PROXY HOPS [STRICT SECURITY ACTIVE]...",
    "ISOLATING LANDMASS COORDINATE MATRICES...",
    "GENERATING FIBONACCI DOT MATRIX GLOBE...",
    "MOUNTING CYBER ATTACK ARC COMPILER...",
    "BOOTSTRAPPING NEON PARTICLES BLENDING SYSTEM...",
    "GLOBAL SHIELD SYSTEMS ONLINE."
  ];

  useEffect(() => {
    let messageIndex = 0;
    const interval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          clearInterval(interval);
          return 100;
        }
        
        // Occasionally append logs based on progress
        if (Math.random() > 0.6 && messageIndex < loadMessages.length) {
          setLogs((l) => [...l.slice(-4), loadMessages[messageIndex++]]);
        }
        
        return prev + Math.floor(Math.random() * 8) + 4;
      });
    }, 120);

    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (progress >= 100 && isReady) {
      setFadeOut(true);
      const timeout = setTimeout(() => {
        onComplete();
      }, 800); // fade out duration
      return () => clearTimeout(timeout);
    }
  }, [progress, isReady, onComplete]);

  return (
    <div
      id="cyber-loader-container"
      className={`fixed inset-0 z-50 flex flex-col items-center justify-center bg-[#05060a] text-cyan-400 font-mono transition-opacity duration-700 ease-in-out ${
        fadeOut ? "opacity-0 pointer-events-none" : "opacity-100"
      }`}
    >
      {/* Background neon grid */}
      <div 
        id="cyber-loader-grid"
        className="absolute inset-0 opacity-[0.03] pointer-events-none"
        style={{
          backgroundImage: "linear-gradient(#00f0ff 1px, transparent 1px), linear-gradient(90deg, #00f0ff 1px, transparent 1px)",
          backgroundSize: "32px 32px"
        }}
      />

      <div id="cyber-loader-card" className="relative max-w-lg w-full mx-4 p-8 rounded-lg border border-cyan-950 bg-[#070911]/90 shadow-[0_0_50px_rgba(6,182,212,0.1)]">
        {/* Neon corner brackets */}
        <div className="absolute top-0 left-0 w-4 h-4 border-t-2 border-l-2 border-cyan-400" />
        <div className="absolute top-0 right-0 w-4 h-4 border-t-2 border-r-2 border-cyan-400" />
        <div className="absolute bottom-0 left-0 w-4 h-4 border-b-2 border-l-2 border-cyan-400" />
        <div className="absolute bottom-0 right-0 w-4 h-4 border-b-2 border-r-2 border-cyan-400" />

        <div className="flex items-center gap-3 mb-6">
          <div className="p-2.5 rounded-md bg-cyan-950/40 border border-cyan-800 animate-pulse">
            <ShieldAlert className="w-6 h-6 text-cyan-400" />
          </div>
          <div>
            <h1 className="text-lg font-bold tracking-widest text-white uppercase">Threat Map Console</h1>
            <p className="text-xs text-cyan-600">v4.18.2 // SECURE CONNECTION</p>
          </div>
        </div>

        {/* Dynamic bar progress */}
        <div className="mb-4">
          <div className="flex justify-between text-xs mb-1.5 font-medium">
            <span className="flex items-center gap-1.5"><Cpu className="w-3.5 h-3.5 text-cyan-500 animate-spin" /> SYSTEM DIAGNOSTICS</span>
            <span>{Math.min(progress, 100)}%</span>
          </div>
          <div className="h-2 w-full bg-cyan-950/60 rounded overflow-hidden border border-cyan-900">
            <div
              className="h-full bg-gradient-to-r from-cyan-600 via-cyan-400 to-teal-400 shadow-[0_0_12px_#22d3ee] transition-all duration-150 ease-out"
              style={{ width: `${Math.min(progress, 100)}%` }}
            />
          </div>
        </div>

        {/* Log feed */}
        <div id="cyber-loader-logs" className="border border-cyan-950 bg-black/60 p-4 rounded h-32 overflow-hidden text-[11px] leading-relaxed select-none">
          <div className="flex items-center gap-1.5 text-cyan-500 border-b border-cyan-950 pb-1 mb-2">
            <Terminal className="w-3.5 h-3.5" />
            <span className="font-semibold text-xs tracking-wide">CONSOLE OUTPUT</span>
          </div>
          <div className="space-y-1">
            {logs.map((log, idx) => (
              <div key={idx} className="flex gap-2 items-start">
                <span className="text-cyan-600 font-bold select-none">&gt;</span>
                <span className={idx === logs.length - 1 ? "text-white animate-pulse" : "text-cyan-500/80"}>
                  {log}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

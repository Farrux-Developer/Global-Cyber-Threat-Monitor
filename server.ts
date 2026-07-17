import express from "express";
import path from "path";
import http from "http";
import cors from "cors";
import helmet from "helmet";
import { WebSocketServer, WebSocket } from "ws";
import { createServer as createViteServer } from "vite";

interface Location {
  country: string;
  city: string;
  lat: number;
  lng: number;
}

// 18 realistic geographic hubs across continents for high-fidelity simulation
const LOCATIONS: Location[] = [
  { country: "United States", city: "Washington DC", lat: 38.9072, lng: -77.0369 },
  { country: "United States", city: "Silicon Valley", lat: 37.7749, lng: -122.4194 },
  { country: "Russia", city: "Moscow", lat: 55.7558, lng: 37.6173 },
  { country: "China", city: "Beijing", lat: 39.9042, lng: 116.4074 },
  { country: "Germany", city: "Berlin", lat: 52.5200, lng: 13.4050 },
  { country: "Brazil", city: "São Paulo", lat: -23.5505, lng: -46.6333 },
  { country: "Australia", city: "Sydney", lat: -33.8688, lng: 151.2093 },
  { country: "South Africa", city: "Johannesburg", lat: -26.2041, lng: 28.0473 },
  { country: "Japan", city: "Tokyo", lat: 35.6762, lng: 139.6503 },
  { country: "India", city: "Mumbai", lat: 19.0760, lng: 72.8777 },
  { country: "United Kingdom", city: "London", lat: 51.5074, lng: -0.1278 },
  { country: "France", city: "Paris", lat: 48.8566, lng: 2.3522 },
  { country: "Canada", city: "Toronto", lat: 43.6532, lng: -79.3832 },
  { country: "South Korea", city: "Seoul", lat: 37.5665, lng: 126.9780 },
  { country: "Singapore", city: "Singapore", lat: 1.3521, lng: 103.8198 },
  { country: "Saudi Arabia", city: "Riyadh", lat: 24.7136, lng: 46.6753 },
  { country: "Ukraine", city: "Kyiv", lat: 50.4501, lng: 30.5234 },
  { country: "Sweden", city: "Stockholm", lat: 59.3293, lng: 18.0686 }
];

const ATTACK_TYPES = [
  { type: "DDOS", severity: "critical", ports: [80, 443, 53, 8080] },
  { type: "MALWARE", severity: "high", ports: [445, 135, 139, 3389] },
  { type: "PHISHING", severity: "medium", ports: [25, 587, 465, 143] },
  { type: "EXPLOIT", severity: "critical", ports: [80, 443, 8000, 8443] },
  { type: "BRUTE_FORCE", severity: "medium", ports: [22, 23, 3306, 5432] },
  { type: "RANSOMWARE", severity: "critical", ports: [445, 139, 21, 22] }
];

function generateRandomIP(): string {
  return Array.from({ length: 4 }, () => Math.floor(Math.random() * 256)).join(".");
}

function generateAttackData() {
  const sourceIdx = Math.floor(Math.random() * LOCATIONS.length);
  let targetIdx = Math.floor(Math.random() * LOCATIONS.length);
  while (targetIdx === sourceIdx) {
    targetIdx = Math.floor(Math.random() * LOCATIONS.length);
  }

  const source = LOCATIONS[sourceIdx];
  const target = LOCATIONS[targetIdx];
  const attackMeta = ATTACK_TYPES[Math.floor(Math.random() * ATTACK_TYPES.length)];
  const port = attackMeta.ports[Math.floor(Math.random() * attackMeta.ports.length)];

  return {
    id: `atk_${Math.random().toString(36).substr(2, 9)}`,
    source: {
      country: source.country,
      city: source.city,
      ip: generateRandomIP(),
      lat: source.lat,
      lng: source.lng
    },
    target: {
      country: target.country,
      city: target.city,
      ip: generateRandomIP(),
      lat: target.lat,
      lng: target.lng
    },
    type: attackMeta.type,
    severity: attackMeta.severity,
    timestamp: Date.now(),
    port,
    byteSize: Math.floor(Math.random() * 9800) + 200
  };
}

async function startServer() {
  const app = express();
  const PORT = 3000;

  // 1. Security Enhancements
  // Custom Helmet configuration optimized for WebGL, WebSockets and AI Studio preview frames
  app.use(
    helmet({
      contentSecurityPolicy: {
        directives: {
          defaultSrc: ["'self'"],
          scriptSrc: ["'self'", "'unsafe-inline'", "'unsafe-eval'"],
          styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
          fontSrc: ["'self'", "https://fonts.gstatic.com", "data:"],
          imgSrc: ["'self'", "data:", "blob:", "https://*"],
          connectSrc: ["'self'", "ws:", "wss:", "https://*", "http://*"],
          canvasSrc: ["'self'"],
          frameAncestors: ["'self'", "https://*.run.app", "https://ai.studio", "https://*.google.com"],
        },
      },
      crossOriginEmbedderPolicy: false,
      crossOriginResourcePolicy: { policy: "cross-origin" },
    })
  );

  app.use(cors({ origin: "*" }));
  app.use(express.json());

  // Memory-efficient request rate-limiter to protect key endpoints
  const ipLimits = new Map<string, { count: number; resetTime: number }>();
  const RATE_LIMIT_WINDOW = 60 * 1000; // 1 minute
  const RATE_LIMIT_MAX = 150; // max 150 reqs/min

  app.use((req, res, next) => {
    const ip = req.ip || req.socket.remoteAddress || "unknown";
    const now = Date.now();
    const limit = ipLimits.get(ip);

    if (!limit || now > limit.resetTime) {
      ipLimits.set(ip, { count: 1, resetTime: now + RATE_LIMIT_WINDOW });
      next();
    } else {
      limit.count++;
      if (limit.count > RATE_LIMIT_MAX) {
        res.status(429).json({ error: "Too many requests. Cyber defense active." });
      } else {
        next();
      }
    }
  });

  // Clean rate limit map occasionally to prevent leaks
  setInterval(() => {
    const now = Date.now();
    for (const [ip, limit] of ipLimits.entries()) {
      if (now > limit.resetTime) {
        ipLimits.delete(ip);
      }
    }
  }, 5 * 60 * 1000);

  // 2. REST API Endpoints
  app.get("/api/health", (req, res) => {
    res.json({ status: "healthy", timestamp: Date.now() });
  });

  app.get("/api/defense-stats", (req, res) => {
    // Generate some dynamic overall statistics for the UI
    res.json({
      activeThreatsCount: Math.floor(Math.random() * 450) + 1200,
      mitigationRate: "99.98%",
      criticalIncidents: Math.floor(Math.random() * 5) + 1,
      lastDefendedPort: 443,
      systemStatus: "SECURE"
    });
  });

  // Create HTTP Server
  const server = http.createServer(app);

  // 3. WebSocket Real-time Feed Server
  const wss = new WebSocketServer({ noServer: true });

  server.on("upgrade", (request, socket, head) => {
    wss.handleUpgrade(request, socket, head, (ws) => {
      wss.emit("connection", ws, request);
    });
  });

  wss.on("connection", (ws: WebSocket) => {
    console.log("CyberMap client connected securely via WS.");

    // Send an initial packet immediately
    for (let i = 0; i < 5; i++) {
      ws.send(JSON.stringify(generateAttackData()));
    }

    // Ping mechanism to detect broken connections
    let isAlive = true;
    ws.on("pong", () => {
      isAlive = true;
    });

    const pingInterval = setInterval(() => {
      if (!isAlive) {
        clearInterval(pingInterval);
        return ws.terminate();
      }
      isAlive = false;
      ws.ping();
    }, 30000);

    ws.on("close", () => {
      clearInterval(pingInterval);
      console.log("CyberMap client disconnected.");
    });
  });

  // Broadcast realistic simulated attacks continuously
  const broadcastInterval = setInterval(() => {
    if (wss.clients.size > 0) {
      const data = JSON.stringify(generateAttackData());
      wss.clients.forEach((client) => {
        if (client.readyState === WebSocket.OPEN) {
          client.send(data);
        }
      });
    }
  }, 600); // Send a new attack event every 600ms on average

  // 4. Vite Dev Server vs Production bundle serving
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  // Bind server
  server.listen(PORT, "0.0.0.0", () => {
    console.log(`Server fully operational at http://localhost:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error("Failed to start secure cyber server:", err);
});

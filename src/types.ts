export interface LocationInfo {
  country: string;
  city: string;
  ip: string;
  lat: number;
  lng: number;
}

export interface CyberAttack {
  id: string;
  source: LocationInfo;
  target: LocationInfo;
  type: "DDOS" | "MALWARE" | "PHISHING" | "EXPLOIT" | "BRUTE_FORCE" | "RANSOMWARE";
  severity: "low" | "medium" | "high" | "critical";
  timestamp: number;
  port: number;
  byteSize: number;
}

export interface DefenseStats {
  activeThreatsCount: number;
  mitigationRate: string;
  criticalIncidents: number;
  lastDefendedPort: number;
  systemStatus: string;
}

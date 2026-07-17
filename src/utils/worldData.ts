/**
 * Procedural Geography Engine
 * High-performance mathematical map representing Earth's landmasses and seas.
 * Eliminates the need for external high-res textures, making the app offline-friendly,
 * ultra-fast, and visually stunning as a high-tech holographic sphere.
 */

export function isLand(lat: number, lng: number): boolean {
  // Simple sinusoidal noise to create organic shorelines, islands, and coastlines
  const noise =
    Math.sin(lat * 0.35) * Math.cos(lng * 0.35) * 4.5 +
    Math.sin(lat * 1.1 + lng * 0.65) * 1.8 +
    Math.cos(lat * 0.75 - lng * 1.4) * 1.2;

  interface Continent {
    lat: number;
    lng: number;
    radius: number;
    eccX?: number; // Horizontal stretch
    eccY?: number; // Vertical stretch
  }

  const continents: Continent[] = [
    // Eurasia (Europe + Asia major mass)
    { lat: 48, lng: 80, radius: 46, eccX: 1.8, eccY: 0.8 },
    // Siberia & East Asia extension
    { lat: 60, lng: 110, radius: 28, eccX: 1.4, eccY: 1.0 },
    // Europe extension
    { lat: 50, lng: 15, radius: 18, eccX: 1.2, eccY: 0.9 },
    // India sub-continent
    { lat: 20, lng: 78, radius: 12, eccX: 0.8, eccY: 1.2 },
    // Indochina / SE Asia
    { lat: 15, lng: 105, radius: 14, eccX: 1.1, eccY: 1.1 },
    // North America (Major mass)
    { lat: 50, lng: -100, radius: 30, eccX: 1.5, eccY: 1.1 },
    // Alaska & North-West
    { lat: 62, lng: -145, radius: 15, eccX: 1.4, eccY: 0.8 },
    // South America
    { lat: -16, lng: -60, radius: 24, eccX: 0.85, eccY: 1.5 },
    // Africa (Major Mass)
    { lat: 5, lng: 20, radius: 25, eccX: 0.95, eccY: 1.35 },
    // Australia
    { lat: -25, lng: 134, radius: 16, eccX: 1.3, eccY: 0.9 },
    // Greenland
    { lat: 72, lng: -40, radius: 11, eccX: 1.0, eccY: 1.25 },
    // Antarctica (Ring around South Pole)
    { lat: -82, lng: 0, radius: 16, eccX: 2.2, eccY: 0.5 },
    // Japan
    { lat: 36, lng: 138, radius: 6, eccX: 0.4, eccY: 1.4 },
    // Madagascar
    { lat: -19, lng: 47, radius: 5, eccX: 0.4, eccY: 1.2 },
    // United Kingdom / Ireland
    { lat: 55, lng: -4, radius: 6, eccX: 0.6, eccY: 1.1 },
    // New Zealand
    { lat: -41, lng: 172, radius: 6, eccX: 0.4, eccY: 1.3 }
  ];

  for (const c of continents) {
    let dLng = lng - c.lng;
    // Handle longitude wrapping around 180 degrees
    if (dLng > 180) dLng -= 360;
    if (dLng < -180) dLng += 360;

    const cosLat = Math.cos((lat * Math.PI) / 180);
    const ex = c.eccX || 1.0;
    const ey = c.eccY || 1.0;

    // Distorted coordinate space calculation
    const distance = Math.sqrt(
      Math.pow((dLng * cosLat) / ex, 2) + Math.pow((lat - c.lat) / ey, 2)
    );

    if (distance < c.radius + noise) {
      // Exclude specific major water bodies for accuracy (e.g. Mediterranean, Red Sea, Great Lakes)
      // Mediterranean exclusion
      if (lat > 31 && lat < 44 && lng > -4 && lng < 36 && distance > 10) {
        return false;
      }
      // Red Sea exclusion
      if (lat > 14 && lat < 28 && lng > 32 && lng < 43) {
        return false;
      }
      return true;
    }
  }

  return false;
}

/**
 * Helper to convert Lat/Lng coordinate to 3D Cartesian space on a sphere of a given radius
 */
import * as THREE from "three";

export function latLngToVector3(lat: number, lng: number, radius: number): THREE.Vector3 {
  const phi = (90 - lat) * (Math.PI / 180);
  const theta = (lng + 180) * (Math.PI / 180);

  return new THREE.Vector3(
    -(radius * Math.sin(phi) * Math.sin(theta)),
    radius * Math.cos(phi),
    radius * Math.sin(phi) * Math.cos(theta)
  );
}

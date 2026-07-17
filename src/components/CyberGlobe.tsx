import React, { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import { CyberAttack } from "../types";
import { isLand, latLngToVector3 } from "../utils/worldData";
import { Globe, ZoomIn, ZoomOut, RotateCcw } from "lucide-react";

interface CyberGlobeProps {
  lastAttack: CyberAttack | null;
  onGlobeReady: () => void;
}

const GLOBE_RADIUS = 5.0;

export default function CyberGlobe({ lastAttack, onGlobeReady }: CyberGlobeProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  
  // Keep mutable Three.js references safe from React re-renders
  const sceneRef = useRef<THREE.Scene | null>(null);
  const globeGroupRef = useRef<THREE.Group | null>(null);
  const activeAttacksRef = useRef<{
    id: string;
    curve: THREE.QuadraticBezierCurve3;
    line: THREE.Line;
    particle: THREE.Mesh;
    startTime: number;
    duration: number;
    rippleTriggered: boolean;
    attack: CyberAttack;
  }[]>([]);
  const activeRipplesRef = useRef<{
    mesh: THREE.Mesh;
    startTime: number;
    duration: number;
    maxRadius: number;
  }[]>([]);

  // Interactive states
  const [rotationSpeed, setRotationSpeed] = useState<number>(0.001);
  const [zoomLevel, setZoomLevel] = useState<number>(12);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);

  // Mouse interaction state variables
  const isDragging = useRef(false);
  const previousMousePosition = useRef({ x: 0, y: 0 });
  const targetRotation = useRef({ x: 0, y: 0.8 }); // starting angles
  const currentRotation = useRef({ x: 0, y: 0.8 });
  const rotationVelocity = useRef({ x: 0, y: 0 });

  // Handle incoming attacks
  useEffect(() => {
    if (!lastAttack || !sceneRef.current || !globeGroupRef.current) return;

    const scene = sceneRef.current;
    const globeGroup = globeGroupRef.current;

    // Convert coordinates to 3D points
    const start = latLngToVector3(lastAttack.source.lat, lastAttack.source.lng, GLOBE_RADIUS);
    const end = latLngToVector3(lastAttack.target.lat, lastAttack.target.lng, GLOBE_RADIUS);

    // Calculate arc control point elevated above the sphere
    const mid = new THREE.Vector3().addVectors(start, end).multiplyScalar(0.5);
    const distance = start.distanceTo(end);
    const elevation = GLOBE_RADIUS + Math.max(distance * 0.45, 1.2); // curved arc height
    mid.normalize().multiplyScalar(elevation);

    // Create Spline Curve
    const curve = new THREE.QuadraticBezierCurve3(start, mid, end);
    const points = curve.getPoints(50);
    const lineGeometry = new THREE.BufferGeometry().setFromPoints(points);

    // Color gradient across the attack line path
    const colors: number[] = [];
    const isCritical = lastAttack.severity === "critical" || lastAttack.severity === "high";
    
    for (let i = 0; i <= 50; i++) {
      const t = i / 50;
      if (isCritical) {
        // Red (source) to Bright Violet/Purple (destination)
        colors.push(1.0 - t * 0.3, 0.0, 0.1 + t * 0.9);
      } else {
        // Neon Cyan (source) to Bright Teal/Yellow-Green (destination)
        colors.push(t * 0.2, 0.9 - t * 0.4, 1.0 - t * 0.5);
      }
    }
    lineGeometry.setAttribute("color", new THREE.Float32BufferAttribute(colors, 3));

    const lineMaterial = new THREE.LineBasicMaterial({
      vertexColors: true,
      transparent: true,
      opacity: 0.8,
      blending: THREE.AdditiveBlending,
    });

    const attackLine = new THREE.Line(lineGeometry, lineMaterial);
    globeGroup.add(attackLine);

    // Create a moving particle
    const pSize = isCritical ? 0.16 : 0.1;
    const particleGeometry = new THREE.SphereGeometry(pSize, 8, 8);
    const particleMaterial = new THREE.MeshBasicMaterial({
      color: isCritical ? 0xff0044 : 0x00ffcc,
      transparent: true,
      blending: THREE.AdditiveBlending,
    });
    const particle = new THREE.Mesh(particleGeometry, particleMaterial);
    particle.position.copy(start);
    globeGroup.add(particle);

    // Add to animation loops
    activeAttacksRef.current.push({
      id: lastAttack.id,
      curve,
      line: attackLine,
      particle,
      startTime: Date.now(),
      duration: Math.max(distance * 200, 1500), // speed varies by distance, minimum 1.5s
      rippleTriggered: false,
      attack: lastAttack,
    });
  }, [lastAttack]);

  // Main Three.js Initialization Hook
  useEffect(() => {
    if (!containerRef.current) return;

    const width = containerRef.current.clientWidth;
    const height = containerRef.current.clientHeight || 550;

    // 1. Scene setup
    const scene = new THREE.Scene();
    sceneRef.current = scene;

    // Ambient space fog
    scene.fog = new THREE.FogExp2(0x020306, 0.02);

    // 2. Camera setup
    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 100);
    camera.position.z = 12;
    cameraRef.current = camera;

    // 3. Renderer setup
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: "high-performance" });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    containerRef.current.appendChild(renderer.domElement);

    // 4. Lighting
    const ambientLight = new THREE.AmbientLight(0x0e1222, 1.5);
    scene.add(ambientLight);

    const dirLight1 = new THREE.DirectionalLight(0x0e2444, 2.0);
    dirLight1.position.set(5, 3, 5);
    scene.add(dirLight1);

    const dirLight2 = new THREE.DirectionalLight(0x110222, 2.5);
    dirLight2.position.set(-5, -3, -5);
    scene.add(dirLight2);

    // 5. Globe Group containing all geographical assets
    const globeGroup = new THREE.Group();
    scene.add(globeGroup);
    globeGroupRef.current = globeGroup;

    // Core solid dark globe
    const coreGeometry = new THREE.SphereGeometry(GLOBE_RADIUS, 64, 64);
    const coreMaterial = new THREE.MeshPhongMaterial({
      color: 0x030509,
      shininess: 25,
      specular: 0x11162d,
      bumpScale: 0.05,
      transparent: true,
      opacity: 0.94
    });
    const coreGlobe = new THREE.Mesh(coreGeometry, coreMaterial);
    globeGroup.add(coreGlobe);

    // Latitude / Longitude lines
    const gridGeometry = new THREE.SphereGeometry(GLOBE_RADIUS + 0.01, 18, 18);
    const gridMaterial = new THREE.MeshBasicMaterial({
      color: 0x052a3a,
      wireframe: true,
      transparent: true,
      opacity: 0.15
    });
    const gridGlobe = new THREE.Mesh(gridGeometry, gridMaterial);
    globeGroup.add(gridGlobe);

    // 6. Generate 18,000 Dotted Fibonacci Landmass Map
    const dotCount = 18000;
    const dotPositions: number[] = [];
    const dotColors: number[] = [];

    for (let i = 0; i < dotCount; i++) {
      // Golden angle / Fibonacci sphere distribution
      const y = 1 - (i / (dotCount - 1)) * 2;
      const radiusAtY = Math.sqrt(1 - y * y);
      const phi = i * 2.399963229728653;

      const x = Math.cos(phi) * radiusAtY;
      const z = Math.sin(phi) * radiusAtY;

      const lat = Math.asin(y) * (180 / Math.PI);
      const lng = Math.atan2(x, z) * (180 / Math.PI);

      const isLandDot = isLand(lat, lng);
      const p = new THREE.Vector3(x, y, z).multiplyScalar(GLOBE_RADIUS + 0.03);
      dotPositions.push(p.x, p.y, p.z);

      if (isLandDot) {
        // High density cyan/teal
        dotColors.push(0.0, 0.95, 0.85);
      } else {
        // Subtle deep cyber blue
        dotColors.push(0.02, 0.06, 0.12);
      }
    }

    const pointsGeometry = new THREE.BufferGeometry();
    pointsGeometry.setAttribute("position", new THREE.Float32BufferAttribute(dotPositions, 3));
    pointsGeometry.setAttribute("color", new THREE.Float32BufferAttribute(dotColors, 3));

    const pointsMaterial = new THREE.PointsMaterial({
      size: 0.045,
      vertexColors: true,
      transparent: true,
      opacity: 0.85,
      blending: THREE.AdditiveBlending
    });

    const dottedGlobe = new THREE.Points(pointsGeometry, pointsMaterial);
    globeGroup.add(dottedGlobe);

    // 7. Outer Atmosphere Halo (Custom BackSide shader for glow)
    const haloGeometry = new THREE.SphereGeometry(GLOBE_RADIUS * 1.15, 32, 32);
    const haloMaterial = new THREE.ShaderMaterial({
      vertexShader: `
        varying vec3 vNormal;
        void main() {
          vNormal = normalize(normalMatrix * normal);
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
      fragmentShader: `
        varying vec3 vNormal;
        void main() {
          float intensity = pow(0.68 - dot(vNormal, vec3(0, 0, 1.0)), 2.8);
          gl_FragColor = vec4(0.0, 0.75, 1.0, 1.0) * intensity * 0.65;
        }
      `,
      blending: THREE.AdditiveBlending,
      side: THREE.BackSide,
      transparent: true
    });
    const haloGlobe = new THREE.Mesh(haloGeometry, haloMaterial);
    scene.add(haloGlobe);

    // Globe is generated and ready
    onGlobeReady();

    // 8. Custom target ripple creator (exploding shockwave)
    function triggerImpactRipple(lat: number, lng: number, severity: string) {
      const isCrit = severity === "critical" || severity === "high";
      const position = latLngToVector3(lat, lng, GLOBE_RADIUS + 0.04);
      const ringGeometry = new THREE.RingGeometry(0.01, 0.12, 24);
      const ringMaterial = new THREE.MeshBasicMaterial({
        color: isCrit ? 0xff0044 : 0x00f5ff,
        side: THREE.DoubleSide,
        transparent: true,
        opacity: 0.9,
        blending: THREE.AdditiveBlending
      });
      const ringMesh = new THREE.Mesh(ringGeometry, ringMaterial);
      ringMesh.position.copy(position);

      // Orient the ripple to face outwards from core
      const lookTarget = position.clone().multiplyScalar(1.5);
      ringMesh.lookAt(lookTarget);

      globeGroup.add(ringMesh);
      activeRipplesRef.current.push({
        mesh: ringMesh,
        startTime: Date.now(),
        duration: 900,
        maxRadius: isCrit ? 0.7 : 0.35
      });
    }

    // 9. Interactive Drag/Touch Handlers
    const handleMouseDown = (e: MouseEvent) => {
      isDragging.current = true;
      previousMousePosition.current = { x: e.clientX, y: e.clientY };
    };

    const handleMouseMove = (e: MouseEvent) => {
      if (!isDragging.current) return;
      const deltaX = e.clientX - previousMousePosition.current.x;
      const deltaY = e.clientY - previousMousePosition.current.y;

      targetRotation.current.y += deltaX * 0.005;
      targetRotation.current.x += deltaY * 0.005;

      // Lock poles to prevent camera flip
      targetRotation.current.x = Math.max(-Math.PI / 2.5, Math.min(Math.PI / 2.5, targetRotation.current.x));

      previousMousePosition.current = { x: e.clientX, y: e.clientY };
    };

    const handleMouseUp = () => {
      isDragging.current = false;
    };

    // Touch Support for mobile device screens
    const handleTouchStart = (e: TouchEvent) => {
      if (e.touches.length === 1) {
        isDragging.current = true;
        previousMousePosition.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
      }
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (!isDragging.current || e.touches.length !== 1) return;
      const deltaX = e.touches[0].clientX - previousMousePosition.current.x;
      const deltaY = e.touches[0].clientY - previousMousePosition.current.y;

      targetRotation.current.y += deltaX * 0.005;
      targetRotation.current.x += deltaY * 0.005;
      targetRotation.current.x = Math.max(-Math.PI / 2.5, Math.min(Math.PI / 2.5, targetRotation.current.x));

      previousMousePosition.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
    };

    const domElement = renderer.domElement;
    domElement.addEventListener("mousedown", handleMouseDown);
    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseup", handleMouseUp);
    domElement.addEventListener("touchstart", handleTouchStart);
    domElement.addEventListener("touchmove", handleTouchMove);
    domElement.addEventListener("touchend", handleMouseUp);

    // 10. Animation Tick loop (60+ FPS optimized)
    let animationFrameId: number;

    const tick = () => {
      const now = Date.now();

      // Kinetic physics inertia calculations
      if (!isDragging.current) {
        // Slow auto rotation rotation drift when not interactive
        targetRotation.current.y += rotationSpeed;
      }

      // Smooth interpolation (lerp) for rotation angles
      currentRotation.current.y += (targetRotation.current.y - currentRotation.current.y) * 0.12;
      currentRotation.current.x += (targetRotation.current.x - currentRotation.current.x) * 0.12;

      globeGroup.rotation.y = currentRotation.current.y;
      globeGroup.rotation.x = currentRotation.current.x;

      // Update camera zoom level smoothly
      camera.position.z += (zoomLevel - camera.position.z) * 0.1;

      // Animate flying cyberattack arcs
      const activeAttacks = activeAttacksRef.current;
      for (let i = activeAttacks.length - 1; i >= 0; i--) {
        const anim = activeAttacks[i];
        const elapsed = now - anim.startTime;
        const progress = Math.min(elapsed / anim.duration, 1.0);

        if (progress < 1.0) {
          // Track particle position along spline
          const pos = anim.curve.getPointAt(progress);
          anim.particle.position.copy(pos);

          // Fade particle in/out beautifully
          const pMat = anim.particle.material as THREE.MeshBasicMaterial;
          pMat.opacity = progress < 0.1 ? progress * 10 : (1.0 - progress) * 1.5;
        } else {
          // Impact hit triggered
          if (!anim.rippleTriggered) {
            anim.rippleTriggered = true;
            triggerImpactRipple(anim.attack.target.lat, anim.attack.target.lng, anim.attack.severity);
          }

          // Complete disposal of line and particle
          globeGroup.remove(anim.line);
          globeGroup.remove(anim.particle);

          anim.line.geometry.dispose();
          (anim.line.material as THREE.Material).dispose();

          anim.particle.geometry.dispose();
          (anim.particle.material as THREE.Material).dispose();

          activeAttacks.splice(i, 1);
        }
      }

      // Animate shockwave impact rings
      const activeRipples = activeRipplesRef.current;
      for (let i = activeRipples.length - 1; i >= 0; i--) {
        const rip = activeRipples[i];
        const elapsed = now - rip.startTime;
        const progress = elapsed / rip.duration;

        if (progress < 1.0) {
          const scale = 1.0 + progress * rip.maxRadius * 8.0;
          rip.mesh.scale.set(scale, scale, 1.0);
          (rip.mesh.material as THREE.MeshBasicMaterial).opacity = 1.0 - progress;
        } else {
          globeGroup.remove(rip.mesh);
          rip.mesh.geometry.dispose();
          (rip.mesh.material as THREE.Material).dispose();
          activeRipples.splice(i, 1);
        }
      }

      renderer.render(scene, camera);
      animationFrameId = requestAnimationFrame(tick);
    };

    tick();

    // 11. Handle dynamic element resizing
    const handleResize = () => {
      if (!containerRef.current || !camera || !renderer) return;
      const w = containerRef.current.clientWidth;
      const h = containerRef.current.clientHeight || 550;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };

    window.addEventListener("resize", handleResize);

    // 12. Complete cleanup routine to completely avoid memory leaks
    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener("resize", handleResize);
      domElement.removeEventListener("mousedown", handleMouseDown);
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
      domElement.removeEventListener("touchstart", handleTouchStart);
      domElement.removeEventListener("touchmove", handleTouchMove);
      domElement.removeEventListener("touchend", handleMouseUp);

      // Dispose static globe meshes
      coreGeometry.dispose();
      coreMaterial.dispose();
      gridGeometry.dispose();
      gridMaterial.dispose();
      pointsGeometry.dispose();
      pointsMaterial.dispose();
      haloGeometry.dispose();
      haloMaterial.dispose();

      // Dispose any active attack animations
      activeAttacksRef.current.forEach((anim) => {
        globeGroup.remove(anim.line);
        globeGroup.remove(anim.particle);
        anim.line.geometry.dispose();
        (anim.line.material as THREE.Material).dispose();
        anim.particle.geometry.dispose();
        (anim.particle.material as THREE.Material).dispose();
      });

      // Dispose any active target rings
      activeRipplesRef.current.forEach((rip) => {
        globeGroup.remove(rip.mesh);
        rip.mesh.geometry.dispose();
        (rip.mesh.material as THREE.Material).dispose();
      });

      if (containerRef.current && renderer.domElement) {
        containerRef.current.removeChild(renderer.domElement);
      }
      renderer.dispose();
    };
  }, [rotationSpeed, onGlobeReady]);

  // Utility button controllers
  const zoomIn = () => setZoomLevel((z) => Math.max(z - 1.5, 7.5));
  const zoomOut = () => setZoomLevel((z) => Math.min(z + 1.5, 18.0));
  const resetOrientation = () => {
    targetRotation.current = { x: 0, y: 0.8 };
    setZoomLevel(12);
  };

  return (
    <div id="cyber-globe-wrapper" className="relative w-full h-full min-h-[480px] md:min-h-[550px] bg-black/40 border border-cyan-950/50 rounded-xl overflow-hidden backdrop-blur-md">
      {/* Visual background hud lines */}
      <div className="absolute top-4 left-4 z-10 flex flex-col gap-1.5 font-mono text-[10px] text-cyan-600/70 select-none pointer-events-none">
        <div>ORBIT_RAD: {GLOBE_RADIUS}m</div>
        <div>RENDER_COMPILER: WEBGL_2.0_EMULATED</div>
        <div>ANTIALIAS_SAMPLES: MSAA_2X</div>
        <div className="flex items-center gap-1.5 mt-2">
          <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse" />
          <span className="text-[11px] text-cyan-400 uppercase font-semibold">Live Simulation Active</span>
        </div>
      </div>

      {/* 3D Canvas Mounting Point */}
      <div ref={containerRef} id="cyber-globe-canvas" className="w-full h-full cursor-grab active:cursor-grabbing" />

      {/* Floating control action buttons */}
      <div id="globe-hud-controls" className="absolute bottom-5 right-5 z-20 flex gap-2">
        <button
          onClick={zoomIn}
          title="Zoom In"
          className="p-2 bg-[#090e1a]/80 hover:bg-cyan-950 border border-cyan-900/60 rounded text-cyan-400 hover:text-white transition duration-200"
        >
          <ZoomIn className="w-4 h-4" />
        </button>
        <button
          onClick={zoomOut}
          title="Zoom Out"
          className="p-2 bg-[#090e1a]/80 hover:bg-cyan-950 border border-cyan-900/60 rounded text-cyan-400 hover:text-white transition duration-200"
        >
          <ZoomOut className="w-4 h-4" />
        </button>
        <button
          onClick={resetOrientation}
          title="Reset View"
          className="p-2 bg-[#090e1a]/80 hover:bg-cyan-950 border border-cyan-900/60 rounded text-cyan-400 hover:text-white transition duration-200"
        >
          <RotateCcw className="w-4 h-4" />
        </button>
        <button
          onClick={() => setRotationSpeed((s) => (s === 0 ? 0.001 : 0))}
          title={rotationSpeed === 0 ? "Resume Rotation" : "Pause Rotation"}
          className={`p-2 border rounded transition duration-200 ${
            rotationSpeed === 0
              ? "bg-red-950/40 border-red-900 text-red-400 hover:bg-red-900/60 hover:text-white"
              : "bg-[#090e1a]/80 border-cyan-900/60 text-cyan-400 hover:bg-cyan-950 hover:text-white"
          }`}
        >
          <Globe className="w-4 h-4" />
        </button>
      </div>

      {/* Map visual legend overlay */}
      <div className="absolute bottom-5 left-5 z-20 hidden sm:flex flex-col gap-2 p-3 bg-[#05080f]/80 backdrop-blur-md border border-cyan-950/80 rounded text-[11px] font-mono text-cyan-500/80">
        <div className="font-semibold text-[10px] text-cyan-300 border-b border-cyan-950/80 pb-1 mb-1">ALERT LEVEL LEGEND</div>
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-red-500 shadow-[0_0_8px_#ef4444]" />
          <span>CRITICAL THREAT (DDOS / APTS)</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-orange-500 shadow-[0_0_8px_#f97316]" />
          <span>HIGH INCIDENT (MALWARE / INJECTION)</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-cyan-400 shadow-[0_0_8px_#22d3ee]" />
          <span>STANDARD PROBING (PHISHING / LOGS)</span>
        </div>
      </div>
    </div>
  );
}

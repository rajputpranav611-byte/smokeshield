"use client";

import { useEffect, useRef, useState } from "react";
import * as THREE from "three";

export function EnvironmentalCanvas() {
  const mountRef = useRef<HTMLDivElement>(null);
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(() => {
    if (typeof window !== "undefined") {
      return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    }
    return false;
  });

  useEffect(() => {
    if (typeof window === "undefined") return;
    const mediaQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    const handler = (e: MediaQueryListEvent) => setPrefersReducedMotion(e.matches);
    mediaQuery.addEventListener("change", handler);
    return () => mediaQuery.removeEventListener("change", handler);
  }, []);

  useEffect(() => {
    if (!mountRef.current || prefersReducedMotion) return;

    const container = mountRef.current;
    const width = container.clientWidth;
    const height = container.clientHeight;

    // 1. Scene, Camera, Renderer
    const scene = new THREE.Scene();
    scene.fog = new THREE.FogExp2(0x0b0f12, 0.08);

    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 100);
    camera.position.set(0, 4, 9);
    camera.lookAt(0, 0, 0);

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.0;
    container.appendChild(renderer.domElement);

    // 2. Base Ground Grid (Restrained dark graphite mesh)
    const gridHelper = new THREE.GridHelper(16, 24, 0x28323a, 0x172027);
    gridHelper.position.y = -0.05;
    scene.add(gridHelper);

    // 3. School Protected Node (Neutral luminous node with verified emerald ring)
    const schoolGroup = new THREE.Group();
    schoolGroup.position.set(0, 0, 1.5);

    const schoolPinGeometry = new THREE.CylinderGeometry(0.08, 0.08, 0.6, 16);
    const schoolPinMaterial = new THREE.MeshBasicMaterial({ color: 0xf3f6f8 });
    const schoolPin = new THREE.Mesh(schoolPinGeometry, schoolPinMaterial);
    schoolPin.position.y = 0.3;
    schoolGroup.add(schoolPin);

    const ringGeometry = new THREE.RingGeometry(0.2, 0.35, 32);
    ringGeometry.rotateX(-Math.PI / 2);
    const ringMaterial = new THREE.MeshBasicMaterial({
      color: 0x76d39a,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.8
    });
    const schoolRing = new THREE.Mesh(ringGeometry, ringMaterial);
    schoolRing.position.y = 0.01;
    schoolGroup.add(schoolRing);

    scene.add(schoolGroup);

    // 4. Satellite Thermal Observations (Warm red-orange discrete detection points)
    const firePointsGroup = new THREE.Group();
    const fireGeo = new THREE.SphereGeometry(0.12, 16, 16);
    const fireMat = new THREE.MeshBasicMaterial({ color: 0xff6b4a });

    const fireCoords = [
      { x: -2.2, z: -3.8 },
      { x: -0.8, z: -4.5 },
      { x: 1.2, z: -4.0 }
    ];

    fireCoords.forEach((coord) => {
      const fireMesh = new THREE.Mesh(fireGeo, fireMat);
      fireMesh.position.set(coord.x, 0.1, coord.z);
      firePointsGroup.add(fireMesh);

      // Warning marker stalk
      const stalkGeo = new THREE.CylinderGeometry(0.02, 0.02, 0.5, 8);
      const stalkMat = new THREE.MeshBasicMaterial({ color: 0xff6b4a, transparent: true, opacity: 0.6 });
      const stalk = new THREE.Mesh(stalkGeo, stalkMat);
      stalk.position.set(coord.x, 0.25, coord.z);
      firePointsGroup.add(stalk);
    });

    scene.add(firePointsGroup);

    // 5. Modeled Influence Corridor (Restrained geometric planar cone, translucent atmospheric green)
    const corridorShape = new THREE.Shape();
    corridorShape.moveTo(-0.5, -4.5);
    corridorShape.lineTo(-1.8, 1.8);
    corridorShape.lineTo(1.8, 1.8);
    corridorShape.lineTo(0.5, -4.5);
    corridorShape.closePath();

    const corridorGeometry = new THREE.ShapeGeometry(corridorShape);
    corridorGeometry.rotateX(-Math.PI / 2);

    const corridorMaterial = new THREE.MeshBasicMaterial({
      color: 0xa6e3b5,
      transparent: true,
      opacity: 0.12,
      side: THREE.DoubleSide,
      depthWrite: false
    });
    const corridorMesh = new THREE.Mesh(corridorGeometry, corridorMaterial);
    corridorMesh.position.y = 0.02;
    scene.add(corridorMesh);

    // Corridor Outline Wire
    const wireMat = new THREE.LineBasicMaterial({
      color: 0x76d39a,
      transparent: true,
      opacity: 0.4
    });
    const corridorEdges = new THREE.EdgesGeometry(corridorGeometry);
    const corridorOutline = new THREE.LineSegments(corridorEdges, wireMat);
    corridorOutline.position.y = 0.025;
    scene.add(corridorOutline);

    // 6. Atmospheric Drift Streamlines (Mathematical wind vector representation)
    const particleCount = 60;
    const particleGeo = new THREE.BufferGeometry();
    const positions = new Float32Array(particleCount * 3);
    const speeds = new Float32Array(particleCount);

    for (let i = 0; i < particleCount; i++) {
      positions[i * 3] = (Math.random() - 0.5) * 4.0; // X spread
      positions[i * 3 + 1] = Math.random() * 0.4 + 0.05; // Y height
      positions[i * 3 + 2] = -4.5 + Math.random() * 6.5; // Z progression
      speeds[i] = 0.012 + Math.random() * 0.008; // subtle wind drift
    }

    particleGeo.setAttribute("position", new THREE.BufferAttribute(positions, 3));

    const particleMat = new THREE.PointsMaterial({
      color: 0xaab5be,
      size: 0.06,
      transparent: true,
      opacity: 0.4
    });

    const particles = new THREE.Points(particleGeo, particleMat);
    scene.add(particles);

    // 7. Render Loop with subtle restrained movement
    let animationId: number;
    const clock = new THREE.Clock();

    const animate = () => {
      animationId = requestAnimationFrame(animate);

      // Subtle pulse on school ring
      const t = clock.getElapsedTime();
      schoolRing.scale.setScalar(1 + Math.sin(t * 1.5) * 0.06);

      // Subtle drift of atmospheric streamlines downwind
      const posAttr = particleGeo.attributes.position as THREE.BufferAttribute;
      const posArray = posAttr.array as Float32Array;

      for (let i = 0; i < particleCount; i++) {
        posArray[i * 3 + 2] += speeds[i]; // move toward camera (southward)
        if (posArray[i * 3 + 2] > 2.5) {
          posArray[i * 3 + 2] = -4.5;
        }
      }
      posAttr.needsUpdate = true;

      renderer.render(scene, camera);
    };

    animate();

    // Resize Handler
    const handleResize = () => {
      if (!container) return;
      const w = container.clientWidth;
      const h = container.clientHeight;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };

    window.addEventListener("resize", handleResize);

    return () => {
      cancelAnimationFrame(animationId);
      window.removeEventListener("resize", handleResize);
      renderer.dispose();
      if (renderer.domElement && container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
    };
  }, [prefersReducedMotion]);

  if (prefersReducedMotion) {
    return (
      <div className="w-full h-full flex items-center justify-center bg-panel/40 border border-border-strong/40 rounded-lg p-6">
        <div className="text-center space-y-2 max-w-sm">
          <div className="flex items-center justify-center gap-2 text-xs font-semibold text-text-primary">
            <span className="w-2.5 h-2.5 rounded-full bg-verified"></span>
            <span>Static Environmental Influence Diagram</span>
          </div>
          <p className="text-[11px] text-text-muted leading-relaxed">
            Atmospheric drift animations are paused to respect reduced motion settings.
          </p>
        </div>
      </div>
    );
  }

  return <div ref={mountRef} className="w-full h-full" />;
}

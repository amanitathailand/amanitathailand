'use client';

import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { useMuseumStore } from '@/store/useMuseumStore';
import { trackEvent } from '@/lib/analytics/tracker';
import { Sparkles } from 'lucide-react';

function checkWebGLSupport(): boolean {
  if (typeof window === 'undefined') return false;
  try {
    const canvas = document.createElement('canvas');
    return !!(
      window.WebGLRenderingContext && 
      (canvas.getContext('webgl') || canvas.getContext('experimental-webgl'))
    );
  } catch {
    return false;
  }
}

// Generate organic botanical cap texture procedurally with biological gradients
function createAmanitaCapTexture(): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 1024;
  canvas.height = 1024;
  const ctx = canvas.getContext('2d');

  if (ctx) {
    // Radial gradient from rich crimson apex to vibrant scarlet-orange margin
    const grad = ctx.createRadialGradient(512, 100, 50, 512, 512, 512);
    grad.addColorStop(0.0, '#8e0c18'); // Deep apex crimson
    grad.addColorStop(0.3, '#b91c1c'); // Vibrant scarlet
    grad.addColorStop(0.7, '#dc2626'); // Vivid red
    grad.addColorStop(0.92, '#ea580c'); // Warm orange-red margin
    grad.addColorStop(1.0, '#f97316'); // Pale golden-orange rim
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 1024, 1024);

    // Microscopic organic pores & cuticle striations
    ctx.fillStyle = 'rgba(0, 0, 0, 0.04)';
    for (let i = 0; i < 6000; i++) {
      const x = Math.random() * 1024;
      const y = Math.random() * 1024;
      ctx.fillRect(x, y, 1.5, 1.5);
    }
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.ClampToEdgeWrapping;
  return texture;
}

export function MuseumSceneCanvas({ modelUrl = '/models/amanita.glb' }: { modelUrl?: string }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [webGlFailed, setWebGlFailed] = useState(false);
  const [isGlbLoaded, setIsGlbLoaded] = useState(false);
  const { isPortalOpen, openPortal } = useMuseumStore();
  const openPortalRef = useRef(openPortal);
  openPortalRef.current = openPortal;

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    if (!checkWebGLSupport()) {
      setWebGlFailed(true);
      return;
    }

    let animationFrameId: number;
    let renderer: THREE.WebGLRenderer | null = null;
    let controls: any = null;

    try {
      // --- Scene Setup ---
      const scene = new THREE.Scene();
      scene.background = new THREE.Color('#edf2f4');
      scene.fog = new THREE.FogExp2('#dfe5e9', 0.045);

      // --- Camera Setup with Mobile Awareness ---
      const width = container.clientWidth || window.innerWidth;
      const height = container.clientHeight || window.innerHeight;
      const isMobile = width < 768;

      const camera = new THREE.PerspectiveCamera(
        isMobile ? 48 : 44, 
        width / Math.max(height, 1), 
        0.1, 
        100
      );
      camera.position.set(0, isMobile ? 1.2 : 1.35, isMobile ? 7.2 : 5.0);

      // --- Renderer Setup ---
      renderer = new THREE.WebGLRenderer({ 
        antialias: true, 
        alpha: true, 
        powerPreference: 'high-performance' 
      });
      renderer.setSize(width, height);
      renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
      renderer.shadowMap.enabled = true;
      renderer.shadowMap.type = THREE.PCFSoftShadowMap;
      container.appendChild(renderer.domElement);

      // --- Controls ---
      try {
        controls = new OrbitControls(camera, renderer.domElement);
        controls.enableDamping = true;
        controls.dampingFactor = 0.05;
        controls.enablePan = false;
        controls.minDistance = isMobile ? 2.8 : 2.2;
        controls.maxDistance = isMobile ? 10.0 : 8.0;
        controls.maxPolarAngle = Math.PI / 1.85;
        controls.target.set(0, isMobile ? 0.85 : 0.95, 0);
      } catch (controlErr) {
        console.warn('OrbitControls notice:', controlErr);
      }

      // --- Photorealistic Studio Lighting ---
      const ambientLight = new THREE.AmbientLight(0xffffff, 0.7);
      scene.add(ambientLight);

      // Key light: Warm sunlit forest canopy angle
      const keyLight = new THREE.DirectionalLight(0xffffff, 1.5);
      keyLight.position.set(4.5, 9, 3.5);
      keyLight.castShadow = true;
      keyLight.shadow.mapSize.width = 1024;
      keyLight.shadow.mapSize.height = 1024;
      scene.add(keyLight);

      // Rim light: Vibrant crimson back-glow (translucency simulation)
      const rimLight = new THREE.PointLight(0xef233c, 1.15, 8.5);
      rimLight.position.set(-3.5, 2.5, -2.5);
      scene.add(rimLight);

      // Fill light: Gentle forest moss green tone
      const fillLight = new THREE.DirectionalLight(0x8d99ae, 0.55);
      fillLight.position.set(0, -3, 3);
      scene.add(fillLight);

      // --- Mushroom Group Root ---
      const mushroomGroup = new THREE.Group();
      mushroomGroup.name = 'MushroomPortal';
      scene.add(mushroomGroup);

      // Variable tracking the active clickable mushroom object
      let activeMushroomObject: THREE.Object3D = mushroomGroup;

      // ======================================================================
      // 1. Try Loading Photorealistic GLB 3D Model from /models/amanita.glb
      // ======================================================================
      const gltfLoader = new GLTFLoader();
      gltfLoader.load(
        modelUrl,
        (gltf) => {
          const model = gltf.scene;
          model.name = 'MushroomPortalGLB';

          // Auto-center and normalize size
          const bbox = new THREE.Box3().setFromObject(model);
          const size = bbox.getSize(new THREE.Vector3());
          const maxDim = Math.max(size.x, size.y, size.z) || 1;
          const targetScale = 2.6 / maxDim;
          model.scale.setScalar(targetScale);

          // Center bounding box vertically
          const center = bbox.getCenter(new THREE.Vector3());
          model.position.set(-center.x * targetScale, -center.y * targetScale + 0.95, -center.z * targetScale);

          // Enhance materials with PBR properties
          model.traverse((child) => {
            if ((child as THREE.Mesh).isMesh) {
              const mesh = child as THREE.Mesh;
              mesh.castShadow = true;
              mesh.receiveShadow = true;
              if (mesh.material && (mesh.material as THREE.MeshStandardMaterial).isMeshStandardMaterial) {
                const mat = mesh.material as THREE.MeshStandardMaterial;
                mat.roughness = Math.min(Math.max(mat.roughness, 0.25), 0.75);
                mat.envMapIntensity = 1.0;
              }
            }
          });

          // Replace procedural mesh with photorealistic scan model
          while (mushroomGroup.children.length > 0) {
            mushroomGroup.remove(mushroomGroup.children[0]);
          }
          mushroomGroup.add(model);
          activeMushroomObject = model;
          setIsGlbLoaded(true);
        },
        undefined,
        () => {
          // If no GLB file is present, build the enhanced botanical procedural model below
        }
      );

      // ======================================================================
      // 2. High-Realism Botanical Procedural Construction (Fallback & Default)
      // ======================================================================
      const capTexture = createAmanitaCapTexture();

      // Cap Geometry: Natural organic parabolic dome with undulating margin
      const capGeo = new THREE.SphereGeometry(1.5, 48, 36, 0, Math.PI * 2, 0, Math.PI * 0.54);
      
      // Deform cap vertices for natural botanical asymmetry
      const pos = capGeo.attributes.position;
      for (let i = 0; i < pos.count; i++) {
        const x = pos.getX(i);
        const y = pos.getY(i);
        const z = pos.getZ(i);
        const r = Math.sqrt(x * x + z * z);
        
        // Gentle undulating rim wavy effect
        const wavy = Math.sin(Math.atan2(z, x) * 7.0) * 0.045 * (r / 1.5);
        pos.setY(i, y + wavy);
      }
      capGeo.computeVertexNormals();

      const capMat = new THREE.MeshPhysicalMaterial({
        map: capTexture,
        color: new THREE.Color('#dc2626'),
        roughness: 0.26,
        metalness: 0.02,
        clearcoat: 0.45,
        clearcoatRoughness: 0.2,
        transmission: 0.05,
        reflectivity: 0.35,
        emissive: new THREE.Color('#55050e'),
        emissiveIntensity: 0.35,
      });

      const capMesh = new THREE.Mesh(capGeo, capMat);
      capMesh.position.y = 1.15;
      capMesh.castShadow = true;
      capMesh.receiveShadow = true;
      mushroomGroup.add(capMesh);

      // Hymenophore / Gills (White Radiating Lamellae underneath the cap)
      const gillsGroup = new THREE.Group();
      const gillMat = new THREE.MeshStandardMaterial({ 
        color: 0xfbf8ee, 
        roughness: 0.7, 
        side: THREE.DoubleSide 
      });
      const gillCount = 64;
      for (let i = 0; i < gillCount; i++) {
        const angle = (i / gillCount) * Math.PI * 2;
        const gillGeo = new THREE.PlaneGeometry(0.95, 0.28);
        const gillMesh = new THREE.Mesh(gillGeo, gillMat);
        gillMesh.position.set(Math.cos(angle) * 0.65, 1.12, Math.sin(angle) * 0.65);
        gillMesh.rotation.y = -angle;
        gillMesh.rotation.x = Math.PI * 0.08;
        gillsGroup.add(gillMesh);
      }
      mushroomGroup.add(gillsGroup);

      // Photorealistic Veil Warts (Pyramidal & Organic Flakes)
      const wartsGroup = new THREE.Group();
      const wartGeoCone = new THREE.ConeGeometry(0.065, 0.08, 6);
      const wartGeoFlake = new THREE.DodecahedronGeometry(0.045, 0);
      const wartMat = new THREE.MeshStandardMaterial({ 
        color: 0xfffdf7, 
        roughness: 0.88, 
        metalness: 0.0 
      });

      const totalWarts = 72;
      for (let i = 0; i < totalWarts; i++) {
        const phi = Math.pow(Math.random(), 0.7) * (Math.PI * 0.51);
        const theta = Math.random() * (Math.PI * 2);
        const radius = 1.505;

        const x = radius * Math.sin(phi) * Math.cos(theta);
        const y = radius * Math.cos(phi) + 1.15;
        const z = radius * Math.sin(phi) * Math.sin(theta);

        // Larger pyramidal warts near apex, smaller granular flakes near margin
        const isNearApex = phi < Math.PI * 0.28;
        const wartMesh = new THREE.Mesh(isNearApex ? wartGeoCone : wartGeoFlake, wartMat);
        wartMesh.position.set(x, y, z);
        
        const scaleVal = isNearApex ? (0.8 + Math.random() * 0.75) : (0.5 + Math.random() * 0.6);
        wartMesh.scale.set(scaleVal, scaleVal * 0.55, scaleVal);
        wartMesh.lookAt(0, 1.15, 0);
        wartMesh.castShadow = true;
        wartsGroup.add(wartMesh);
      }
      mushroomGroup.add(wartsGroup);

      // Stipe (Fibrous, slightly tapered stem)
      const stemGeo = new THREE.CylinderGeometry(0.28, 0.44, 2.35, 32);
      const stemMat = new THREE.MeshStandardMaterial({ 
        color: 0xfbf7ed, 
        roughness: 0.78, 
        metalness: 0.02 
      });
      const stemMesh = new THREE.Mesh(stemGeo, stemMat);
      stemMesh.position.y = -0.02;
      stemMesh.castShadow = true;
      stemMesh.receiveShadow = true;
      mushroomGroup.add(stemMesh);

      // Annulus (Delicate descending membranous skirt ring)
      const ringGeo = new THREE.CylinderGeometry(0.32, 0.52, 0.22, 32, 1, true);
      const ringMat = new THREE.MeshStandardMaterial({ 
        color: 0xfdfbf6, 
        roughness: 0.85, 
        side: THREE.DoubleSide 
      });
      const ringMesh = new THREE.Mesh(ringGeo, ringMat);
      ringMesh.position.y = 0.56;
      mushroomGroup.add(ringMesh);

      // Bulbous Volva Base (Expanded rounded base with concentric scale rings)
      const volvaGeo = new THREE.SphereGeometry(0.55, 24, 18);
      const volvaMat = new THREE.MeshStandardMaterial({ color: 0xede6d6, roughness: 0.85 });
      const volvaMesh = new THREE.Mesh(volvaGeo, volvaMat);
      volvaMesh.position.y = -1.05;
      volvaMesh.scale.set(1.0, 0.6, 1.0);
      mushroomGroup.add(volvaMesh);

      // Inner Amber Mystical Core Light
      const coreLight = new THREE.PointLight(0xffc4cf, 2.2, 5.5);
      coreLight.position.set(0, 0.95, 0);
      mushroomGroup.add(coreLight);

      // --- Floating Soft-Gold Spores Particles (GPU Instanced) ---
      const sporeCount = isMobile ? 240 : 420;
      const sporeGeo = new THREE.SphereGeometry(0.024, 6, 6);
      const sporeMat = new THREE.MeshBasicMaterial({ color: 0xfff1a8, transparent: true, opacity: 0.72 });
      const sporeInstanced = new THREE.InstancedMesh(sporeGeo, sporeMat, sporeCount);

      const sporeData = Array.from({ length: sporeCount }, () => ({
        x: (Math.random() - 0.5) * 9.5,
        y: Math.random() * 6.5 - 1.8,
        z: (Math.random() - 0.5) * 9.5,
        speed: 0.18 + Math.random() * 0.45,
        seed: Math.random() * 100,
        scale: 0.7 + Math.random() * 0.65,
      }));

      scene.add(sporeInstanced);

      // --- Raycasting for Portal Interaction (Touch & Click) ---
      const raycaster = new THREE.Raycaster();
      const mouse = new THREE.Vector2();
      type TouchPointerStart = { x: number; y: number; startedAt: number };
      const activeTouchPointers = new Map<number, TouchPointerStart>();
      const tapMoveTolerance = 12;
      const tapDurationLimitMs = 700;
      let touchGestureMoved = false;
      let touchGestureHadMultiplePointers = false;
      let touchGestureCancelled = false;
      let ignoreCompatibilityClickUntil = 0;
      let suppressedTouchClick: { x: number; y: number; expiresAt: number } | null = null;

      const handlePointerAction = (clientX: number, clientY: number): boolean => {
        if (!renderer || useMuseumStore.getState().isPortalOpen) return false;
        const rect = renderer.domElement.getBoundingClientRect();
        mouse.x = ((clientX - rect.left) / rect.width) * 2 - 1;
        mouse.y = -((clientY - rect.top) / rect.height) * 2 + 1;

        raycaster.setFromCamera(mouse, camera);
        const intersects = raycaster.intersectObjects(mushroomGroup.children, true);

        if (intersects.length === 0) return false;
        openPortalRef.current();
        trackEvent('museum_entry', 'portal_mushroom_3d');
        return true;
      };

      const handleClick = (event: MouseEvent) => {
        const pointerType = (event as PointerEvent).pointerType;
        if (pointerType === 'touch' || Date.now() < ignoreCompatibilityClickUntil) return;
        handlePointerAction(event.clientX, event.clientY);
      };

      const handleTouchPointerDown = (event: PointerEvent) => {
        if (event.pointerType !== 'touch') return;
        ignoreCompatibilityClickUntil = Date.now() + 800;
        if (activeTouchPointers.size > 0) touchGestureHadMultiplePointers = true;
        activeTouchPointers.set(event.pointerId, {
          x: event.clientX,
          y: event.clientY,
          startedAt: performance.now(),
        });
        if (activeTouchPointers.size > 1) touchGestureHadMultiplePointers = true;
      };

      const handleTouchPointerMove = (event: PointerEvent) => {
        if (event.pointerType !== 'touch') return;
        const start = activeTouchPointers.get(event.pointerId);
        if (!start) return;
        if (Math.hypot(event.clientX - start.x, event.clientY - start.y) > tapMoveTolerance) {
          touchGestureMoved = true;
        }
      };

      const finishTouchPointer = (event: PointerEvent, cancelled: boolean) => {
        if (event.pointerType !== 'touch') return;
        const start = activeTouchPointers.get(event.pointerId);
        if (!start) return;
        if (cancelled) touchGestureCancelled = true;

        const isSingleTap = activeTouchPointers.size === 1
          && !touchGestureMoved
          && !touchGestureHadMultiplePointers
          && !touchGestureCancelled
          && performance.now() - start.startedAt <= tapDurationLimitMs;

        activeTouchPointers.delete(event.pointerId);
        ignoreCompatibilityClickUntil = Date.now() + 800;

        if (activeTouchPointers.size === 0) {
          if (isSingleTap && handlePointerAction(event.clientX, event.clientY)) {
            // The browser may synthesize a click after pointerup. Ignore only the
            // click at this tap position so it cannot activate a newly opened card.
            suppressedTouchClick = {
              x: event.clientX,
              y: event.clientY,
              expiresAt: Date.now() + 500,
            };
          }
          touchGestureMoved = false;
          touchGestureHadMultiplePointers = false;
          touchGestureCancelled = false;
        }
      };

      const handleTouchPointerUp = (event: PointerEvent) => finishTouchPointer(event, false);
      const handleTouchPointerCancel = (event: PointerEvent) => finishTouchPointer(event, true);

      const handleCaptureClick = (event: MouseEvent) => {
        if (!suppressedTouchClick) return;
        if (Date.now() > suppressedTouchClick.expiresAt) {
          suppressedTouchClick = null;
          return;
        }
        if (Math.hypot(event.clientX - suppressedTouchClick.x, event.clientY - suppressedTouchClick.y) <= 56) {
          event.preventDefault();
          event.stopPropagation();
          suppressedTouchClick = null;
        }
      };

      const handlePointerMove = (event: MouseEvent) => {
        if (!renderer) return;
        const rect = renderer.domElement.getBoundingClientRect();
        mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
        mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

        raycaster.setFromCamera(mouse, camera);
        const intersects = raycaster.intersectObjects(mushroomGroup.children, true);
        renderer.domElement.style.cursor = intersects.length > 0 ? 'pointer' : 'default';
      };

      renderer.domElement.addEventListener('click', handleClick);
      renderer.domElement.addEventListener('pointerdown', handleTouchPointerDown);
      window.addEventListener('pointermove', handleTouchPointerMove, true);
      window.addEventListener('pointerup', handleTouchPointerUp, true);
      window.addEventListener('pointercancel', handleTouchPointerCancel, true);
      document.addEventListener('click', handleCaptureClick, true);
      renderer.domElement.addEventListener('mousemove', handlePointerMove);

      // --- Animation Loop ---
      const clock = new THREE.Clock();
      const dummy = new THREE.Object3D();

      const animate = () => {
        animationFrameId = requestAnimationFrame(animate);
        const t = clock.getElapsedTime();

        // Organic Levitation & Idle Breathing
        mushroomGroup.position.y = Math.sin(t * 1.25) * 0.085;
        mushroomGroup.rotation.y = t * 0.11;

        // Subtle biological breathing
        const breath = 1 + Math.sin(t * 2.2) * 0.012;
        capMesh.scale.set(breath, breath * 0.985, breath);
        coreLight.intensity = 2.2 + Math.sin(t * 2.8) * 0.55;

        // Update Spores
        for (let i = 0; i < sporeCount; i++) {
          const p = sporeData[i];
          p.y += 0.0055 * p.speed;
          if (p.y > 5.5) p.y = -1.8;

          const px = p.x + Math.sin(t * 0.55 + p.seed) * 0.24;
          const pz = p.z + Math.cos(t * 0.55 + p.seed) * 0.24;

          dummy.position.set(px, p.y, pz);
          dummy.scale.setScalar(p.scale * (1 + Math.sin(t * 2.5 + p.seed) * 0.1));
          dummy.updateMatrix();

          sporeInstanced.setMatrixAt(i, dummy.matrix);
        }
        sporeInstanced.instanceMatrix.needsUpdate = true;

        if (controls) controls.update();
        if (renderer) renderer.render(scene, camera);
      };

      animate();

      // --- Resize Handler ---
      const handleResize = () => {
        if (!container || !renderer) return;
        const w = container.clientWidth || window.innerWidth;
        const h = container.clientHeight || window.innerHeight;
        const mobile = w < 768;
        
        camera.aspect = w / Math.max(h, 1);
        camera.fov = mobile ? 48 : 44;
        camera.updateProjectionMatrix();
        renderer.setSize(w, h);
      };

      window.addEventListener('resize', handleResize);

      // --- Cleanup on unmount ---
      return () => {
        cancelAnimationFrame(animationFrameId);
        window.removeEventListener('resize', handleResize);
        if (renderer) {
          renderer.domElement.removeEventListener('click', handleClick);
          renderer.domElement.removeEventListener('pointerdown', handleTouchPointerDown);
          window.removeEventListener('pointermove', handleTouchPointerMove, true);
          window.removeEventListener('pointerup', handleTouchPointerUp, true);
          window.removeEventListener('pointercancel', handleTouchPointerCancel, true);
          document.removeEventListener('click', handleCaptureClick, true);
          renderer.domElement.removeEventListener('mousemove', handlePointerMove);
          if (controls) controls.dispose();
          renderer.dispose();
          if (renderer.domElement.parentElement) {
            renderer.domElement.parentElement.removeChild(renderer.domElement);
          }
        }
      };
    } catch (err) {
      console.warn('Three.js scene initialization notice:', err);
      setWebGlFailed(true);
    }
  }, []);

  if (webGlFailed) {
    return (
      <div 
        onClick={() => {
          openPortal();
          trackEvent('museum_entry', 'portal_css_fallback');
        }}
        className="absolute inset-0 w-full h-[100dvh] flex flex-col items-center justify-center cursor-pointer select-none bg-radial from-crimson-950/40 via-obsidian-950 to-obsidian-950"
      >
        <div className="absolute w-72 h-72 sm:w-96 sm:h-96 rounded-full bg-crimson-700/20 blur-3xl animate-pulse pointer-events-none" />
        <div className="absolute w-48 h-48 rounded-full bg-amberGold-500/15 blur-2xl animate-ping pointer-events-none" />

        <div className="relative z-10 flex flex-col items-center transition-transform hover:scale-105 duration-500">
          <div className="relative w-44 h-28 sm:w-56 sm:h-36 rounded-t-full bg-gradient-to-b from-[#c5192c] via-[#a31422] to-[#5c0c14] border-t-2 border-amberGold-400/40 shadow-[0_0_50px_rgba(197,25,44,0.6)] flex items-center justify-center overflow-hidden">
            <div className="absolute top-3 left-10 w-4 h-4 rounded-full bg-amber-50/90 shadow-sm" />
            <div className="absolute top-6 right-12 w-5 h-5 rounded-full bg-amber-50/90 shadow-sm" />
            <div className="absolute top-12 left-6 w-3.5 h-3.5 rounded-full bg-amber-50/85" />
            <div className="absolute top-14 right-8 w-4 h-4 rounded-full bg-amber-50/85" />
            <div className="absolute top-8 left-24 w-6 h-5 rounded-full bg-amber-50/90 shadow-sm" />
            <div className="absolute bottom-3 left-14 w-3 h-3 rounded-full bg-amber-50/80" />
            <div className="absolute bottom-4 right-18 w-3.5 h-3.5 rounded-full bg-amber-50/80" />
            <Sparkles className="w-8 h-8 text-amberGold-300 animate-spin opacity-75" />
          </div>

          <div className="w-16 sm:w-20 h-3 rounded-full bg-amber-100/90 shadow-md -mt-1 z-10" />
          <div className="w-10 sm:w-12 h-28 sm:h-36 rounded-b-2xl bg-gradient-to-b from-amber-100 via-amber-50 to-[#d6cebe] shadow-inner" />
          <div className="w-24 sm:w-32 h-6 rounded-full bg-amberGold-500/30 blur-md -mt-2" />
        </div>
      </div>
    );
  }

  return (
    <div 
      ref={containerRef} 
      className="absolute inset-0 w-full h-[100dvh] select-none touch-none bg-obsidian-950" 
    />
  );
}

export default MuseumSceneCanvas;

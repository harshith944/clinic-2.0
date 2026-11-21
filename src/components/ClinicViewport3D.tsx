import { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { ChevronDown, ChevronUp, Moon, RotateCcw, Sun } from 'lucide-react';
import { CLINIC_ZONES } from '../data/clinicData';
import { buildClinicSceneModels } from '../three/clinicModels';
import type { AppointmentType, ClinicZoneId, LightingPreset } from '../types/clinic';

interface ClinicViewport3DProps {
  activeZone: ClinicZoneId;
  onSelectZone: (zone: ClinicZoneId) => void;
  onBookZone: (type: AppointmentType) => void;
}

// Reusable scratch vectors (zero GC allocations during render/damp)
const _desiredPos = new THREE.Vector3();
const _desiredTarget = new THREE.Vector3();
const _pointerNdc = new THREE.Vector2();

function detectSoftwareWebGL(): boolean {
  try {
    const probeCanvas = document.createElement('canvas');
    const gl = probeCanvas.getContext('webgl2');
    if (!gl) return true;
    const ext = gl.getExtension('WEBGL_debug_renderer_info');
    const param = ext ? ext.UNMASKED_RENDERER_WEBGL : gl.RENDERER;
    const gpu = String(gl.getParameter(param) ?? '');
    gl.getExtension('WEBGL_lose_context')?.loseContext();
    return /SwiftShader|llvmpipe|softpipe|Software|Basic Render/i.test(gpu);
  } catch {
    return true;
  }
}

export function ClinicViewport3D({
  activeZone,
  onSelectZone,
  onBookZone,
}: ClinicViewport3DProps) {
  const mountRef = useRef<HTMLDivElement | null>(null);
  const [lighting, setLighting] = useState<LightingPreset>('daylight');
  const [dockOpen, setDockOpen] = useState(true);
  const [contextLost, setContextLost] = useState(false);

  const onSelectZoneRef = useRef(onSelectZone);
  onSelectZoneRef.current = onSelectZone;

  const sceneBridgeRef = useRef<{
    goToZone: (zone: ClinicZoneId) => void;
    setLightingMode: (mode: LightingPreset) => void;
    highlightZone: (zone: ClinicZoneId) => void;
  } | null>(null);

  const currentZoneInfo =
    CLINIC_ZONES.find((z) => z.id === activeZone) ?? CLINIC_ZONES[0];

  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    const isSoftwareGl = detectSoftwareWebGL();
    const width = Math.max(container.clientWidth, 320);
    const height = Math.max(container.clientHeight, 320);

    const scene = new THREE.Scene();
    const daySkyColor = new THREE.Color(0xeaf1fa);
    const eveningSkyColor = new THREE.Color(0x16223b);
    scene.background = daySkyColor.clone();
    scene.fog = new THREE.Fog(0xeaf1fa, 22, 52);

    const camera = new THREE.PerspectiveCamera(42, width / height, 0.2, 120);
    const initialZone = CLINIC_ZONES[0];
    camera.position.set(...initialZone.cameraPosition);

    const renderer = new THREE.WebGLRenderer({
      antialias: !isSoftwareGl,
      powerPreference: 'high-performance',
    });
    renderer.setSize(width, height);
    renderer.setPixelRatio(isSoftwareGl ? 1 : Math.min(window.devicePixelRatio, 2));
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.08;
    renderer.shadowMap.enabled = !isSoftwareGl;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.domElement.className = 'block w-full h-full outline-none cursor-grab active:cursor-grabbing';

    container.appendChild(renderer.domElement);

    // Studio IBL reflections for steel, glass, and mullions
    const pmremGenerator = new THREE.PMREMGenerator(renderer);
    const envTarget = pmremGenerator.fromScene(new RoomEnvironment(), 0.04);
    scene.environment = envTarget.texture;
    pmremGenerator.dispose();

    // Balanced 3-point warm/cool studio lighting rig (1 shadow caster)
    const hemiLight = new THREE.HemisphereLight(0xdbeafe, 0x94a3b8, 0.95);
    scene.add(hemiLight);

    const keyLight = new THREE.DirectionalLight(0xfff4e0, 1.9);
    keyLight.position.set(12, 18, 11);
    keyLight.castShadow = !isSoftwareGl;
    keyLight.shadow.mapSize.set(1024, 1024);
    keyLight.shadow.camera.near = 2;
    keyLight.shadow.camera.far = 45;
    keyLight.shadow.camera.left = -12;
    keyLight.shadow.camera.right = 12;
    keyLight.shadow.camera.top = 12;
    keyLight.shadow.camera.bottom = -12;
    keyLight.shadow.bias = -0.0005;
    keyLight.shadow.normalBias = 0.02;
    scene.add(keyLight);

    const rimLight = new THREE.DirectionalLight(0x93c5fd, 0.55);
    rimLight.position.set(-10, 9, -12);
    scene.add(rimLight);

    const interiorExamLight = new THREE.PointLight(0xe0f2fe, 0.8, 12, 2);
    interiorExamLight.position.set(3.0, 2.8, 0.3);
    scene.add(interiorExamLight);

    const interiorReceptionLight = new THREE.PointLight(0xfef3c7, 0.7, 12, 2);
    interiorReceptionLight.position.set(-3.4, 2.8, 2.0);
    scene.add(interiorReceptionLight);

    // Build 3D Clinic Scene Models
    const maxAniso = renderer.capabilities.getMaxAnisotropy();
    const assets = buildClinicSceneModels(maxAniso, isSoftwareGl);
    scene.add(assets.root);

    if (!isSoftwareGl) {
      renderer.compile(scene, camera);
    }

    // Orbit Controls
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.target.set(...initialZone.cameraTarget);
    controls.enableDamping = !isSoftwareGl;
    controls.dampingFactor = 0.06;
    controls.minDistance = 4.5;
    controls.maxDistance = 26;
    controls.maxPolarAngle = Math.PI / 2.15;
    controls.minPolarAngle = 0.25;
    controls.update();

    // Camera transition state
    let transitionActive = false;
    _desiredPos.set(...initialZone.cameraPosition);
    _desiredTarget.set(...initialZone.cameraTarget);
    let lastTimestamp = performance.now();

    // Coalesced on-demand render loop + software-WebGL afterDraw pacing
    let frameId = 0;
    let renderBusy = false;
    let renderDirty = false;
    let disposed = false;

    const afterDraw = (cb: () => void) => {
      const gl = renderer.getContext() as WebGL2RenderingContext;
      const sync = gl.fenceSync(gl.SYNC_GPU_COMMANDS_COMPLETE, 0);
      gl.flush();
      const poll = () => {
        if (disposed) {
          if (sync) gl.deleteSync(sync);
          return;
        }
        const state = sync && gl.getSyncParameter(sync, gl.SYNC_STATUS);
        if (state === gl.UNSIGNALED) {
          frameId = window.setTimeout(poll, 5);
        } else {
          if (sync) gl.deleteSync(sync);
          frameId = window.setTimeout(cb, 80);
        }
      };
      frameId = window.setTimeout(poll, 5);
    };

    const requestRender = () => {
      if (disposed) return;
      if (renderBusy) {
        renderDirty = true;
        return;
      }
      renderBusy = true;
      frameId = requestAnimationFrame((now) => {
        if (disposed) return;
        renderDirty = false;
        const delta = Math.min((now - lastTimestamp) / 1000, 0.1);
        lastTimestamp = now;

        if (transitionActive) {
          if (isSoftwareGl) {
            camera.position.copy(_desiredPos);
            controls.target.copy(_desiredTarget);
            transitionActive = false;
          } else {
            const lambda = 6.5;
            camera.position.x = THREE.MathUtils.damp(camera.position.x, _desiredPos.x, lambda, delta);
            camera.position.y = THREE.MathUtils.damp(camera.position.y, _desiredPos.y, lambda, delta);
            camera.position.z = THREE.MathUtils.damp(camera.position.z, _desiredPos.z, lambda, delta);
            controls.target.x = THREE.MathUtils.damp(controls.target.x, _desiredTarget.x, lambda, delta);
            controls.target.y = THREE.MathUtils.damp(controls.target.y, _desiredTarget.y, lambda, delta);
            controls.target.z = THREE.MathUtils.damp(controls.target.z, _desiredTarget.z, lambda, delta);

            if (
              camera.position.distanceTo(_desiredPos) < 0.04 &&
              controls.target.distanceTo(_desiredTarget) < 0.04
            ) {
              camera.position.copy(_desiredPos);
              controls.target.copy(_desiredTarget);
              transitionActive = false;
            }
          }
        }

        // Subtle animated dog tail / beacon rotation during interaction
        const t = now * 0.0025;
        assets.animatedParts.dogTail.rotation.z = Math.sin(t * 2.2) * 0.18;
        assets.animatedParts.beaconPins.forEach((pin, idx) => {
          pin.rotation.y = t * 0.7 + idx * 0.8;
        });

        controls.update();
        renderer.render(scene, camera);

        const done = () => {
          renderBusy = false;
          if (transitionActive || renderDirty) {
            requestRender();
          }
        };

        if (isSoftwareGl) {
          afterDraw(done);
        } else {
          done();
        }
      });
    };

    const handleControlsStart = () => {
      transitionActive = false;
    };
    const handleControlsChange = () => {
      requestRender();
    };
    controls.addEventListener('start', handleControlsStart);
    controls.addEventListener('change', handleControlsChange);

    // Raycasting on Layer 1 for clickable clinic zones
    const raycaster = new THREE.Raycaster();
    raycaster.layers.set(1);
    let pointerDownPos = { x: 0, y: 0 };
    let lastHoverCheck = 0;

    const handlePointerDown = (e: PointerEvent) => {
      pointerDownPos = { x: e.clientX, y: e.clientY };
    };

    const handlePointerMove = (e: PointerEvent) => {
      const now = performance.now();
      if (now - lastHoverCheck < 65) return;
      lastHoverCheck = now;
      const rect = renderer.domElement.getBoundingClientRect();
      _pointerNdc.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      _pointerNdc.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;
      raycaster.setFromCamera(_pointerNdc, camera);
      const hits = raycaster.intersectObjects(assets.interactables, false);
      renderer.domElement.style.cursor = hits.length > 0 ? 'pointer' : 'grab';
    };

    const handlePointerUp = (e: PointerEvent) => {
      const dx = e.clientX - pointerDownPos.x;
      const dy = e.clientY - pointerDownPos.y;
      if (Math.hypot(dx, dy) > 6) return; // Dragged camera, not a click

      const rect = renderer.domElement.getBoundingClientRect();
      _pointerNdc.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      _pointerNdc.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;
      raycaster.setFromCamera(_pointerNdc, camera);
      const hits = raycaster.intersectObjects(assets.interactables, false);
      if (hits.length > 0) {
        const zoneId = hits[0].object.userData.zoneId as ClinicZoneId | undefined;
        if (zoneId) {
          onSelectZoneRef.current(zoneId);
        }
      }
    };

    renderer.domElement.addEventListener('pointerdown', handlePointerDown);
    renderer.domElement.addEventListener('pointermove', handlePointerMove);
    renderer.domElement.addEventListener('pointerup', handlePointerUp);

    // WebGL context loss safety
    const handleContextLost = (event: Event) => {
      event.preventDefault();
      setContextLost(true);
    };
    const handleContextRestored = () => {
      setContextLost(false);
      requestRender();
    };
    renderer.domElement.addEventListener('webglcontextlost', handleContextLost);
    renderer.domElement.addEventListener('webglcontextrestored', handleContextRestored);

    // Resize observer
    const handleResize = () => {
      if (!container || disposed) return;
      const nextW = Math.max(container.clientWidth, 320);
      const nextH = Math.max(container.clientHeight, 320);
      camera.aspect = nextW / nextH;
      camera.updateProjectionMatrix();
      renderer.setSize(nextW, nextH);
      requestRender();
    };
    const resizeObserver = new ResizeObserver(handleResize);
    resizeObserver.observe(container);

    // Bridge methods for React state sync
    sceneBridgeRef.current = {
      goToZone: (zoneId: ClinicZoneId) => {
        const targetZone = CLINIC_ZONES.find((z) => z.id === zoneId) ?? CLINIC_ZONES[0];
        _desiredPos.set(...targetZone.cameraPosition);
        _desiredTarget.set(...targetZone.cameraTarget);
        transitionActive = true;
        requestRender();
      },
      highlightZone: (zoneId: ClinicZoneId) => {
        assets.zoneRings.forEach((ring, key) => {
          const mat = ring.material as THREE.MeshBasicMaterial;
          if (key === zoneId) {
            mat.color.setHex(0xf59e0b);
            mat.opacity = 0.75;
          } else {
            mat.color.setHex(0x2563eb);
            mat.opacity = 0.25;
          }
        });
        requestRender();
      },
      setLightingMode: (mode: LightingPreset) => {
        if (mode === 'evening') {
          scene.background = eveningSkyColor.clone();
          if (scene.fog instanceof THREE.Fog) scene.fog.color.copy(eveningSkyColor);
          hemiLight.intensity = 0.45;
          keyLight.intensity = 0.55;
          keyLight.color.setHex(0x93c5fd);
          interiorExamLight.intensity = 2.6;
          interiorReceptionLight.intensity = 2.4;
        } else {
          scene.background = daySkyColor.clone();
          if (scene.fog instanceof THREE.Fog) scene.fog.color.copy(daySkyColor);
          hemiLight.intensity = 0.95;
          keyLight.intensity = 1.9;
          keyLight.color.setHex(0xfff4e0);
          interiorExamLight.intensity = 0.8;
          interiorReceptionLight.intensity = 0.7;
        }
        requestRender();
      },
    };

    requestRender();

    return () => {
      disposed = true;
      cancelAnimationFrame(frameId);
      clearTimeout(frameId);
      resizeObserver.disconnect();
      controls.removeEventListener('start', handleControlsStart);
      controls.removeEventListener('change', handleControlsChange);
      controls.dispose();
      renderer.domElement.removeEventListener('pointerdown', handlePointerDown);
      renderer.domElement.removeEventListener('pointermove', handlePointerMove);
      renderer.domElement.removeEventListener('pointerup', handlePointerUp);
      renderer.domElement.removeEventListener('webglcontextlost', handleContextLost);
      renderer.domElement.removeEventListener('webglcontextrestored', handleContextRestored);

      assets.disposables.geometries.forEach((g) => g.dispose());
      assets.disposables.materials.forEach((m) => m.dispose());
      assets.disposables.textures.forEach((t) => t.dispose());
      envTarget.dispose();
      renderer.dispose();
      if (renderer.domElement.parentNode === container) {
        container.removeChild(renderer.domElement);
      }
      sceneBridgeRef.current = null;
    };
  }, []);

  useEffect(() => {
    sceneBridgeRef.current?.goToZone(activeZone);
    sceneBridgeRef.current?.highlightZone(activeZone);
  }, [activeZone]);

  useEffect(() => {
    sceneBridgeRef.current?.setLightingMode(lighting);
  }, [lighting]);

  return (
    <div
      data-testid="clinic-3d-viewport"
      data-zone={activeZone}
      data-lighting={lighting}
      className="relative w-full h-[460px] md:h-[540px] rounded-2xl overflow-hidden border border-slate-200 bg-[#EAF1FA] shadow-sm"
    >
      {/* Dedicated isolated WebGL canvas mount */}
      <div ref={mountRef} className="w-full h-full" />

      {contextLost && (
        <div className="absolute inset-0 flex items-center justify-center bg-slate-100 text-slate-700 text-sm font-medium">
          3D clinic view is recovering graphics context…
        </div>
      )}

      {/* Top-Left Compact Active Zone Card (zero backdrop-blur over WebGL, unobstructed center) */}
      <div className="absolute top-4 left-4 z-10 max-w-xs sm:max-w-sm bg-white/95 border border-slate-200 rounded-xl p-4 shadow-sm pointer-events-auto">
        <div className="flex items-center justify-between gap-3">
          <span className="text-xs font-semibold text-blue-700 tracking-wide">
            {currentZoneInfo.label} · Interactive 3D Tour
          </span>
          <button
            type="button"
            onClick={() => onSelectZone('overview')}
            aria-label="Reset 3D camera to Overview"
            className="inline-flex items-center gap-1 text-xs font-medium text-slate-500 hover:text-slate-900 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5" aria-hidden="true" />
            Reset
          </button>
        </div>
        <h2 className="mt-1 text-base font-semibold text-slate-900 leading-snug">
          {currentZoneInfo.title}
        </h2>
        <p className="mt-1 text-xs text-slate-600 leading-relaxed line-clamp-2">
          {currentZoneInfo.summary}
        </p>
        <div className="mt-3 flex items-center justify-between gap-2 pt-2.5 border-t border-slate-100">
          <span className="text-xs text-slate-500 truncate">
            {currentZoneInfo.equipment.slice(0, 2).join(' · ')}
          </span>
          <button
            type="button"
            onClick={() => onBookZone(currentZoneInfo.linkedAppointmentType)}
            className="px-3 py-1.5 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer"
          >
            Book Visit
          </button>
        </div>
      </div>

      {/* Collapsible Bottom Control Dock (Zero Viewport Center Occlusion) */}
      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-10 flex flex-col items-center max-w-[94vw] pointer-events-auto">
        <button
          type="button"
          onClick={() => setDockOpen((prev) => !prev)}
          aria-expanded={dockOpen}
          className="mb-1.5 inline-flex items-center gap-1.5 px-3 py-1 text-xs font-medium text-slate-700 bg-white/95 hover:bg-white border border-slate-200 rounded-lg shadow-sm transition-colors whitespace-nowrap shrink-0 cursor-pointer"
        >
          {dockOpen ? (
            <>
              <ChevronDown className="w-3.5 h-3.5" aria-hidden="true" />
              Hide Controls
            </>
          ) : (
            <>
              <ChevronUp className="w-3.5 h-3.5" aria-hidden="true" />
              Show Tour Controls
            </>
          )}
        </button>

        {dockOpen && (
          <div className="flex flex-wrap sm:flex-nowrap items-center justify-center gap-1.5 p-1.5 bg-white/95 border border-slate-200 rounded-xl shadow-sm">
            <div className="flex items-center gap-1 flex-wrap justify-center">
              {CLINIC_ZONES.map((zone) => {
                const isActive = zone.id === activeZone;
                return (
                  <button
                    key={zone.id}
                    type="button"
                    onClick={() => onSelectZone(zone.id)}
                    aria-pressed={isActive}
                    className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                      isActive
                        ? 'bg-blue-600 text-white'
                        : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                    }`}
                  >
                    {zone.label}
                  </button>
                );
              })}
            </div>

            <span className="hidden sm:inline-block w-px h-5 bg-slate-200 mx-1" aria-hidden="true" />

            <button
              type="button"
              onClick={() =>
                setLighting((prev) => (prev === 'daylight' ? 'evening' : 'daylight'))
              }
              aria-label={`Switch lighting to ${lighting === 'daylight' ? 'Evening' : 'Daylight'}`}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-700 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer"
            >
              {lighting === 'daylight' ? (
                <>
                  <Moon className="w-3.5 h-3.5 text-slate-600" aria-hidden="true" />
                  Evening
                </>
              ) : (
                <>
                  <Sun className="w-3.5 h-3.5 text-amber-500" aria-hidden="true" />
                  Daylight
                </>
              )}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

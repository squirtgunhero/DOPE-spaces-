"""SceneExporter -- export scenes in various formats."""

from __future__ import annotations

import json
import html
import logging
from copy import deepcopy
from datetime import datetime, timezone

logger = logging.getLogger(__name__)


class SceneExporter:
    """Export SceneDocument dicts in various consumer formats."""

    def export_json(self, scene: dict) -> dict:
        """Clean JSON export with metadata and timestamp."""
        export = deepcopy(scene)
        export["_export"] = {
            "format": "dope-spaces-scene",
            "version": "1.0",
            "exported_at": datetime.now(timezone.utc).isoformat(),
            "generator": "DOPE [spaces] Backend v1.0",
        }
        return export

    def export_gltf_config(self, scene: dict) -> dict:
        """Export as a Three.js-compatible loader config.

        This produces a config object that a Three.js application can
        consume to reconstruct the scene programmatically -- it is NOT
        a binary glTF file, but a JSON recipe for building the scene
        with the Three.js API.
        """
        config: dict = {
            "_format": "threejs-scene-config",
            "_version": "1.0",
            "_exported_at": datetime.now(timezone.utc).isoformat(),
        }

        # --- Scene environment ---
        scene_block = scene.get("scene") or scene.get("environment") or {}
        config["scene"] = {
            "background": scene_block.get("background", "#0a0e1a"),
            "fog": scene_block.get("fog"),
            "environment": scene_block.get("environment"),
        }

        # --- Camera ---
        cam = scene.get("camera", {})
        config["camera"] = {
            "type": "PerspectiveCamera",
            "fov": cam.get("fov", 50),
            "position": cam.get("position", [8, 6, 8]),
            "lookAt": cam.get("lookAt", [0, 1, 0]),
        }

        # --- Lights ---
        config["lights"] = []
        type_map = {
            "ambient": "AmbientLight",
            "directional": "DirectionalLight",
            "point": "PointLight",
            "spot": "SpotLight",
            "hemisphere": "HemisphereLight",
        }
        for light in scene.get("lights", []):
            entry: dict = {
                "class": type_map.get(light.get("type", ""), light.get("type", "")),
                "color": light.get("color", "#ffffff"),
                "intensity": light.get("intensity", 1),
            }
            for key in ("position", "target", "castShadow", "groundColor", "angle", "penumbra", "distance", "decay"):
                val = light.get(key)
                if val is not None:
                    entry[key] = val
            config["lights"].append(entry)

        # --- Objects -> Meshes ---
        config["meshes"] = []
        for obj in scene.get("objects", []):
            mesh = self._object_to_mesh_config(obj)
            config["meshes"].append(mesh)

        # --- Ground ---
        ground = scene.get("ground")
        if ground:
            config["ground"] = ground

        return config

    def export_embed_config(self, scene: dict) -> dict:
        """Export as an embeddable config with a self-contained HTML/JS snippet.

        The snippet loads Three.js from CDN and renders the scene in a
        responsive container.
        """
        scene_json_str = json.dumps(scene, indent=2)
        escaped_json = html.escape(scene_json_str, quote=True)

        snippet = self._generate_embed_html(scene_json_str)

        return {
            "_format": "dope-spaces-embed",
            "_version": "1.0",
            "_exported_at": datetime.now(timezone.utc).isoformat(),
            "scene": scene,
            "embed_html": snippet,
            "instructions": (
                "Paste the embed_html into any webpage. The snippet is self-contained "
                "and loads Three.js from a CDN. Adjust the container width/height as needed."
            ),
        }

    # --- Private helpers ---

    @staticmethod
    def _object_to_mesh_config(obj: dict) -> dict:
        """Convert a SceneObject dict into a Three.js mesh config."""
        mesh: dict = {"name": obj.get("name", "unnamed")}

        if obj.get("parts"):
            mesh["type"] = "Group"
            mesh["children"] = []
            for part in obj["parts"]:
                child: dict = {
                    "name": part.get("name", "part"),
                    "type": "Mesh",
                    "geometry": part.get("geometry"),
                    "material": part.get("material"),
                }
                for key in ("position", "rotation", "scale", "castShadow", "receiveShadow"):
                    val = part.get(key)
                    if val is not None:
                        child[key] = val
                mesh["children"].append(child)
        else:
            mesh["type"] = "Mesh"
            mesh["geometry"] = obj.get("geometry")
            mesh["material"] = obj.get("material")

        for key in ("position", "rotation", "scale", "castShadow", "receiveShadow", "animation", "states"):
            val = obj.get(key)
            if val is not None:
                mesh[key] = val

        return mesh

    @staticmethod
    def _generate_embed_html(scene_json_str: str) -> str:
        """Generate a self-contained HTML snippet that renders the scene."""

        return f"""<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8"/>
<meta name="viewport" content="width=device-width, initial-scale=1.0"/>
<title>DOPE [spaces] Scene</title>
<style>
  * {{ margin: 0; padding: 0; box-sizing: border-box; }}
  body {{ background: #000; overflow: hidden; }}
  #canvas-container {{
    width: 100vw;
    height: 100vh;
    position: relative;
  }}
  canvas {{ display: block; }}
  #watermark {{
    position: absolute;
    bottom: 12px;
    right: 16px;
    color: rgba(255,255,255,0.3);
    font: 11px/1 -apple-system, BlinkMacSystemFont, sans-serif;
    pointer-events: none;
    user-select: none;
  }}
</style>
</head>
<body>
<div id="canvas-container">
  <div id="watermark">DOPE [spaces]</div>
</div>

<script type="importmap">
{{
  "imports": {{
    "three": "https://cdn.jsdelivr.net/npm/three@0.171.0/build/three.module.js",
    "three/addons/": "https://cdn.jsdelivr.net/npm/three@0.171.0/examples/jsm/"
  }}
}}
</script>

<script type="module">
import * as THREE from 'three';
import {{ OrbitControls }} from 'three/addons/controls/OrbitControls.js';

const sceneData = {scene_json_str};

// --- Renderer ---
const container = document.getElementById('canvas-container');
const renderer = new THREE.WebGLRenderer({{ antialias: true, alpha: false }});
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.2;
container.appendChild(renderer.domElement);

// --- Scene ---
const scene = new THREE.Scene();
const envBlock = sceneData.scene || sceneData.environment || {{}};
scene.background = new THREE.Color(envBlock.background || '#0a0e1a');
if (envBlock.fog) {{
  scene.fog = new THREE.Fog(envBlock.fog.color || '#000', envBlock.fog.near || 10, envBlock.fog.far || 50);
}}

// --- Camera ---
const cam = sceneData.camera || {{ position: [8,6,8], lookAt: [0,1,0], fov: 50 }};
const camera = new THREE.PerspectiveCamera(cam.fov || 50, window.innerWidth / window.innerHeight, 0.1, 1000);
camera.position.set(...(cam.position || [8,6,8]));
const lookAt = cam.lookAt || [0,1,0];
camera.lookAt(new THREE.Vector3(...lookAt));

// --- Controls ---
const controls = new OrbitControls(camera, renderer.domElement);
controls.target.set(...lookAt);
controls.enableDamping = true;
controls.dampingFactor = 0.05;

// --- Lights ---
for (const ld of (sceneData.lights || [])) {{
  let light;
  switch (ld.type) {{
    case 'ambient': light = new THREE.AmbientLight(ld.color || '#fff', ld.intensity || 1); break;
    case 'directional':
      light = new THREE.DirectionalLight(ld.color || '#fff', ld.intensity || 1);
      if (ld.position) light.position.set(...ld.position);
      if (ld.castShadow) {{ light.castShadow = true; light.shadow.mapSize.set(1024,1024); }}
      break;
    case 'point':
      light = new THREE.PointLight(ld.color || '#fff', ld.intensity || 1, ld.distance || 0, ld.decay ?? 2);
      if (ld.position) light.position.set(...ld.position);
      break;
    case 'spot':
      light = new THREE.SpotLight(ld.color || '#fff', ld.intensity || 1, ld.distance || 0, ld.angle || Math.PI/6, ld.penumbra || 0);
      if (ld.position) light.position.set(...ld.position);
      if (ld.castShadow) {{ light.castShadow = true; }}
      break;
    case 'hemisphere':
      light = new THREE.HemisphereLight(ld.color || '#fff', ld.groundColor || '#444', ld.intensity || 1);
      break;
    default: continue;
  }}
  if (light) scene.add(light);
}}

// --- Helper: create geometry ---
function makeGeometry(g) {{
  if (!g) return new THREE.BoxGeometry(1,1,1);
  switch (g.type) {{
    case 'sphere': return new THREE.SphereGeometry(g.radius||1, g.widthSegments||32, g.heightSegments||16);
    case 'box': return new THREE.BoxGeometry(g.width||1, g.height||1, g.depth||1);
    case 'cylinder': return new THREE.CylinderGeometry(g.radiusTop??1, g.radiusBottom??1, g.height||1, g.radialSegments||32);
    case 'cone': return new THREE.ConeGeometry(g.radius||1, g.height||1, g.radialSegments||32);
    case 'torus': return new THREE.TorusGeometry(g.radius||1, g.tube||0.4, 16, 100);
    case 'torusKnot': return new THREE.TorusKnotGeometry(g.radius||1, g.tube||0.3, 100, 16, g.p||2, g.q||3);
    case 'dodecahedron': return new THREE.DodecahedronGeometry(g.radius||1);
    case 'icosahedron': return new THREE.IcosahedronGeometry(g.radius||1);
    case 'octahedron': return new THREE.OctahedronGeometry(g.radius||1);
    case 'plane': return new THREE.PlaneGeometry(g.width||1, g.height||1);
    case 'ring': return new THREE.RingGeometry(g.innerRadius||0.5, g.outerRadius||1, 32);
    default: return new THREE.BoxGeometry(1,1,1);
  }}
}}

// --- Helper: create material ---
function makeMaterial(m) {{
  if (!m) return new THREE.MeshStandardMaterial({{ color: '#888' }});
  const props = {{ color: m.color || '#888' }};
  if (m.metalness != null) props.metalness = m.metalness;
  if (m.roughness != null) props.roughness = m.roughness;
  if (m.emissive) props.emissive = new THREE.Color(m.emissive);
  if (m.emissiveIntensity != null) props.emissiveIntensity = m.emissiveIntensity;
  if (m.transparent) {{ props.transparent = true; props.opacity = m.opacity ?? 0.5; }}
  if (m.wireframe) props.wireframe = true;
  if (m.flatShading) props.flatShading = true;
  if (m.side === 'double') props.side = THREE.DoubleSide;
  if (m.type === 'physical') {{
    const mat = new THREE.MeshPhysicalMaterial(props);
    if (m.clearcoat != null) mat.clearcoat = m.clearcoat;
    if (m.transmission != null) mat.transmission = m.transmission;
    if (m.ior != null) mat.ior = m.ior;
    if (m.thickness != null) mat.thickness = m.thickness;
    return mat;
  }}
  if (m.type === 'basic') return new THREE.MeshBasicMaterial(props);
  return new THREE.MeshStandardMaterial(props);
}}

// --- Build objects ---
const animatedObjects = [];

for (const od of (sceneData.objects || [])) {{
  let obj;
  if (od.parts && od.parts.length) {{
    obj = new THREE.Group();
    obj.name = od.name || 'group';
    for (const p of od.parts) {{
      const mesh = new THREE.Mesh(makeGeometry(p.geometry), makeMaterial(p.material));
      if (p.position) mesh.position.set(...p.position);
      if (p.rotation) mesh.rotation.set(...p.rotation);
      if (p.scale) {{
        if (Array.isArray(p.scale)) mesh.scale.set(...p.scale);
        else mesh.scale.setScalar(p.scale);
      }}
      if (p.castShadow) mesh.castShadow = true;
      if (p.receiveShadow) mesh.receiveShadow = true;
      obj.add(mesh);
    }}
  }} else {{
    obj = new THREE.Mesh(makeGeometry(od.geometry), makeMaterial(od.material));
    obj.name = od.name || 'mesh';
  }}

  if (od.position) obj.position.set(...od.position);
  if (od.rotation) obj.rotation.set(...od.rotation);
  if (od.scale) {{
    if (Array.isArray(od.scale)) obj.scale.set(...od.scale);
    else obj.scale.setScalar(od.scale);
  }}
  if (od.castShadow) obj.castShadow = true;
  if (od.receiveShadow) obj.receiveShadow = true;

  if (od.animation) animatedObjects.push({{ obj, anim: od.animation }});
  scene.add(obj);
}}

// --- Animation loop ---
const clock = new THREE.Clock();

function animate() {{
  requestAnimationFrame(animate);
  const t = clock.getElapsedTime();

  for (const {{ obj, anim }} of animatedObjects) {{
    if (!anim) continue;
    const spd = anim.speed || 1;
    const phase = anim.phase || 0;

    switch (anim.type) {{
      case 'rotateX': obj.rotation.x += spd * 0.016; break;
      case 'rotateY': obj.rotation.y += spd * 0.016; break;
      case 'rotateZ': obj.rotation.z += spd * 0.016; break;
      case 'float': {{
        const amp = anim.amplitude || 0.3;
        const baseY = anim.baseY ?? obj.position.y;
        obj.position.y = baseY + Math.sin(t * spd + phase) * amp;
        break;
      }}
      case 'pulse': {{
        const bs = anim.baseScale || 1;
        const amp = anim.amplitude || 0.1;
        const s = bs + Math.sin(t * spd + phase) * amp;
        obj.scale.setScalar(s);
        break;
      }}
      case 'sway': {{
        const amp = anim.amplitude || 0.3;
        const ax = anim.axis || 'z';
        const val = Math.sin(t * spd + phase) * amp;
        obj.rotation[ax] = val;
        break;
      }}
      case 'orbit': {{
        const r = anim.radius || 3;
        const cx = (anim.center && anim.center[0]) || 0;
        const cz = (anim.center && anim.center[2]) || 0;
        obj.position.x = cx + Math.cos(t * spd + phase) * r;
        obj.position.z = cz + Math.sin(t * spd + phase) * r;
        break;
      }}
    }}
  }}

  controls.update();
  renderer.render(scene, camera);
}}
animate();

// --- Resize ---
window.addEventListener('resize', () => {{
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
}});
</script>
</body>
</html>"""

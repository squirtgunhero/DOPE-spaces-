import { NextRequest, NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';

/**
 * Fallback API route — used when the Python backend is unavailable.
 * Handles /api/generate, /api/revise, /api/validate, /api/export.
 * The Python backend is the primary path; this is a degraded fallback.
 */

const SYSTEM_PROMPT = `You are a 3D scene architect for DOPE [spaces], an NLP-driven 3D scene generation engine.

You generate structured SceneDocument JSON that a Three.js renderer consumes.

## Output Format
Return ONLY valid JSON. No markdown fences. No text before or after.

## SceneDocument Schema
{
  "version": "1.0",
  "metadata": {
    "title": "string",
    "category": "product_pedestal|abstract_shapes|architectural|sci_fi|gallery|real_estate",
    "style": "string",
    "mood": "string",
    "complexity": 0.5,
    "realism": 0.5
  },
  "environment": {
    "background": "#hex",
    "fogColor": "#hex (optional)",
    "fogDensity": 0.02,
    "ambientIntensity": 0.4,
    "environmentPreset": "studio|sunset|night|warehouse (optional)"
  },
  "camera": { "position": [x,y,z], "lookAt": [x,y,z], "fov": 50 },
  "lights": [
    { "type": "directional|point|spot|hemisphere|ambient", "color": "#hex", "intensity": 1.0, "position": [x,y,z], "castShadow": true }
  ],
  "objects": [
    {
      "name": "string",
      "geometry": { "type": "sphere|box|cylinder|cone|torus|torusKnot|dodecahedron|icosahedron|octahedron|plane|ring|lathe|extrude|terrain", "params": {} },
      "material": { "type": "standard|physical|basic", "color": "#hex", "roughness": 0.5, "metalness": 0.0, "emissive": "#hex", "emissiveIntensity": 1.0, "opacity": 1.0, "clearcoat": 0.0, "transmission": 0.0 },
      "parts": [{ "geometry": {...}, "material": {...}, "position": [x,y,z], "rotation": [x,y,z], "scale": [x,y,z] }],
      "position": [x,y,z], "rotation": [x,y,z], "scale": [x,y,z] or number,
      "animation": {
        "rotateX": 0.5, "rotateY": 0.5, "rotateZ": 0.5,
        "float": { "amplitude": 0.2, "speed": 1.0, "phase": 0 },
        "sway": { "axis": "x|y|z", "amplitude": 0.1, "speed": 1.0 },
        "pulse": { "baseScale": 1.0, "amplitude": 0.1, "speed": 1.0 },
        "orbit": { "center": [0,0,0], "radius": 3, "speed": 0.5 },
        "path": { "points": [[x,y,z],...], "speed": 1, "loop": true },
        "keyframes": { "loop": true, "frames": [{ "position": [x,y,z], "rotation": [x,y,z], "scale": 1, "dur": 1, "ease": "inOutCubic" }] },
        "emissivePulse": { "min": 0.2, "max": 1.0, "speed": 2.0 },
        "partAnimations": [{ "partIndex": 0, "rotateY": 1.0 }]
      },
      "states": { "hover": { "scale": [1.1,1.1,1.1], "color": "#fff" }, "active": { "scale": [0.95,0.95,0.95] } },
      "semanticRole": "hero|accent|background|lighting",
      "semanticTags": ["geometric", "floating"]
    }
  ],
  "ground": { "size": 30, "y": 0, "material": { "type": "standard", "color": "#hex", "roughness": 0.8 } },
  "revisions": []
}

## Geometry params
- sphere: {radius, widthSegments, heightSegments}
- box: {width, height, depth}
- cylinder: {radiusTop, radiusBottom, height, radialSegments}
- cone: {radius, height, radialSegments}
- torus: {radius, tube}
- torusKnot: {radius, tube, p, q}
- plane: {width, height}
- ring: {innerRadius, outerRadius}
- lathe: {points: [[x,y],...], segments}
- extrude: {vertices: [[x,y],...], depth, bevelEnabled}
- terrain: {size, segments, heightScale}

## Compound Object Recipes
Use "parts" array for complex objects:
- Tree: trunk(cylinder) + crown(sphere or cone)
- Chair: seat(box) + 4 legs(cylinder) + back(box)
- Lamp: base(cylinder) + pole(cylinder) + shade(cone)
- Table: top(box) + 4 legs(cylinder)
- Building: body(box) + roof(box or cone) + windows(emissive boxes)
- Robot: torso(box) + head(sphere) + arms(cylinders) + legs(cylinders)
- Pedestal: base(cylinder) + column(cylinder) + top(cylinder or box)

## Design Rules
- 1 unit ≈ 1 meter
- Always include ground plane for grounded scenes
- Enable shadows on directional lights
- Use emissive + emissiveIntensity for glowing elements
- Use phase offsets so identical animations don't sync
- 60%+ of objects should have animation
- Include hover/active states for interactivity
- Use physically plausible material values
- Create depth through layered compositions
- Assign semanticRole and semanticTags to all objects`;

function getAnthropicClient() {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) throw new Error('ANTHROPIC_API_KEY not configured');
  return new Anthropic({ apiKey });
}

function extractJSON(text: string): unknown {
  const trimmed = text.trim();
  try { return JSON.parse(trimmed); } catch { /* continue */ }
  const fenceMatch = trimmed.match(/```(?:json)?\s*([\s\S]*?)```/);
  if (fenceMatch) return JSON.parse(fenceMatch[1].trim());
  const start = trimmed.indexOf('{');
  const end = trimmed.lastIndexOf('}');
  if (start !== -1 && end !== -1) return JSON.parse(trimmed.slice(start, end + 1));
  throw new Error('Could not parse response as JSON');
}

// POST /api/generate — scene generation
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { prompt, instruction, scene: existingScene, format } = body;

    const client = getAnthropicClient();

    // Route based on what's in the body
    if (instruction && existingScene) {
      // This is a revision request
      const message = await client.messages.create({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 8192,
        system: SYSTEM_PROMPT + '\n\nYou are revising an existing scene. The user will provide the current scene and a revision instruction. Output the COMPLETE updated scene JSON. Only change what the instruction asks for. Preserve object names and structure.',
        messages: [{
          role: 'user',
          content: `Current scene:\n${JSON.stringify(existingScene, null, 2)}\n\nRevision instruction: ${instruction}`,
        }],
      });
      const textBlock = message.content.find((b) => b.type === 'text');
      if (!textBlock || textBlock.type !== 'text') throw new Error('No response');
      const json = extractJSON(textBlock.text);
      return NextResponse.json({ scene: json });
    }

    if (format && existingScene) {
      // This is an export request
      if (format === 'json') {
        return NextResponse.json({ data: existingScene, filename: 'scene.json' });
      }
      if (format === 'embed_config') {
        const html = generateEmbedHTML(existingScene);
        return NextResponse.json({ data: html, filename: 'scene.html', contentType: 'text/html' });
      }
      return NextResponse.json({ data: existingScene, filename: 'scene-config.json' });
    }

    if (existingScene && !instruction) {
      // This is a validate request
      const issues: string[] = [];
      if (!existingScene.lights || existingScene.lights.length === 0) issues.push('No lights in scene');
      if (!existingScene.objects || existingScene.objects.length === 0) issues.push('No objects in scene');
      return NextResponse.json({ valid: issues.length === 0, issues });
    }

    // This is a generation request
    if (!prompt) return NextResponse.json({ error: 'Prompt required' }, { status: 400 });

    const userMessage = body.style
      ? `${prompt}\n\nStyle preferences: style=${body.style}, realism=${body.realism ?? 0.5}, complexity=${body.complexity ?? 0.5}, animation=${body.animationAmount ?? 0.5}, camera=${body.cameraFraming || 'auto'}`
      : prompt;

    const message = await client.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 8192,
      system: SYSTEM_PROMPT,
      messages: [{ role: 'user', content: userMessage }],
    });

    const textBlock = message.content.find((b) => b.type === 'text');
    if (!textBlock || textBlock.type !== 'text') throw new Error('No response');
    const json = extractJSON(textBlock.text);
    return NextResponse.json({ scene: json });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : 'Unknown error';
    console.error('API error:', msg);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

function generateEmbedHTML(scene: unknown): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>DOPE [spaces] Scene</title>
<style>
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body { background: #000; overflow: hidden; }
  canvas { display: block; width: 100vw; height: 100vh; }
</style>
</head>
<body>
<script type="importmap">{"imports":{"three":"https://cdn.jsdelivr.net/npm/three@0.169.0/build/three.module.js","three/addons/":"https://cdn.jsdelivr.net/npm/three@0.169.0/examples/jsm/"}}</script>
<script type="module">
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
const scene = new THREE.Scene();
const sceneData = ${JSON.stringify(scene)};
// Scene setup from sceneData would go here
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.shadowMap.enabled = true;
document.body.appendChild(renderer.domElement);
const camera = new THREE.PerspectiveCamera(50, window.innerWidth/window.innerHeight, 0.1, 1000);
camera.position.set(8, 6, 8);
camera.lookAt(0, 1, 0);
const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
scene.add(new THREE.AmbientLight('#ffffff', 0.5));
const dl = new THREE.DirectionalLight('#ffffff', 1);
dl.position.set(5, 10, 5);
scene.add(dl);
function animate() { requestAnimationFrame(animate); controls.update(); renderer.render(scene, camera); }
animate();
window.addEventListener('resize', () => { camera.aspect = window.innerWidth/window.innerHeight; camera.updateProjectionMatrix(); renderer.setSize(window.innerWidth, window.innerHeight); });
</script>
</body>
</html>`;
}

"""RevisionEngine -- applies natural language revisions to an existing scene."""

from __future__ import annotations

import json
import logging
from typing import Any, Dict, List

import anthropic

from ..core.config import settings

logger = logging.getLogger(__name__)

REVISION_SYSTEM_PROMPT = r"""You are the revision engine for DOPE [spaces], a professional AI 3D scene editor.

You receive:
1. A current SceneDocument JSON (the full scene definition)
2. A natural language revision instruction from the user

Your job: apply the requested changes and return the UPDATED SceneDocument JSON.

CRITICAL RULES:
- Respond with ONLY valid JSON. No markdown fences, no explanation, no text before or after.
- The JSON you return must be a complete, valid SceneDocument -- same schema as the input.
- Preserve ALL objects, lights, and structure that the instruction does not mention changing.
- Keep object names stable. Do not rename objects unless the instruction asks for it.
- Only modify what the instruction requests. Be surgical, not destructive.
- If the instruction is ambiguous, make reasonable creative choices that enhance the scene.

REVISION TYPES AND HOW TO HANDLE THEM:

"make it more cinematic"
  -> Lower camera angle, add fog, increase directional light contrast, add rim lighting,
     darken background, add dramatic shadows (increase shadow-casting light intensity).

"warmer tones" / "make it warmer"
  -> Shift material colors toward warm palette (oranges, ambers, warm grays).
     Change light colors to warm whites (#FFF8E1, #FFE0B2).
     Add golden ambient light.

"cooler tones" / "make it colder"
  -> Shift toward blues, cyans, cool grays.
     Light colors: #E3F2FD, #BBDEFB.
     Add blue-tinted ambient.

"more reflective" / "shinier"
  -> Increase metalness on key objects (0.7-1.0), decrease roughness (0.05-0.2).
     Add clearcoat where appropriate.

"more matte" / "less shiny"
  -> Decrease metalness (0-0.1), increase roughness (0.7-1.0).

"less cluttered" / "simplify"
  -> Remove some accent/background objects (keep hero objects).
     Increase spacing between remaining objects.
     Reduce total object count by 30-50%.

"more objects" / "busier" / "more complex"
  -> Add more accent objects. Increase variety.
     Fill empty spaces with complementary objects.

"add floating particles"
  -> Add 5-15 small sphere or icosahedron objects with emissive materials
     and float animations. Scatter them around the scene at varying heights.
     Use phase offsets so they bob independently.

"lower camera" / "camera lower"
  -> Reduce camera Y position (0.3-1.5). Adjust lookAt to compensate.

"higher camera" / "bird's eye" / "top down"
  -> Increase camera Y (8-15). Look down at scene center.

"zoom in" / "closer"
  -> Move camera closer to scene center. Reduce FOV or move position.

"zoom out" / "wider"
  -> Move camera further away. Increase FOV slightly.

"more brutalist"
  -> Change materials to concrete (roughness:0.95, metalness:0, gray tones).
     Use box geometries, sharp angles. Muted color palette.

"more futuristic" / "sci-fi"
  -> Add emissive accents (neon colors). Metallic materials.
     Add floating elements. Dark background with color accents.

"more organic" / "natural"
  -> Use spheres, cones, curved shapes. Earth-tone materials.
     Add sway animations. Warm lighting.

"make it glow" / "neon"
  -> Add emissive to key objects. Increase emissiveIntensity.
     Add emissivePulse animations. Dark background to make glow pop.

"add shadows"
  -> Enable castShadow on directional/spot lights.
     Enable castShadow on objects, receiveShadow on ground.

"more animated" / "more movement"
  -> Add animations to static objects. Increase speeds slightly.
     Convert float to orbit for more dynamic motion. Add pulse/sway.

"less animated" / "more still"
  -> Remove animations from background objects.
     Reduce speeds. Remove orbit/path animations, keep subtle float/pulse.

"change colors to [X]"
  -> Update material colors to match the requested palette.
     Adjust lights to complement the new colors.

"rotate scene" / "turn"
  -> Rotate camera position around the Y axis. Keep same distance and height.

"add a [object]"
  -> Create a new compound or simple object matching the description.
     Place it in a sensible location that doesn't overlap existing objects.
     Give it appropriate material and animation.

"remove [object]"
  -> Find the object by name or description and remove it from the objects array.

"make [object] bigger/smaller"
  -> Find the object and adjust its scale.

"change background to [color]"
  -> Update scene.background to the new color.

Remember: Output ONLY the complete updated SceneDocument JSON."""


SUMMARY_SYSTEM_PROMPT = """Given the original scene JSON and the revised scene JSON, write a concise 1-2 sentence summary of what changed. Focus on the most important visual differences. No JSON, just plain English text."""


class RevisionEngine:
    """Applies natural language revisions to existing scenes via Claude."""

    def __init__(self) -> None:
        self._client = anthropic.Anthropic(api_key=settings.ANTHROPIC_API_KEY)

    async def apply_revision(self, scene: dict, instruction: str) -> Dict[str, Any]:
        """Apply a revision instruction to a scene.

        Returns a dict with keys:
          - "scene": the updated scene dict
          - "changes_summary": a human-readable summary of changes
        """

        scene_json = json.dumps(scene, indent=2)

        logger.info("Applying revision: %s", instruction[:120])

        # --- Step 1: Generate the revised scene ---
        message = self._client.messages.create(
            model=settings.MODEL_NAME,
            max_tokens=settings.MAX_TOKENS,
            system=REVISION_SYSTEM_PROMPT,
            messages=[
                {
                    "role": "user",
                    "content": (
                        f"CURRENT SCENE:\n```json\n{scene_json}\n```\n\n"
                        f"REVISION INSTRUCTION: {instruction}\n\n"
                        "Apply the revision and return the complete updated SceneDocument JSON."
                    ),
                }
            ],
        )

        raw_text = message.content[0].text.strip()

        # Strip markdown fences
        if raw_text.startswith("```"):
            first_newline = raw_text.index("\n")
            raw_text = raw_text[first_newline + 1:]
            if raw_text.endswith("```"):
                raw_text = raw_text[:raw_text.rfind("```")]

        revised_scene: dict = json.loads(raw_text)

        # --- Step 2: Generate a summary of changes ---
        changes_summary = await self._summarize_changes(scene, revised_scene, instruction)

        logger.info("Revision applied: %s", changes_summary[:100])

        return {
            "scene": revised_scene,
            "changes_summary": changes_summary,
        }

    async def _summarize_changes(
        self, original: dict, revised: dict, instruction: str
    ) -> str:
        """Generate a human-readable summary of what changed."""

        original_obj_count = len(original.get("objects", []))
        revised_obj_count = len(revised.get("objects", []))
        original_light_count = len(original.get("lights", []))
        revised_light_count = len(revised.get("lights", []))

        # Quick structural diff
        obj_diff = revised_obj_count - original_obj_count
        light_diff = revised_light_count - original_light_count

        summary_parts: List[str] = [f'Applied revision: "{instruction}".']

        if obj_diff > 0:
            summary_parts.append(f"Added {obj_diff} object(s).")
        elif obj_diff < 0:
            summary_parts.append(f"Removed {abs(obj_diff)} object(s).")

        if light_diff > 0:
            summary_parts.append(f"Added {light_diff} light(s).")
        elif light_diff < 0:
            summary_parts.append(f"Removed {abs(light_diff)} light(s).")

        # Check for camera changes
        orig_cam = original.get("camera", {})
        rev_cam = revised.get("camera", {})
        if orig_cam.get("position") != rev_cam.get("position"):
            summary_parts.append("Camera position adjusted.")

        # Check for background changes
        orig_bg = (original.get("scene", {}) or {}).get("background") or original.get("environment", {}).get("background")
        rev_bg = (revised.get("scene", {}) or {}).get("background") or revised.get("environment", {}).get("background")
        if orig_bg != rev_bg:
            summary_parts.append(f"Background changed to {rev_bg}.")

        return " ".join(summary_parts)

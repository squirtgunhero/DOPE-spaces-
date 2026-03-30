"""PromptParser -- extracts structured intent from a user's natural language prompt using Claude."""

from __future__ import annotations

import json
import logging

import anthropic

from ..core.config import settings
from ..models.scene import GenerateRequest

logger = logging.getLogger(__name__)

INTENT_SYSTEM_PROMPT = """You are a 3D scene intent extraction engine for DOPE [spaces], a professional AI 3D scene generator.

Given a user's natural language description of a 3D scene they want, extract structured intent that a scene planner can use to build the scene.

You MUST respond with valid JSON only -- no markdown fences, no explanation, no text before or after.

Extract the following fields:

{
  "scene_category": one of ["product_pedestal", "abstract_shapes", "architectural", "sci_fi", "gallery", "real_estate", "nature_landscape", "character_scene", "vehicle_scene", "interior_design", "fantasy", "urban_cityscape"],

  "style": one of ["futuristic", "minimal", "luxury", "brutalist", "organic", "crystalline", "retro", "cyberpunk", "steampunk", "art_deco", "japanese_zen", "memphis", "bauhaus", "vaporwave", "neon_noir"],

  "mood": one of ["cinematic", "warm", "cold", "dramatic", "playful", "mysterious", "serene", "energetic", "dark", "ethereal", "cozy", "industrial"],

  "key_objects": [
    {
      "name": "human-readable name",
      "description": "what it looks like, size, color",
      "type": "simple" or "compound",
      "importance": "hero" or "accent" or "background",
      "suggested_animation": optional animation hint
    }
  ],

  "composition": one of ["centered", "scattered", "layered", "radial", "linear", "grid", "asymmetric", "spiral"],

  "color_palette": ["#hex1", "#hex2", "#hex3", "#hex4", "#hex5"],
  // 4-6 hex colors that define the scene's palette. Derive from the prompt's mood and subject.

  "lighting_mood": one of ["golden_hour", "studio", "dramatic", "neon", "moonlight", "overcast", "sunrise", "candlelight", "fluorescent", "spotlight"],

  "animation_intent": one of ["subtle", "dynamic", "floating", "mechanical", "organic", "chaotic", "rhythmic", "still"],

  "background_color": "#hex",
  // A suitable dark background hex color for the scene.

  "fog": {
    "enabled": true/false,
    "color": "#hex",
    "near": number,
    "far": number
  },

  "environment_preset": one of ["studio", "sunset", "dawn", "night", "warehouse", "forest", "apartment", "city", "park", "lobby"] or null,

  "camera_suggestion": {
    "position": [x, y, z],
    "lookAt": [x, y, z],
    "fov": number
  },

  "special_instructions": "any specific requests that don't fit above categories"
}

RULES:
- Always extract at least 3 key_objects, even for simple prompts. Infer reasonable objects from context.
- Color palettes should be cohesive. Nature scenes use earthy greens/browns. Sci-fi uses neons and dark blues. Luxury uses golds and deep blacks.
- If the user mentions specific colors, include them in the palette.
- If the user says "minimal" or "simple", use fewer key_objects (3-5). If "complex" or "detailed", use more (8-15).
- The hero object is the main focus. Accents support it. Background objects fill the space.
- For product pedestals, the hero is the product itself on a platform.
- Fog is great for atmosphere -- enable it for cinematic, mysterious, dramatic moods.
- Camera should be positioned to best frame the described scene.
- animation_intent should match the scene's energy. Nature = organic, machines = mechanical, abstract = chaotic or rhythmic.
"""


class PromptParser:
    """Extracts structured scene intent from a user prompt via Claude."""

    def __init__(self) -> None:
        self._client = anthropic.Anthropic(api_key=settings.ANTHROPIC_API_KEY)

    async def extract_intent(self, request: GenerateRequest) -> dict:
        """Call Claude to parse the user prompt into structured scene intent."""

        user_message = f"""User prompt: "{request.prompt}"

Additional parameters:
- Desired style override: {request.style or "none, infer from prompt"}
- Realism level: {request.realism} (0 = abstract/stylized, 1 = photorealistic)
- Complexity level: {request.complexity} (0 = minimal/few objects, 1 = highly detailed/many objects)
- Animation amount: {request.animation_amount} (0 = mostly still, 1 = everything animated)
- Camera framing: {request.camera_framing or "auto, choose best framing"}

Extract the structured intent for this scene."""

        logger.info("Extracting intent for prompt: %s", request.prompt[:100])

        message = self._client.messages.create(
            model=settings.MODEL_NAME,
            max_tokens=2048,
            system=INTENT_SYSTEM_PROMPT,
            messages=[{"role": "user", "content": user_message}],
        )

        raw_text = message.content[0].text.strip()
        logger.debug("Raw intent response length: %d", len(raw_text))

        # Strip markdown fences if the model wraps them anyway
        if raw_text.startswith("```"):
            raw_text = raw_text.split("\n", 1)[1]
            if raw_text.endswith("```"):
                raw_text = raw_text[: raw_text.rfind("```")]

        intent: dict = json.loads(raw_text)

        # Merge in original request parameters so downstream has them
        intent["_request"] = {
            "realism": request.realism,
            "complexity": request.complexity,
            "animation_amount": request.animation_amount,
            "camera_framing": request.camera_framing,
            "style_override": request.style,
        }

        logger.info(
            "Extracted intent: category=%s style=%s mood=%s objects=%d",
            intent.get("scene_category"),
            intent.get("style"),
            intent.get("mood"),
            len(intent.get("key_objects", [])),
        )

        return intent

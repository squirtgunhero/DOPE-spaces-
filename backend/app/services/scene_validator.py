"""SceneValidator -- validates and repairs SceneDocument dicts."""

from __future__ import annotations

import logging
import math
import re
from copy import deepcopy
from typing import Any

logger = logging.getLogger(__name__)

_HEX_RE = re.compile(r"^#(?:[0-9a-fA-F]{3}){1,2}$")

_VALID_GEOMETRY_TYPES = {
    "sphere", "box", "cylinder", "cone", "torus", "torusKnot",
    "dodecahedron", "icosahedron", "octahedron", "plane", "ring",
    "lathe", "extrude", "terrain", "roundedBox",
}

_VALID_MATERIAL_TYPES = {"standard", "physical", "basic"}

_VALID_LIGHT_TYPES = {"ambient", "directional", "point", "spot", "hemisphere"}

_VALID_ANIMATION_TYPES = {
    "rotateX", "rotateY", "rotateZ", "float", "sway", "pulse",
    "orbit", "path", "keyframes", "emissivePulse", "partAnimations",
}

_VALID_ENVIRONMENTS = {
    "studio", "sunset", "dawn", "night", "warehouse",
    "forest", "apartment", "city", "park", "lobby",
}


def _is_valid_hex(value: Any) -> bool:
    return isinstance(value, str) and bool(_HEX_RE.match(value))


def _is_tuple3(value: Any) -> bool:
    """Check if value is a list/tuple of exactly 3 numbers."""
    if not isinstance(value, (list, tuple)):
        return False
    if len(value) != 3:
        return False
    return all(isinstance(v, (int, float)) for v in value)


def _is_valid_scale(value: Any) -> bool:
    """Scale can be a single number or a tuple of 3."""
    if isinstance(value, (int, float)):
        return True
    return _is_tuple3(value)


def _clamp(value: float, lo: float, hi: float) -> float:
    return max(lo, min(hi, value))


class SceneValidator:
    """Validates and repairs SceneDocument dicts."""

    def validate(self, scene: dict) -> tuple[bool, list[str]]:
        """Validate a scene dict. Returns (is_valid, list_of_issues)."""
        issues: list[str] = []

        if not isinstance(scene, dict):
            return False, ["Scene is not a dict"]

        # --- Lights ---
        lights = scene.get("lights", [])
        if not lights:
            issues.append("No lights defined")
        for i, light in enumerate(lights):
            self._validate_light(light, i, issues)

        # --- Camera ---
        camera = scene.get("camera")
        if not camera:
            issues.append("No camera defined")
        else:
            self._validate_camera(camera, issues)

        # --- Objects ---
        objects = scene.get("objects", [])
        if not objects:
            issues.append("No objects defined")
        for i, obj in enumerate(objects):
            self._validate_object(obj, i, issues)

        # --- Environment / Scene ---
        env = scene.get("environment") or scene.get("scene")
        if env and isinstance(env, dict):
            bg = env.get("background")
            if bg and not _is_valid_hex(bg):
                issues.append(f"Invalid background color: {bg}")

        is_valid = len(issues) == 0
        return is_valid, issues

    def repair(self, scene: dict) -> dict:
        """Auto-fix common issues in a scene dict. Returns a repaired copy."""
        scene = deepcopy(scene)

        # Ensure lights
        if not scene.get("lights"):
            scene["lights"] = [
                {"type": "ambient", "color": "#ffffff", "intensity": 0.4},
                {
                    "type": "directional",
                    "color": "#ffffff",
                    "intensity": 1.0,
                    "position": [5, 8, 5],
                    "castShadow": True,
                },
            ]
            logger.info("Repair: added default lights")

        # Ensure camera
        if not scene.get("camera"):
            scene["camera"] = {
                "position": [8, 6, 8],
                "lookAt": [0, 1, 0],
                "fov": 50,
            }
            logger.info("Repair: added default camera")
        else:
            cam = scene["camera"]
            if not _is_tuple3(cam.get("position")):
                cam["position"] = [8, 6, 8]
            if not _is_tuple3(cam.get("lookAt")):
                cam["lookAt"] = [0, 1, 0]
            cam["fov"] = _clamp(cam.get("fov", 50), 10, 120)

        # Ensure environment/scene block
        if not scene.get("scene") and not scene.get("environment"):
            scene["scene"] = {"background": "#0a0e1a"}

        # Repair lights
        for light in scene.get("lights", []):
            self._repair_light(light)

        # Repair objects
        for obj in scene.get("objects", []):
            self._repair_object(obj)

        # Ensure at least one shadow-casting light
        has_shadow_light = any(
            l.get("castShadow") for l in scene.get("lights", [])
            if l.get("type") in ("directional", "spot")
        )
        if not has_shadow_light:
            for light in scene.get("lights", []):
                if light.get("type") in ("directional", "spot"):
                    light["castShadow"] = True
                    logger.info("Repair: enabled castShadow on %s light", light["type"])
                    break

        # Ensure version
        scene.setdefault("version", "1.0")

        # Ensure metadata
        scene.setdefault("metadata", {})

        return scene

    # --- Private validation helpers ---

    def _validate_light(self, light: dict, index: int, issues: list[str]) -> None:
        prefix = f"lights[{index}]"
        lt = light.get("type")
        if lt not in _VALID_LIGHT_TYPES:
            issues.append(f"{prefix}: invalid light type '{lt}'")
        color = light.get("color")
        if color and not _is_valid_hex(color):
            issues.append(f"{prefix}: invalid color '{color}'")
        ground_color = light.get("groundColor")
        if ground_color and not _is_valid_hex(ground_color):
            issues.append(f"{prefix}: invalid groundColor '{ground_color}'")
        pos = light.get("position")
        if pos is not None and not _is_tuple3(pos):
            issues.append(f"{prefix}: position is not a valid [x,y,z]")
        intensity = light.get("intensity")
        if intensity is not None and (not isinstance(intensity, (int, float)) or intensity < 0):
            issues.append(f"{prefix}: invalid intensity {intensity}")

    def _validate_camera(self, camera: dict, issues: list[str]) -> None:
        pos = camera.get("position")
        if pos and not _is_tuple3(pos):
            issues.append("camera.position is not a valid [x,y,z]")
        look = camera.get("lookAt")
        if look and not _is_tuple3(look):
            issues.append("camera.lookAt is not a valid [x,y,z]")
        fov = camera.get("fov")
        if fov is not None and (not isinstance(fov, (int, float)) or fov < 1 or fov > 180):
            issues.append(f"camera.fov out of range: {fov}")

    def _validate_object(self, obj: dict, index: int, issues: list[str]) -> None:
        prefix = f"objects[{index}]"
        if not obj.get("name"):
            issues.append(f"{prefix}: missing name")

        # Simple object
        geom = obj.get("geometry")
        if geom:
            self._validate_geometry(geom, prefix, issues)

        mat = obj.get("material")
        if mat:
            self._validate_material(mat, prefix, issues)

        # Compound object
        parts = obj.get("parts")
        if parts:
            for pi, part in enumerate(parts):
                part_prefix = f"{prefix}.parts[{pi}]"
                pg = part.get("geometry")
                if pg:
                    self._validate_geometry(pg, part_prefix, issues)
                pm = part.get("material")
                if pm:
                    self._validate_material(pm, part_prefix, issues)

        # Position, rotation, scale
        pos = obj.get("position")
        if pos is not None and not _is_tuple3(pos):
            issues.append(f"{prefix}: position is not valid [x,y,z]")
        rot = obj.get("rotation")
        if rot is not None and not _is_tuple3(rot):
            issues.append(f"{prefix}: rotation is not valid [x,y,z]")
        scale = obj.get("scale")
        if scale is not None and not _is_valid_scale(scale):
            issues.append(f"{prefix}: scale is not valid")

        # Animation
        anim = obj.get("animation")
        if anim:
            self._validate_animation(anim, prefix, issues)

    def _validate_geometry(self, geom: dict, prefix: str, issues: list[str]) -> None:
        gt = geom.get("type")
        if gt not in _VALID_GEOMETRY_TYPES:
            issues.append(f"{prefix}.geometry: invalid type '{gt}'")

    def _validate_material(self, mat: dict, prefix: str, issues: list[str]) -> None:
        mt = mat.get("type", "standard")
        if mt not in _VALID_MATERIAL_TYPES:
            issues.append(f"{prefix}.material: invalid type '{mt}'")
        color = mat.get("color")
        if color and not _is_valid_hex(color):
            issues.append(f"{prefix}.material: invalid color '{color}'")
        emissive = mat.get("emissive")
        if emissive and not _is_valid_hex(emissive):
            issues.append(f"{prefix}.material: invalid emissive '{emissive}'")

    def _validate_animation(self, anim: dict, prefix: str, issues: list[str]) -> None:
        atype = anim.get("type")
        if atype and atype not in _VALID_ANIMATION_TYPES:
            issues.append(f"{prefix}.animation: invalid type '{atype}'")
        speed = anim.get("speed")
        if speed is not None and (not isinstance(speed, (int, float)) or abs(speed) > 50):
            issues.append(f"{prefix}.animation: unreasonable speed {speed}")

    # --- Private repair helpers ---

    def _repair_light(self, light: dict) -> None:
        color = light.get("color")
        if color and not _is_valid_hex(color):
            light["color"] = "#ffffff"

        ground_color = light.get("groundColor")
        if ground_color and not _is_valid_hex(ground_color):
            light["groundColor"] = "#444444"

        intensity = light.get("intensity")
        if intensity is not None:
            light["intensity"] = max(0, float(intensity))

    def _repair_object(self, obj: dict) -> None:
        if not obj.get("name"):
            obj["name"] = "unnamed-object"

        # Fix geometry
        geom = obj.get("geometry")
        if geom:
            self._repair_geometry(geom)

        mat = obj.get("material")
        if mat:
            self._repair_material(mat)

        # Fix parts
        parts = obj.get("parts")
        if parts:
            for part in parts:
                pg = part.get("geometry")
                if pg:
                    self._repair_geometry(pg)
                pm = part.get("material")
                if pm:
                    self._repair_material(pm)

        # Clamp animation speed
        anim = obj.get("animation")
        if anim and isinstance(anim, dict):
            speed = anim.get("speed")
            if speed is not None:
                anim["speed"] = _clamp(float(speed), -20, 20)

    def _repair_geometry(self, geom: dict) -> None:
        gt = geom.get("type")
        if gt not in _VALID_GEOMETRY_TYPES:
            geom["type"] = "box"
            logger.info("Repair: changed invalid geometry type '%s' to 'box'", gt)

    def _repair_material(self, mat: dict) -> None:
        mt = mat.get("type", "standard")
        if mt not in _VALID_MATERIAL_TYPES:
            mat["type"] = "standard"

        color = mat.get("color")
        if color and not _is_valid_hex(color):
            mat["color"] = "#888888"

        emissive = mat.get("emissive")
        if emissive and not _is_valid_hex(emissive):
            mat["emissive"] = "#000000"

        # Clamp numeric values
        for key in ("metalness", "roughness", "opacity", "clearcoat", "transmission"):
            val = mat.get(key)
            if val is not None:
                mat[key] = _clamp(float(val), 0.0, 1.0)

        ei = mat.get("emissiveIntensity")
        if ei is not None:
            mat["emissiveIntensity"] = _clamp(float(ei), 0.0, 20.0)

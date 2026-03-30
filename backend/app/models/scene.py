"""Canonical scene schema in Pydantic v2.

Every model uses camelCase aliases for JSON serialization so the output
matches what the TypeScript / Three.js frontend expects.
"""

from __future__ import annotations

from enum import Enum
from typing import Literal, Optional

from pydantic import BaseModel, Field


# ---------------------------------------------------------------------------
# Environment, Camera
# ---------------------------------------------------------------------------

class SceneEnvironment(BaseModel):
    background: str = "#0a0e1a"
    fog_color: Optional[str] = Field(None, alias="fogColor")
    fog_density: Optional[float] = Field(None, alias="fogDensity")
    fog_near: Optional[float] = Field(None, alias="fogNear")
    fog_far: Optional[float] = Field(None, alias="fogFar")
    ambient_intensity: float = Field(0.4, alias="ambientIntensity")
    environment_preset: Optional[str] = Field(None, alias="environmentPreset")

    model_config = {"populate_by_name": True}


class SceneCamera(BaseModel):
    position: tuple[float, float, float] = (8, 6, 8)
    look_at: tuple[float, float, float] = Field((0, 1, 0), alias="lookAt")
    fov: float = 50

    model_config = {"populate_by_name": True}


# ---------------------------------------------------------------------------
# Lights
# ---------------------------------------------------------------------------

class LightType(str, Enum):
    directional = "directional"
    point = "point"
    spot = "spot"
    hemisphere = "hemisphere"
    ambient = "ambient"


class SceneLight(BaseModel):
    type: LightType
    color: str = "#ffffff"
    intensity: float = 1.0
    position: Optional[tuple[float, float, float]] = None
    cast_shadow: bool = Field(False, alias="castShadow")
    ground_color: Optional[str] = Field(None, alias="groundColor")
    target: Optional[tuple[float, float, float]] = None
    distance: Optional[float] = None
    angle: Optional[float] = None
    penumbra: Optional[float] = None
    decay: Optional[float] = None

    model_config = {"populate_by_name": True}


# ---------------------------------------------------------------------------
# Materials
# ---------------------------------------------------------------------------

class SceneMaterial(BaseModel):
    type: Literal["standard", "physical", "basic"] = "standard"
    color: str = "#888888"
    roughness: float = 0.5
    metalness: float = 0.0
    emissive: Optional[str] = None
    emissive_intensity: Optional[float] = Field(None, alias="emissiveIntensity")
    opacity: Optional[float] = None
    transparent: Optional[bool] = None
    wireframe: bool = False
    flat_shading: Optional[bool] = Field(None, alias="flatShading")
    side: Optional[Literal["front", "back", "double"]] = None
    clearcoat: Optional[float] = None
    clearcoat_roughness: Optional[float] = Field(None, alias="clearcoatRoughness")
    transmission: Optional[float] = None
    ior: Optional[float] = None
    thickness: Optional[float] = None
    double_side: bool = Field(False, alias="doubleSide")

    model_config = {"populate_by_name": True}


# ---------------------------------------------------------------------------
# Geometry
# ---------------------------------------------------------------------------

class GeometryType(str, Enum):
    sphere = "sphere"
    box = "box"
    cylinder = "cylinder"
    cone = "cone"
    torus = "torus"
    torus_knot = "torusKnot"
    dodecahedron = "dodecahedron"
    icosahedron = "icosahedron"
    octahedron = "octahedron"
    plane = "plane"
    ring = "ring"
    lathe = "lathe"
    extrude = "extrude"
    terrain = "terrain"
    rounded_box = "roundedBox"


class SceneGeometry(BaseModel):
    type: GeometryType
    params: Optional[dict] = None

    model_config = {"populate_by_name": True}


# ---------------------------------------------------------------------------
# Animation sub-types
# ---------------------------------------------------------------------------

class FloatAnimation(BaseModel):
    amplitude: float
    speed: float
    phase: float = 0
    base_y: Optional[float] = Field(None, alias="baseY")

    model_config = {"populate_by_name": True}


class SwayAnimation(BaseModel):
    axis: Literal["x", "y", "z"]
    amplitude: float
    speed: float
    phase: float = 0
    base_angle: Optional[float] = Field(None, alias="baseAngle")

    model_config = {"populate_by_name": True}


class PulseAnimation(BaseModel):
    base_scale: float = Field(1.0, alias="baseScale")
    amplitude: float
    speed: float
    phase: float = 0

    model_config = {"populate_by_name": True}


class OrbitAnimation(BaseModel):
    center: tuple[float, float, float] = (0, 0, 0)
    radius: float
    speed: float
    phase: float = 0
    tilt: float = 0
    face_center: Optional[bool] = Field(None, alias="faceCenter")

    model_config = {"populate_by_name": True}


class PathPoint(BaseModel):
    position: tuple[float, float, float]


class PathAnimation(BaseModel):
    points: list[tuple[float, float, float]]
    speed: float
    loop: bool = True
    face_direction: Optional[bool] = Field(None, alias="faceDirection")

    model_config = {"populate_by_name": True}


class KeyframeStep(BaseModel):
    position: Optional[tuple[float, float, float]] = None
    rotation: Optional[tuple[float, float, float]] = None
    scale: Optional[tuple[float, float, float] | float] = None
    dur: float
    ease: str = "inOutCubic"


class KeyframeAnimation(BaseModel):
    loop: bool = True
    frames: list[KeyframeStep]
    duration: Optional[float] = None


class EmissivePulseAnimation(BaseModel):
    min_intensity: float = Field(alias="min")
    max_intensity: float = Field(alias="max")
    speed: float
    phase: float = 0

    model_config = {"populate_by_name": True}


class SceneAnimation(BaseModel):
    type: Optional[str] = None
    rotate_x: Optional[float] = Field(None, alias="rotateX")
    rotate_y: Optional[float] = Field(None, alias="rotateY")
    rotate_z: Optional[float] = Field(None, alias="rotateZ")
    speed: Optional[float] = None

    # float
    float_anim: Optional[FloatAnimation] = Field(None, alias="float")
    amplitude: Optional[float] = None
    phase: Optional[float] = None
    base_y: Optional[float] = Field(None, alias="baseY")

    # sway
    sway: Optional[SwayAnimation] = None
    axis: Optional[Literal["x", "y", "z"]] = None
    base_angle: Optional[float] = Field(None, alias="baseAngle")

    # pulse
    pulse: Optional[PulseAnimation] = None
    base_scale: Optional[float] = Field(None, alias="baseScale")

    # orbit
    orbit: Optional[OrbitAnimation] = None
    center: Optional[tuple[float, float, float]] = None
    radius: Optional[float] = None
    face_center: Optional[bool] = Field(None, alias="faceCenter")
    tilt: Optional[float] = None

    # path
    path: Optional[PathAnimation] = None
    points: Optional[list[tuple[float, float, float]]] = None
    loop: Optional[bool] = None
    face_direction: Optional[bool] = Field(None, alias="faceDirection")

    # keyframes
    keyframes: Optional[KeyframeAnimation] = None
    duration: Optional[float] = None
    frames: Optional[list[KeyframeStep]] = None

    # emissivePulse
    emissive_pulse: Optional[EmissivePulseAnimation] = Field(None, alias="emissivePulse")
    min_val: Optional[float] = Field(None, alias="min")
    max_val: Optional[float] = Field(None, alias="max")

    # partAnimations
    part_animations: Optional[list[dict]] = Field(None, alias="partAnims")

    model_config = {"populate_by_name": True}


# ---------------------------------------------------------------------------
# Object parts (compound objects)
# ---------------------------------------------------------------------------

class ObjectPart(BaseModel):
    name: Optional[str] = None
    geometry: SceneGeometry
    material: Optional[SceneMaterial] = None
    position: Optional[tuple[float, float, float]] = None
    rotation: Optional[tuple[float, float, float]] = None
    scale: Optional[tuple[float, float, float] | float] = None
    cast_shadow: Optional[bool] = Field(None, alias="castShadow")
    receive_shadow: Optional[bool] = Field(None, alias="receiveShadow")

    model_config = {"populate_by_name": True}


# ---------------------------------------------------------------------------
# States (hover / active)
# ---------------------------------------------------------------------------

class InteractionState(BaseModel):
    scale: Optional[tuple[float, float, float]] = None
    emissive_intensity: Optional[float] = Field(None, alias="emissiveIntensity")
    color: Optional[str] = None
    duration: Optional[float] = None

    model_config = {"populate_by_name": True}


class StateSpec(BaseModel):
    hover: Optional[InteractionState] = None
    active: Optional[InteractionState] = None


# ---------------------------------------------------------------------------
# Scene Object
# ---------------------------------------------------------------------------

class SceneObject(BaseModel):
    name: str
    geometry: Optional[SceneGeometry] = None
    material: Optional[SceneMaterial] = None
    parts: Optional[list[ObjectPart]] = None
    position: Optional[tuple[float, float, float]] = None
    rotation: Optional[tuple[float, float, float]] = None
    scale: Optional[tuple[float, float, float] | float] = None
    cast_shadow: Optional[bool] = Field(None, alias="castShadow")
    receive_shadow: Optional[bool] = Field(None, alias="receiveShadow")
    animation: Optional[SceneAnimation] = None
    states: Optional[StateSpec] = None
    semantic_role: Optional[str] = Field(None, alias="semanticRole")
    semantic_tags: Optional[list[str]] = Field(None, alias="semanticTags")

    model_config = {"populate_by_name": True}


# ---------------------------------------------------------------------------
# Revision history
# ---------------------------------------------------------------------------

class SceneRevision(BaseModel):
    id: str
    timestamp: str
    prompt: Optional[str] = None
    revision_text: Optional[str] = Field(None, alias="revisionText")
    changes_summary: str = Field(alias="changesSummary")
    scene_snapshot: Optional[dict] = Field(None, alias="sceneSnapshot")

    model_config = {"populate_by_name": True}


# ---------------------------------------------------------------------------
# Metadata
# ---------------------------------------------------------------------------

class SceneMetadata(BaseModel):
    title: Optional[str] = None
    category: Optional[str] = None
    style: Optional[str] = None
    mood: Optional[str] = None
    complexity: float = 0.5
    realism: float = 0.5


# ---------------------------------------------------------------------------
# Top-level SceneDocument
# ---------------------------------------------------------------------------

class SceneDocument(BaseModel):
    """The canonical scene document. Single source of truth."""
    version: str = "1.0"
    metadata: SceneMetadata = Field(default_factory=SceneMetadata)
    scene: Optional[dict] = None
    environment: SceneEnvironment = Field(default_factory=SceneEnvironment)
    camera: SceneCamera = Field(default_factory=SceneCamera)
    lights: list[SceneLight] = []
    objects: list[SceneObject] = []
    ground: Optional[dict] = None
    revisions: list[SceneRevision] = []

    model_config = {"populate_by_name": True}


# ---------------------------------------------------------------------------
# Request / Response models
# ---------------------------------------------------------------------------

class GenerateRequest(BaseModel):
    prompt: str
    style: Optional[str] = None
    realism: float = 0.5
    complexity: float = 0.5
    animation_amount: float = Field(0.5, alias="animationAmount")
    camera_framing: Optional[str] = Field(None, alias="cameraFraming")

    model_config = {"populate_by_name": True}


class ReviseRequest(BaseModel):
    scene: dict
    instruction: str


class ValidateRequest(BaseModel):
    scene: dict


class ExportRequest(BaseModel):
    scene: dict
    format: Literal["json", "gltf_config", "embed_config"] = "json"

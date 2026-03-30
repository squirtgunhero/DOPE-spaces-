"""API routes for scene generation, revision, validation, and export."""

from __future__ import annotations

import logging
import uuid
from datetime import datetime, timezone

from fastapi import APIRouter, HTTPException

from ...models.scene import (
    ExportRequest,
    GenerateRequest,
    ReviseRequest,
    ValidateRequest,
)
from ...services.exporter import SceneExporter
from ...services.prompt_parser import PromptParser
from ...services.revision_engine import RevisionEngine
from ...services.scene_planner import ScenePlanner
from ...services.scene_validator import SceneValidator

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api", tags=["scene"])

# Service singletons
_parser = PromptParser()
_planner = ScenePlanner()
_revision = RevisionEngine()
_validator = SceneValidator()
_exporter = SceneExporter()


@router.post("/generate")
async def generate_scene(request: GenerateRequest) -> dict:
    """Generate a complete 3D scene from a natural language prompt.

    Pipeline: prompt -> intent extraction -> scene planning -> validation/repair
    """
    try:
        logger.info("Generate request: '%s'", request.prompt[:120])

        # Step 1: Extract structured intent from the prompt
        intent = await _parser.extract_intent(request)

        # Step 2: Plan the full scene
        scene = await _planner.plan_scene(intent, request)

        # Step 3: Validate and repair
        is_valid, issues = _validator.validate(scene)
        if not is_valid:
            logger.warning("Scene had %d issues, repairing: %s", len(issues), issues[:5])
            scene = _validator.repair(scene)

        # Step 4: Add initial revision record
        scene.setdefault("revisions", [])
        scene["revisions"].append({
            "id": str(uuid.uuid4()),
            "timestamp": datetime.now(timezone.utc).isoformat(),
            "prompt": request.prompt,
            "changesSummary": f"Initial scene generation from prompt: {request.prompt[:80]}",
        })

        return {"success": True, "scene": scene, "intent": intent}

    except Exception as exc:
        logger.exception("Scene generation failed")
        raise HTTPException(status_code=500, detail=f"Scene generation failed: {exc}") from exc


@router.post("/revise")
async def revise_scene(request: ReviseRequest) -> dict:
    """Apply a natural language revision to an existing scene."""
    try:
        logger.info("Revise request: '%s'", request.instruction[:120])

        result = await _revision.apply_revision(request.scene, request.instruction)
        revised_scene = result["scene"]
        changes_summary = result["changes_summary"]

        # Validate the revised scene
        is_valid, issues = _validator.validate(revised_scene)
        if not is_valid:
            logger.warning("Revised scene had %d issues, repairing", len(issues))
            revised_scene = _validator.repair(revised_scene)

        # Add revision record
        revised_scene.setdefault("revisions", [])
        revised_scene["revisions"].append({
            "id": str(uuid.uuid4()),
            "timestamp": datetime.now(timezone.utc).isoformat(),
            "revisionText": request.instruction,
            "changesSummary": changes_summary,
        })

        return {
            "success": True,
            "scene": revised_scene,
            "changes_summary": changes_summary,
        }

    except Exception as exc:
        logger.exception("Scene revision failed")
        raise HTTPException(status_code=500, detail=f"Scene revision failed: {exc}") from exc


@router.post("/validate")
async def validate_scene(request: ValidateRequest) -> dict:
    """Validate a scene document and optionally repair it."""
    try:
        is_valid, issues = _validator.validate(request.scene)

        response: dict = {
            "valid": is_valid,
            "issues": issues,
        }

        if not is_valid:
            repaired = _validator.repair(request.scene)
            response["repaired_scene"] = repaired

            # Re-validate repaired scene
            is_valid_after, remaining_issues = _validator.validate(repaired)
            response["repaired_valid"] = is_valid_after
            response["remaining_issues"] = remaining_issues

        return response

    except Exception as exc:
        logger.exception("Validation failed")
        raise HTTPException(status_code=500, detail=f"Validation failed: {exc}") from exc


@router.post("/export")
async def export_scene(request: ExportRequest) -> dict:
    """Export a scene in the requested format."""
    try:
        fmt = request.format
        logger.info("Export request: format=%s", fmt)

        if fmt == "json":
            return {"success": True, "data": _exporter.export_json(request.scene)}
        elif fmt == "gltf_config":
            return {"success": True, "data": _exporter.export_gltf_config(request.scene)}
        elif fmt == "embed_config":
            return {"success": True, "data": _exporter.export_embed_config(request.scene)}
        else:
            raise HTTPException(status_code=400, detail=f"Unknown format: {fmt}")

    except HTTPException:
        raise
    except Exception as exc:
        logger.exception("Export failed")
        raise HTTPException(status_code=500, detail=f"Export failed: {exc}") from exc

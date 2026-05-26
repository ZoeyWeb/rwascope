"""
Due diligence workbook endpoints.

All scoring is user-generated. The /analyze endpoint produces a research
checklist (questions, sources, red flags) via DeepSeek — no numeric scores.
Workbooks are private to the authenticated user and are never published.
"""
from __future__ import annotations

import json
import uuid
import logging

from fastapi import APIRouter, HTTPException, status
from fastapi.responses import JSONResponse
from sqlalchemy import select
from sqlalchemy.orm import selectinload

from app.core.deps import CurrentUser, DbSession
from app.core.deepseek import generate_checklist, compute_user_rarm_score, LAYER_DEFS, WEIGHT_BY_ASSET_CLASS
from app.models.assessment import DetailedAssessment, SubScore, AIChecklist
from app.schemas.assessment import (
    CreateAssessmentRequest,
    FinalizeRequest,
    AssessmentOut,
    AssessmentListItem,
    SubScoreOut,
    AIChecklistOut,
    ChecklistLayer,
    LayerDef,
    IndicatorDef,
)

logger = logging.getLogger(__name__)
router = APIRouter(
    prefix="/assessments",
    tags=["due-diligence"],
)


# ── Helper ────────────────────────────────────────────────────────────────────

def _assessment_to_out(a: DetailedAssessment) -> AssessmentOut:
    sub_scores = [
        SubScoreOut(
            indicator_key=s.indicator_key,
            indicator_label=s.indicator_label,
            layer_number=s.layer_number,
            user_score=s.user_score,
            final_score=s.final_score,
            rationale=s.rationale,
        )
        for s in a.sub_scores
    ]
    ai_checklist = None
    if a.ai_checklist:
        c = a.ai_checklist
        layers = [ChecklistLayer(**item) if isinstance(item, dict) else item
                  for item in c.checklist]
        ai_checklist = AIChecklistOut(
            id=str(c.id),
            assessment_id=str(c.assessment_id),
            checklist=layers,
            overall_notes=c.overall_notes,
            suggested_public_sources=c.suggested_public_sources,
            model_used=c.model_used,
            created_at=c.created_at.isoformat(),
        )
    return AssessmentOut(
        id=str(a.id),
        protocol_name=a.protocol_name,
        asset_class=a.asset_class,
        description=a.description,
        chains=a.chains,
        status=a.status,
        rarm_score=a.rarm_score,
        rarm_total=a.rarm_total,
        created_at=a.created_at.isoformat(),
        updated_at=a.updated_at.isoformat(),
        sub_scores=sub_scores,
        ai_checklist=ai_checklist,
    )


async def _load_assessment(
    assessment_id: str, user_id: uuid.UUID, db: DbSession
) -> DetailedAssessment:
    try:
        aid = uuid.UUID(assessment_id)
    except ValueError:
        raise HTTPException(status_code=422, detail="Invalid assessment id")

    result = await db.execute(
        select(DetailedAssessment)
        .options(
            selectinload(DetailedAssessment.sub_scores),
            selectinload(DetailedAssessment.ai_checklist),
        )
        .where(DetailedAssessment.id == aid, DetailedAssessment.user_id == user_id)
    )
    a = result.scalar_one_or_none()
    if not a:
        raise HTTPException(status_code=404, detail="Assessment not found")
    return a


# ── Layer definitions (for frontend form) ────────────────────────────────────

@router.get("/layers", response_model=list[LayerDef])
async def list_layers():
    """Return layer + indicator definitions for the frontend form."""
    layers = []
    for layer_num, info in LAYER_DEFS.items():
        indicators = [
            IndicatorDef(
                key=k,
                label=k.split("_", 1)[-1].replace("_", " ").title(),
                description=desc,
            )
            for k, desc in info["indicators"].items()
        ]
        weight_by_class = {
            cls: weights[layer_num - 1]
            for cls, weights in WEIGHT_BY_ASSET_CLASS.items()
        }
        layers.append(LayerDef(
            id=layer_num,
            name=info["name"],
            description=info["name"],
            weight_by_class=weight_by_class,
            indicators=indicators,
        ))
    return layers


# ── CRUD ──────────────────────────────────────────────────────────────────────

@router.get("", response_model=list[AssessmentListItem])
async def list_assessments(current_user: CurrentUser, db: DbSession):
    result = await db.execute(
        select(DetailedAssessment)
        .where(DetailedAssessment.user_id == current_user.id)
        .order_by(DetailedAssessment.created_at.desc())
    )
    assessments = result.scalars().all()
    return [
        AssessmentListItem(
            id=str(a.id),
            protocol_name=a.protocol_name,
            asset_class=a.asset_class,
            status=a.status,
            rarm_score=a.rarm_score,
            created_at=a.created_at.isoformat(),
        )
        for a in assessments
    ]


@router.post("", response_model=AssessmentOut, status_code=status.HTTP_201_CREATED)
async def create_assessment(
    body: CreateAssessmentRequest,
    current_user: CurrentUser,
    db: DbSession,
):
    # Compute user's own RARM score from their submitted sub-indicator scores
    scores_by_layer: dict[int, dict[str, int]] = {}
    for layer_input in body.layers:
        scores_by_layer[layer_input.layer_number] = {
            s.indicator_key: s.user_score for s in layer_input.scores
        }

    rarm_score, rarm_total = compute_user_rarm_score(scores_by_layer, body.asset_class)

    assessment = DetailedAssessment(
        user_id=current_user.id,
        protocol_name=body.protocol_name,
        asset_class=body.asset_class,
        description=body.description,
        chains=body.chains,
        status="draft",
        rarm_score=rarm_score,
        rarm_total=rarm_total,
    )
    db.add(assessment)
    await db.flush()

    for layer_input in body.layers:
        layer_num = layer_input.layer_number
        layer_info = LAYER_DEFS.get(layer_num, {})
        indicators_desc = layer_info.get("indicators", {}) if layer_info else {}
        for sub in layer_input.scores:
            label = indicators_desc.get(sub.indicator_key, sub.indicator_key)
            db.add(SubScore(
                assessment_id=assessment.id,
                layer_number=layer_num,
                indicator_key=sub.indicator_key,
                indicator_label=label,
                user_score=sub.user_score,
                rationale=sub.rationale,
            ))

    await db.commit()
    return await _load_assessment(str(assessment.id), current_user.id, db)


@router.get("/{assessment_id}", response_model=AssessmentOut)
async def get_assessment(
    assessment_id: str,
    current_user: CurrentUser,
    db: DbSession,
):
    a = await _load_assessment(assessment_id, current_user.id, db)
    return _assessment_to_out(a)


@router.delete("/{assessment_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_assessment(
    assessment_id: str,
    current_user: CurrentUser,
    db: DbSession,
):
    a = await _load_assessment(assessment_id, current_user.id, db)
    await db.delete(a)
    await db.commit()


# ── AI Checklist Generation ───────────────────────────────────────────────────

@router.post("/{assessment_id}/analyze", response_model=AssessmentOut)
async def generate_due_diligence_checklist(
    assessment_id: str,
    current_user: CurrentUser,
    db: DbSession,
):
    """
    Generate an AI due diligence checklist for the user's assessment.
    The AI produces questions and public-source pointers only — no scores.
    """
    a = await _load_assessment(assessment_id, current_user.id, db)
    if a.status == "finalized":
        raise HTTPException(status_code=400, detail="Assessment already finalized")

    scores_by_layer: dict[int, dict[str, int]] = {}
    rationale_by_indicator: dict[str, str] = {}
    for s in a.sub_scores:
        scores_by_layer.setdefault(s.layer_number, {})[s.indicator_key] = s.user_score
        if s.rationale:
            rationale_by_indicator[s.indicator_key] = s.rationale

    try:
        result = await generate_checklist(
            protocol_name=a.protocol_name,
            asset_class=a.asset_class,
            description=a.description,
            chains=a.chains,
            scores_by_layer=scores_by_layer,
            rationale_by_indicator=rationale_by_indicator,
        )
    except Exception as exc:
        logger.error("DeepSeek API error: %s", exc)
        raise HTTPException(status_code=502, detail=f"Checklist generation failed: {exc}")

    # Delete existing checklist if regenerating
    if a.ai_checklist:
        await db.delete(a.ai_checklist)
        await db.flush()

    checklist_obj = AIChecklist(
        assessment_id=a.id,
        checklist=result["checklist"],
        overall_notes=result["overall_notes"],
        suggested_public_sources=result["suggested_public_sources"],
        model_used=result["model_used"],
        prompt_tokens=result["prompt_tokens"],
        completion_tokens=result["completion_tokens"],
    )
    db.add(checklist_obj)
    a.status = "checklist_generated"
    await db.commit()
    return await _load_assessment(assessment_id, current_user.id, db)


@router.get("/{assessment_id}/json")
async def export_assessment_json(
    assessment_id: str,
    current_user: CurrentUser,
    db: DbSession,
):
    """
    Export the user's own assessment as a structured JSON file download.
    Only the assessment owner can download it (403 otherwise).
    The export includes meta, layer scores, sub-indicator scores, and
    the AI checklist — but never exposes data to other users or admins.
    """
    a = await _load_assessment(assessment_id, current_user.id, db)

    # Build layer averages from final (or user) scores
    layer_scores: dict[int, list[int]] = {}
    for s in a.sub_scores:
        score = s.final_score if s.final_score is not None else s.user_score
        layer_scores.setdefault(s.layer_number, []).append(score)

    layer_avgs = {
        layer_num: round(sum(scores) / len(scores), 2)
        for layer_num, scores in sorted(layer_scores.items())
    }

    sub_scores_export = [
        {
            "layer": s.layer_number,
            "indicator_key": s.indicator_key,
            "indicator_label": s.indicator_label,
            "user_score": s.user_score,
            "final_score": s.final_score,
            "rationale": s.rationale,
        }
        for s in sorted(a.sub_scores, key=lambda x: (x.layer_number, x.indicator_key))
    ]

    ai_checklist_export = None
    if a.ai_checklist:
        c = a.ai_checklist
        ai_checklist_export = {
            "overall_notes": c.overall_notes,
            "suggested_public_sources": c.suggested_public_sources,
            "model_used": c.model_used,
            "checklist": c.checklist,
        }

    payload = {
        "meta": {
            "format": "RWA-Index Due Diligence Export v1.0",
            "protocol_name": a.protocol_name,
            "asset_class": a.asset_class,
            "description": a.description,
            "chains": a.chains,
            "status": a.status,
            "preparer": current_user.full_name or current_user.email,
            "created_at": a.created_at.isoformat(),
            "exported_at": a.updated_at.isoformat(),
            "disclaimer": (
                "This document is a private due diligence workbook prepared by the user named above "
                "using the RARM academic framework provided by RWA-Index. It does not constitute "
                "a credit rating, investment advice, or any regulated financial service. "
                "The RARM Score is the user's own calculation — not a platform rating."
            ),
        },
        "rarm_score": a.rarm_score,
        "layer_averages": layer_avgs,
        "sub_scores": sub_scores_export,
        "ai_checklist": ai_checklist_export,
    }

    filename = f"rwa-dd-{a.protocol_name.lower().replace(' ', '-')}-{assessment_id[:8]}.json"
    content = json.dumps(payload, ensure_ascii=False, indent=2)
    return JSONResponse(
        content=payload,
        headers={
            "Content-Disposition": f'attachment; filename="{filename}"',
        },
    )


@router.post("/{assessment_id}/finalize", response_model=AssessmentOut)
async def finalize_assessment(
    assessment_id: str,
    body: FinalizeRequest,
    current_user: CurrentUser,
    db: DbSession,
):
    """
    User confirms their final scores and rationale after reviewing the checklist.
    Recomputes the user's own RARM framework score from final scores.
    """
    a = await _load_assessment(assessment_id, current_user.id, db)
    if a.status not in ("checklist_generated", "finalized", "draft"):
        raise HTTPException(status_code=400, detail="Assessment cannot be finalized")

    for sub in a.sub_scores:
        if sub.indicator_key in body.final_scores:
            sub.final_score = body.final_scores[sub.indicator_key]
        else:
            sub.final_score = sub.user_score  # keep user's own original score

        if sub.indicator_key in body.final_rationale:
            sub.rationale = body.final_rationale[sub.indicator_key]

    # Recompute user's RARM score from final scores
    final_by_layer: dict[int, dict[str, int]] = {}
    for sub in a.sub_scores:
        final_score = sub.final_score if sub.final_score is not None else sub.user_score
        final_by_layer.setdefault(sub.layer_number, {})[sub.indicator_key] = final_score

    rarm_score, rarm_total = compute_user_rarm_score(final_by_layer, a.asset_class)
    a.rarm_score = rarm_score
    a.rarm_total = rarm_total
    a.status = "finalized"

    await db.commit()
    return await _load_assessment(assessment_id, current_user.id, db)

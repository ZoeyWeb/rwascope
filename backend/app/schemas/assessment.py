from pydantic import BaseModel, Field

# ── Sub-indicator definition (static, not stored) ─────────────────────────────
class IndicatorDef(BaseModel):
    key: str
    label: str
    description: str

class LayerDef(BaseModel):
    id: int
    name: str
    description: str
    weight_by_class: dict[str, float]
    indicators: list[IndicatorDef]

# ── Request schemas ───────────────────────────────────────────────────────────
class SubScoreInput(BaseModel):
    indicator_key: str = Field(..., max_length=100)
    user_score: int = Field(..., ge=0, le=5)
    rationale: str | None = Field(None, max_length=5000)

class LayerInput(BaseModel):
    layer_number: int = Field(..., ge=1, le=6)
    scores: list[SubScoreInput]

class CreateAssessmentRequest(BaseModel):
    protocol_name: str = Field(..., min_length=1, max_length=255)
    asset_class: str = Field(..., max_length=100)
    description: str | None = Field(None, max_length=5000)
    chains: str | None = Field(None, max_length=500)
    layers: list[LayerInput]

class FinalizeRequest(BaseModel):
    """User confirms their own final scores after reviewing the AI checklist."""
    final_scores: dict[str, int] = Field(default_factory=dict)
    final_rationale: dict[str, str] = Field(default_factory=dict)

# ── AI checklist schemas (replaces numeric suggested scores) ──────────────────
class ChecklistLayer(BaseModel):
    layer_number: int
    layer_name: str
    questions_to_verify: list[str]
    public_data_sources: list[str]
    red_flags_to_consider: list[str]

class AIChecklistOut(BaseModel):
    id: str
    assessment_id: str
    checklist: list[ChecklistLayer]
    overall_notes: str
    suggested_public_sources: list[str]
    model_used: str
    created_at: str

    class Config:
        from_attributes = True

# ── Response schemas ──────────────────────────────────────────────────────────
class SubScoreOut(BaseModel):
    indicator_key: str
    indicator_label: str
    layer_number: int
    user_score: int
    final_score: int | None
    rationale: str | None  # user's own evidence note

    class Config:
        from_attributes = True

class ImprovementItem(BaseModel):
    action: str
    priority: int
    impact: str
    effort: str
    layer: int

class AssessmentOut(BaseModel):
    id: str
    protocol_name: str
    asset_class: str
    description: str | None
    chains: str | None
    status: str
    rarm_score: float | None   # user's own RARM framework score (private, not a platform rating)
    rarm_total: float | None
    created_at: str
    updated_at: str
    sub_scores: list[SubScoreOut] = []
    ai_checklist: AIChecklistOut | None = None

    class Config:
        from_attributes = True

class AssessmentListItem(BaseModel):
    id: str
    protocol_name: str
    asset_class: str
    status: str
    rarm_score: float | None
    created_at: str

    class Config:
        from_attributes = True

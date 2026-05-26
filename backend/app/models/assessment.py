import uuid
from datetime import datetime
from sqlalchemy import String, DateTime, Float, Integer, Text, ForeignKey, func
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.dialects.postgresql import UUID, JSONB
from app.database import Base

class DetailedAssessment(Base):
    __tablename__ = "detailed_assessments"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    protocol_name: Mapped[str] = mapped_column(String(255), nullable=False, index=True)
    asset_class: Mapped[str] = mapped_column(String(100), nullable=False)
    description: Mapped[str | None] = mapped_column(Text, nullable=True)
    chains: Mapped[str | None] = mapped_column(String(500), nullable=True)
    status: Mapped[str] = mapped_column(String(50), default="draft", index=True)
    rarm_score: Mapped[float | None] = mapped_column(Float, nullable=True)
    rarm_total: Mapped[float | None] = mapped_column(Float, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), index=True)
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    user: Mapped["User"] = relationship("User", back_populates="assessments")
    sub_scores: Mapped[list["SubScore"]] = relationship(
        "SubScore", back_populates="assessment", cascade="all, delete-orphan", order_by="SubScore.layer_number"
    )
    ai_checklist: Mapped["AIChecklist | None"] = relationship(
        "AIChecklist", back_populates="assessment", cascade="all, delete-orphan", uselist=False
    )

class SubScore(Base):
    __tablename__ = "assessment_sub_scores"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    assessment_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("detailed_assessments.id", ondelete="CASCADE"), nullable=False, index=True)
    layer_number: Mapped[int] = mapped_column(Integer, nullable=False)
    indicator_key: Mapped[str] = mapped_column(String(100), nullable=False)
    indicator_label: Mapped[str] = mapped_column(String(255), nullable=False)
    user_score: Mapped[int] = mapped_column(Integer, nullable=False)
    final_score: Mapped[int | None] = mapped_column(Integer, nullable=True)
    rationale: Mapped[str | None] = mapped_column(Text, nullable=True)

    assessment: Mapped["DetailedAssessment"] = relationship("DetailedAssessment", back_populates="sub_scores")

class AIChecklist(Base):
    __tablename__ = "ai_checklists"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    assessment_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("detailed_assessments.id", ondelete="CASCADE"), nullable=False, unique=True)
    checklist: Mapped[list] = mapped_column(JSONB, nullable=False, default=list)
    overall_notes: Mapped[str] = mapped_column(Text, nullable=False, default="")
    suggested_public_sources: Mapped[list] = mapped_column(JSONB, nullable=False, default=list)
    model_used: Mapped[str] = mapped_column(String(100), nullable=False)
    prompt_tokens: Mapped[int] = mapped_column(Integer, default=0)
    completion_tokens: Mapped[int] = mapped_column(Integer, default=0)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())

    assessment: Mapped["DetailedAssessment"] = relationship("DetailedAssessment", back_populates="ai_checklist")

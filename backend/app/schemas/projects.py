from datetime import date
from typing import Optional
from pydantic import BaseModel, ConfigDict


class EntityEntry(BaseModel):
    model_config = ConfigDict(extra="allow")
    name: str
    type: str
    url: Optional[str] = None


class EntityMap(BaseModel):
    model_config = ConfigDict(extra="allow")
    token_standard: Optional[str] = None
    issuer: Optional[EntityEntry] = None
    custodian: Optional[EntityEntry] = None
    chain_infra: Optional[EntityEntry] = None
    oracle: Optional[EntityEntry] = None
    law_firm: Optional[EntityEntry] = None
    auditor: Optional[EntityEntry] = None
    regulator: Optional[EntityEntry] = None


class ProjectWrite(BaseModel):
    slug: str
    name: str
    short_name: str
    website: str
    asset_class: str
    jurisdiction: str
    chain: str
    status: str
    launched_at: Optional[str] = None
    tvl_usd: Optional[float] = None
    entity_map: EntityMap
    asset_slug: Optional[str] = None
    summary: str
    sources: list[str]
    updated_at: Optional[str] = None

    def to_dict(self) -> dict:
        d = self.model_dump(exclude_none=False)
        if not d.get("updated_at"):
            d["updated_at"] = date.today().isoformat()
        return d

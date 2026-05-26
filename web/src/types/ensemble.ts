export type EnsemblePhase = "pre-launch" | "sandbox" | "pilot";
export type MilestoneType = "announcement" | "use-case" | "institution-joined" | "cross-border" | "sfc-coordination";
export type UseCaseStatus = "announced" | "in-progress" | "completed" | "not-publicly-detailed";
export type InstitutionType = "regulator" | "bank" | "asset-manager" | "technology" | "custodian" | "academia";

export type EnsembleSource = {
  title: string;
  url: string;
  date: string;
};

export type EnsembleTheme = {
  code: string;
  title: string;
  description: string;
};

export type EnsembleMilestone = {
  date: string;
  phase: EnsemblePhase;
  type: MilestoneType;
  title: string;
  description: string;
  sources: EnsembleSource[];
  linked_themes: string[];
  linked_institutions: string[];
};

export type EnsembleUseCase = {
  slug: string;
  title: string;
  theme: string;
  phase: EnsemblePhase;
  status: UseCaseStatus;
  description: string;
  participating_institutions_disclosed: string;
  linked_institutions: string[];
  sources: EnsembleSource[];
};

export type EnsembleInstitution = {
  slug: string;
  name: string;
  shortName: string;
  type: InstitutionType;
  jurisdiction: string;
  phases: EnsemblePhase[];
  role: string;
  themes: string[];
  publicReferences: EnsembleSource[];
};

export type EnsembleData = {
  tracker_version: string;
  last_compiled: string;
  current_phase: EnsemblePhase;
  phase_description: string;
  themes: EnsembleTheme[];
  milestones: EnsembleMilestone[];
  use_cases: EnsembleUseCase[];
  institutions: EnsembleInstitution[];
};

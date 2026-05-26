export type ComplianceSignal = "open" | "conditional" | "restricted" | "placeholder";

export type ComplianceReference = {
  title: string;
  date: string;
  url: string;
  type: "primary-statute" | "regulator-guidance" | "regulator-register" | "court-record" | "official-statement" | "major-media" | "industry-media";
};

export type ComplianceJurisdiction = {
  code: string;
  name: string;
  regulators: string[];
  primary_legislation: string[];
};

export type ComplianceIssue = {
  code: string;
  title: string;
  description: string;
};

export type ComplianceCell = {
  jurisdiction: string;
  issue: string;
  status_signal: ComplianceSignal;
  summary: string;
  key_requirements: string[];
  exemptions: string[];
  practitioner_notes?: string;
  references: ComplianceReference[];
  last_reviewed: string | null;
};

export type ComplianceMatrix = {
  matrix_version: string;
  last_compiled: string;
  disclaimer: string;
  jurisdictions: ComplianceJurisdiction[];
  issues: ComplianceIssue[];
  cells: ComplianceCell[];
};

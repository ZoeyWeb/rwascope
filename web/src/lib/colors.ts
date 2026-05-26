export const REGION_COLORS = {
  us:     { bg: '#FAECE7', text: '#993C1D' },
  hk:     { bg: '#E6F1FB', text: '#0C447C' },
  eu:     { bg: '#EEEDFE', text: '#3C3489' },
  sg:     { bg: '#E1F5EE', text: '#085041' },
  uae:    { bg: '#FAEEDA', text: '#854F0B' },
  global: { bg: '#F1F4F6', text: '#374151' },
} as const;

export const ECOSYSTEM_LAYER_COLORS = {
  L1_regulators:     { bg: '#E6F1FB', text: '#0C447C' },
  L2_issuers:        { bg: '#EEEDFE', text: '#3C3489' },
  L3_infrastructure: { bg: '#E1F5EE', text: '#085041' },
  L4_services:       { bg: '#FAECE7', text: '#712B13' },
  L5_applications:   { bg: '#FBEAF0', text: '#72243E' },
} as const;

export const FRICTION_COLORS = {
  low:  { bg: '#C0DD97', text: '#173404' },
  mid:  { bg: '#FAC775', text: '#412402' },
  high: { bg: '#F09595', text: '#501313' },
} as const;

export const SIGNIFICANCE_COLORS = {
  landmark: { bg: '#FAEEDA', text: '#854F0B' },
  major:    { bg: '#F1F4F6', text: '#2B3437' },
  notable:  { bg: '#F1F4F6', text: '#737C7F' },
} as const;

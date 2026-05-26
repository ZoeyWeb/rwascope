/**
 * Multi-step RARM due diligence workbook.
 * Steps: 0 = Protocol Info, 1-6 = Layer scoring + evidence, 7 = Review & Submit
 *
 * COMPLIANCE: Scores default to null (user must actively choose a score).
 * The submit action generates a due diligence checklist, not a platform rating.
 */
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import {
  assessmentApi,
  type LayerDef,
  type CreateAssessmentRequest,
} from '../../api/client';

const ASSET_CLASSES = [
  { value: 'government_bond', label: 'Government Bond' },
  { value: 'real_estate', label: 'Real Estate' },
  { value: 'precious_metal', label: 'Precious Metal' },
  { value: 'private_credit', label: 'Private Credit' },
  { value: 'commodity', label: 'Commodity' },
  { value: 'equity', label: 'Equity' },
  { value: 'other', label: 'Other' },
];

const SCORE_LABELS: Record<number, string> = {
  0: 'N/A',
  1: 'Critical',
  2: 'Poor',
  3: 'Adequate',
  4: 'Good',
  5: 'Excellent',
};

const SCORE_COLORS: Record<number, string> = {
  0: 'text-slate-500',
  1: 'text-red-400',
  2: 'text-orange-400',
  3: 'text-yellow-400',
  4: 'text-blue-400',
  5: 'text-emerald-400',
};

// layerNum → indicatorKey → score (null = not yet scored)
type ScoreMap = Record<number, Record<string, number | null>>;
// layerNum → indicatorKey → rationale text
type RationaleMap = Record<number, Record<string, string>>;

export default function Form() {
  const { accessToken } = useAuth();
  const navigate = useNavigate();

  const [step, setStep] = useState(0);
  const [layers, setLayers] = useState<LayerDef[]>([]);
  const [loadingLayers, setLoadingLayers] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  // Protocol info (step 0)
  const [protocolName, setProtocolName] = useState('');
  const [assetClass, setAssetClass] = useState('government_bond');
  const [description, setDescription] = useState('');
  const [chains, setChains] = useState('');

  // Scores and evidence notes (steps 1-6)
  const [scores, setScores] = useState<ScoreMap>({});
  const [rationale, setRationale] = useState<RationaleMap>({});

  useEffect(() => {
    assessmentApi
      .layers()
      .then((defs) => {
        setLayers(defs);
        // Initialize scores to null — user must actively choose
        const initScores: ScoreMap = {};
        const initRationale: RationaleMap = {};
        defs.forEach((layer) => {
          initScores[layer.id] = {};
          initRationale[layer.id] = {};
          layer.indicators.forEach((ind) => {
            initScores[layer.id][ind.key] = null;
            initRationale[layer.id][ind.key] = '';
          });
        });
        setScores(initScores);
        setRationale(initRationale);
      })
      .catch(() => setError('Failed to load layer definitions'))
      .finally(() => setLoadingLayers(false));
  }, []);

  const totalSteps = 2 + layers.length; // 0=info, 1-6=layers, last=review
  const reviewStep = layers.length + 1;

  function setScore(layerNum: number, key: string, value: number) {
    setScores((prev) => ({
      ...prev,
      [layerNum]: { ...prev[layerNum], [key]: value },
    }));
  }

  function setNote(layerNum: number, key: string, value: string) {
    setRationale((prev) => ({
      ...prev,
      [layerNum]: { ...prev[layerNum], [key]: value },
    }));
  }

  async function handleSubmit() {
    if (!accessToken) {
      navigate('/login', { state: { from: '/score' } });
      return;
    }
    setSubmitting(true);
    setError('');
    try {
      const layerInputs: CreateAssessmentRequest['layers'] = layers.map((layer) => ({
        layer_number: layer.id,
        scores: Object.entries(scores[layer.id] ?? {})
          .filter(([, s]) => s !== null)
          .map(([indicator_key, user_score]) => ({
            indicator_key,
            user_score: user_score as number,
            rationale: rationale[layer.id]?.[indicator_key] || undefined,
          })),
      }));

      const assessment = await assessmentApi.create(accessToken, {
        protocol_name: protocolName,
        asset_class: assetClass,
        description: description || undefined,
        chains: chains || undefined,
        layers: layerInputs,
      });

      navigate(`/score/review/${assessment.id}`);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Submission failed');
      setSubmitting(false);
    }
  }

  if (loadingLayers) {
    return (
      <div className="flex items-center justify-center h-64">
        <span className="material-symbols-outlined animate-spin text-4xl text-[#5E5C75]">
          progress_activity
        </span>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto py-8 px-4">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-xs text-slate-500 mb-6 font-label uppercase tracking-wider">
        <span>Due Diligence</span>
        <span>/</span>
        <span className="text-primary">New Workbook</span>
      </div>

      {/* Progress bar */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-bold text-white">
            {step === 0
              ? 'Protocol Information'
              : step === reviewStep
              ? 'Review & Submit'
              : `Layer ${step}: ${layers[step - 1]?.name}`}
          </span>
          <span className="text-xs text-slate-400">
            Step {step + 1} / {totalSteps}
          </span>
        </div>
        <div className="w-full h-1 bg-[#2B3437] rounded">
          <div
            className="h-1 bg-[#5E5C75] rounded transition-all duration-300"
            style={{ width: `${((step + 1) / totalSteps) * 100}%` }}
          />
        </div>
      </div>

      {/* Step content */}
      <div className="bg-[#1A1A2E] border border-[#2B3437] rounded-lg p-6">
        {error && (
          <div className="flex items-center gap-2 text-red-400 text-sm bg-red-400/10 border border-red-400/20 rounded px-3 py-2 mb-4">
            <span className="material-symbols-outlined text-base">error</span>
            {error}
          </div>
        )}

        {/* ── Step 0: Protocol Info ── */}
        {step === 0 && (
          <div className="space-y-5">
            <div>
              <h2 className="text-lg font-bold text-white mb-1">Protocol Information</h2>
              <p className="text-xs text-slate-500">
                Identify the protocol you are conducting due diligence on.
              </p>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                Protocol / Asset Name *
              </label>
              <input
                type="text"
                value={protocolName}
                onChange={(e) => setProtocolName(e.target.value)}
                placeholder="e.g. Ondo USDY, Franklin OnChain Fund"
                className="w-full bg-[#0F1117] border border-[#2B3437] rounded px-3 py-2 text-white text-sm placeholder-slate-600 focus:outline-none focus:border-[#5E5C75]"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                Asset Class *
              </label>
              <select
                value={assetClass}
                onChange={(e) => setAssetClass(e.target.value)}
                className="w-full bg-[#0F1117] border border-[#2B3437] rounded px-3 py-2 text-white text-sm focus:outline-none focus:border-[#5E5C75]"
              >
                {ASSET_CLASSES.map((ac) => (
                  <option key={ac.value} value={ac.value}>
                    {ac.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                Description
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={3}
                placeholder="Brief description of the protocol…"
                className="w-full bg-[#0F1117] border border-[#2B3437] rounded px-3 py-2 text-white text-sm placeholder-slate-600 focus:outline-none focus:border-[#5E5C75] resize-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                Chains
              </label>
              <input
                type="text"
                value={chains}
                onChange={(e) => setChains(e.target.value)}
                placeholder="e.g. Ethereum, Solana, Polygon"
                className="w-full bg-[#0F1117] border border-[#2B3437] rounded px-3 py-2 text-white text-sm placeholder-slate-600 focus:outline-none focus:border-[#5E5C75]"
              />
            </div>
          </div>
        )}

        {/* ── Steps 1-6: Layer scoring ── */}
        {step >= 1 && step <= layers.length && (() => {
          const layer = layers[step - 1];
          const weight = (layer.weight_by_class[assetClass] ?? 1 / 6) * 100;
          return (
            <div>
              <div className="flex items-start justify-between mb-2">
                <div>
                  <h2 className="text-lg font-bold text-white">{layer.name}</h2>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Weight for {ASSET_CLASSES.find((ac) => ac.value === assetClass)?.label}:{' '}
                    <span className="text-[#5E5C75] font-bold">{weight.toFixed(1)}%</span>
                  </p>
                </div>
                <div className="text-2xl font-bold text-[#5E5C75] font-headline">L{layer.id}</div>
              </div>

              <p className="text-xs text-slate-500 mb-5 leading-relaxed">
                Score each indicator based on your own research (0 = N/A / not assessed, 5 = Excellent).
                Record your evidence sources in the text box below each indicator.
              </p>

              <div className="space-y-5">
                {layer.indicators.map((ind) => {
                  const val = scores[layer.id]?.[ind.key];
                  const note = rationale[layer.id]?.[ind.key] ?? '';
                  return (
                    <div
                      key={ind.key}
                      className="bg-[#0F1117] border border-[#2B3437] rounded p-4 space-y-3"
                    >
                      {/* Label + current score */}
                      <div className="flex items-start gap-3">
                        <div className="flex-1">
                          <div className="text-sm font-semibold text-white">{ind.label}</div>
                          <div className="text-xs text-slate-500 mt-0.5">{ind.description}</div>
                        </div>
                        <div className="text-right min-w-[80px] shrink-0">
                          {val !== null && val !== undefined ? (
                            <div className={SCORE_COLORS[val]}>
                              <div className="text-xl font-bold font-headline">{val}</div>
                              <div className="text-xs">{SCORE_LABELS[val]}</div>
                            </div>
                          ) : (
                            <div className="text-slate-600">
                              <div className="text-xl font-bold font-headline">—</div>
                              <div className="text-xs">Not scored</div>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Score buttons */}
                      <div className="flex gap-1">
                        {[0, 1, 2, 3, 4, 5].map((n) => (
                          <button
                            key={n}
                            onClick={() => setScore(layer.id, ind.key, n)}
                            className={`flex-1 py-1.5 rounded text-xs font-bold transition-colors ${
                              val === n
                                ? 'bg-[#5E5C75] text-white'
                                : 'bg-[#1A1A2E] text-slate-400 hover:bg-[#2B3437] hover:text-white'
                            }`}
                          >
                            {n}
                          </button>
                        ))}
                      </div>

                      {/* Evidence / rationale */}
                      <textarea
                        value={note}
                        onChange={(e) => setNote(layer.id, ind.key, e.target.value)}
                        placeholder="Evidence / rationale for your score (optional)…"
                        rows={2}
                        className="w-full bg-[#0F1117] border border-[#2B3437] rounded px-3 py-2 text-xs text-slate-300 placeholder-slate-700 focus:outline-none focus:border-[#5E5C75] resize-none"
                      />
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })()}

        {/* ── Review step ── */}
        {step === reviewStep && (
          <div>
            <h2 className="text-lg font-bold text-white mb-1">Review & Submit</h2>
            <p className="text-xs text-slate-500 mb-4">
              Review your inputs. After submission an AI assistant will generate a due diligence
              checklist (verification questions, data sources, red flags) to help you finalise
              your own analysis. This takes 15–30 seconds.
            </p>

            <div className="space-y-3 mb-6">
              <InfoRow label="Protocol" value={protocolName} />
              <InfoRow
                label="Asset Class"
                value={ASSET_CLASSES.find((ac) => ac.value === assetClass)?.label ?? assetClass}
              />
              {description && <InfoRow label="Description" value={description} />}
              {chains && <InfoRow label="Chains" value={chains} />}
            </div>

            {/* Layer score summary */}
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mb-4">
              {layers.map((layer) => {
                const layerScores = Object.values(scores[layer.id] ?? {}).filter(
                  (s): s is number => s !== null,
                );
                const scored = layerScores.length;
                const total = layer.indicators.length;
                const avg =
                  scored > 0 ? layerScores.reduce((a, b) => a + b, 0) / scored : null;
                return (
                  <div
                    key={layer.id}
                    className="bg-[#0F1117] border border-[#2B3437] rounded p-3"
                  >
                    <div className="text-xs text-slate-500 font-label uppercase tracking-wider">
                      L{layer.id}
                    </div>
                    <div className="text-sm font-semibold text-white mt-0.5 leading-tight">
                      {layer.name.split(' ')[0]}
                    </div>
                    <div className="text-2xl font-bold text-[#5E5C75] font-headline mt-1">
                      {avg !== null ? avg.toFixed(1) : '—'}
                    </div>
                    <div className="text-[10px] text-slate-600 mt-0.5">
                      {scored}/{total} scored
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="p-3 border border-[#2B3437] bg-[#0F1117] rounded text-[10px] text-slate-600 leading-relaxed">
              Your scores reflect your own professional judgment. RWA-Index does not provide
              credit ratings or investment advice. The AI checklist is a research aid only.
            </div>
          </div>
        )}
      </div>

      {/* Navigation */}
      <div className="flex justify-between mt-6">
        <button
          onClick={() => setStep((s) => Math.max(0, s - 1))}
          disabled={step === 0}
          className="flex items-center gap-2 px-4 py-2 text-sm text-slate-400 hover:text-white disabled:opacity-30 transition-colors"
        >
          <span className="material-symbols-outlined text-base">arrow_back</span>
          Back
        </button>

        {step < reviewStep ? (
          <button
            onClick={() => {
              if (step === 0 && !protocolName.trim()) {
                setError('Protocol name is required');
                return;
              }
              setError('');
              setStep((s) => s + 1);
            }}
            className="flex items-center gap-2 px-5 py-2 bg-[#5E5C75] hover:bg-[#4E4C65] text-white text-sm font-bold rounded transition-colors"
          >
            Next
            <span className="material-symbols-outlined text-base">arrow_forward</span>
          </button>
        ) : (
          <button
            onClick={handleSubmit}
            disabled={submitting}
            className="flex items-center gap-2 px-5 py-2 bg-[#5E5C75] hover:bg-[#4E4C65] disabled:opacity-50 text-white text-sm font-bold rounded transition-colors"
          >
            {submitting ? (
              <>
                <span className="material-symbols-outlined text-base animate-spin">
                  progress_activity
                </span>
                Submitting…
              </>
            ) : (
              <>
                <span className="material-symbols-outlined text-base">checklist</span>
                Generate Due Diligence Checklist
              </>
            )}
          </button>
        )}
      </div>
    </div>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex gap-4">
      <span className="text-xs font-bold text-slate-500 uppercase tracking-wider w-28 shrink-0 pt-0.5">
        {label}
      </span>
      <span className="text-sm text-white">{value}</span>
    </div>
  );
}

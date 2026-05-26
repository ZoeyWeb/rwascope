export interface Region {
  id: string;
  name: string;
  status: 'active' | 'beta' | 'planned';
  data_file: string | null;
}

interface RegionSelectorProps {
  regions: Region[];
  activeRegion: string;
  onChange: (regionId: string) => void;
}

export default function RegionSelector({ regions, activeRegion, onChange }: RegionSelectorProps) {
  return (
    <div className="flex items-center gap-2 flex-wrap">
      {regions.map(region => {
        if (region.status === 'planned') {
          return (
            <button
              key={region.id}
              disabled
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-[#2B3437] text-xs text-slate-600 cursor-not-allowed select-none"
            >
              {region.name}
              <span className="text-[9px] bg-[#1A1A2E] text-slate-600 px-1.5 py-0.5 rounded-full font-semibold uppercase tracking-wide">
                Coming Soon
              </span>
            </button>
          );
        }

        const isActive = activeRegion === region.id;
        return (
          <button
            key={region.id}
            onClick={() => onChange(region.id)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-xs font-medium transition-all ${
              isActive
                ? 'border-[#5E5C75] bg-[#5E5C75]/20 text-white'
                : 'border-[#2B3437] text-slate-400 hover:border-slate-500 hover:text-slate-300'
            }`}
          >
            {region.name}
            {region.status === 'beta' && (
              <span className="text-[9px] bg-amber-900/60 text-amber-400 px-1.5 py-0.5 rounded-full font-bold uppercase tracking-wide">
                Beta
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}

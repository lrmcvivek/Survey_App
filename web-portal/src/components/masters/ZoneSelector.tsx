import React, { useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { masterDataApi } from "@/lib/api";

interface ZoneSelectorProps {
  ulbId: string | null;
  value: string | null;
  onChange: (zoneId: string | null) => void;
  isDark?: boolean;
  hideLabel?: boolean;
}

export default function ZoneSelector({
  ulbId,
  value,
  onChange,
  isDark = false,
  hideLabel = false
}: ZoneSelectorProps) {
  // Reset selected zone when ulbId changes
  useEffect(() => {
    if (ulbId === null) onChange(null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ulbId]);

  const {
    data: zones,
    isLoading,
    error,
  } = useQuery({
    queryKey: ["zones", ulbId],
    queryFn: () => (ulbId ? masterDataApi.getZonesByUlb(ulbId) : []),
    enabled: !!ulbId,
  });

  const baseStyles = "w-full text-sm font-bold rounded-2xl px-6 py-4 outline-none transition-all appearance-none cursor-pointer";
  const darkStyles = "bg-slate-800/40 border border-slate-700/50 text-slate-200 focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500/50 disabled:opacity-30";
  const lightStyles = "bg-slate-50 border border-slate-100 text-slate-700 focus:ring-4 focus:ring-blue-500/5 focus:border-blue-500/20 disabled:opacity-50";

  return (
    <div className="space-y-2">
      {!hideLabel && (
        <label className={`block text-[10px] font-black uppercase tracking-[0.2em] ml-1 ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>
          Zone Area
        </label>
      )}
      <div className="relative group">
        <select
          className={`${baseStyles} ${isDark ? darkStyles : lightStyles}`}
          value={value || ""}
          onChange={(e) => onChange(e.target.value || null)}
          disabled={isLoading || !!error || !ulbId}
        >
          <option value="">Select Zone</option>
          {zones &&
            zones.length > 0 &&
            zones.map((zone: any) => (
              <option key={zone.zoneId} value={zone.zoneId} className="bg-slate-900 text-white">
                {zone.zoneNumber} - {zone.zoneName}
              </option>
            ))}
        </select>
        <div className="absolute right-6 top-1/2 -translate-y-1/2 pointer-events-none opacity-20 group-hover:opacity-100 transition-opacity">
           <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M19 9l-7 7-7-7" />
           </svg>
        </div>
      </div>
      {isLoading && <div className="text-[10px] font-bold text-slate-500 px-2 italic animate-pulse tracking-widest uppercase">Fetching Zones...</div>}
      {!ulbId && !isLoading && <div className="text-[10px] font-bold text-slate-500/50 px-2 italic tracking-widest uppercase">Awaiting Registry</div>}
    </div>
  );
}

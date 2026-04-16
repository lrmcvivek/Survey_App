import React, { useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { masterDataApi } from "@/lib/api";

interface WardSelectorProps {
  zoneId: string | null;
  value: string | null;
  onChange: (wardId: string | null) => void;
  isDark?: boolean;
  hideLabel?: boolean;
}

export default function WardSelector({
  zoneId,
  value,
  onChange,
  isDark = false,
  hideLabel = false
}: WardSelectorProps) {
  // Reset selected ward when zoneId changes
  useEffect(() => {
    if (zoneId === null) onChange(null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [zoneId]);

  const {
    data: wards,
    isLoading,
    error,
  } = useQuery({
    queryKey: ["wards", zoneId],
    queryFn: () => (zoneId ? masterDataApi.getWardsByZone(zoneId) : []),
    enabled: !!zoneId,
  });

  const baseStyles = "w-full text-sm font-bold rounded-2xl px-6 py-4 outline-none transition-all appearance-none cursor-pointer";
  const darkStyles = "bg-slate-800/40 border border-slate-700/50 text-slate-200 focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500/50 disabled:opacity-30";
  const lightStyles = "bg-slate-50 border border-slate-100 text-slate-700 focus:ring-4 focus:ring-blue-500/5 focus:border-blue-500/20 disabled:opacity-50";

  return (
    <div className="space-y-2">
      {!hideLabel && (
        <label className={`block text-[10px] font-black uppercase tracking-[0.2em] ml-1 ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>
          Ward Identity
        </label>
      )}
      <div className="relative group">
        <select
          className={`${baseStyles} ${isDark ? darkStyles : lightStyles}`}
          value={value || ""}
          onChange={(e) => onChange(e.target.value || null)}
          disabled={isLoading || !!error || !zoneId}
        >
          <option value="">Select Ward</option>
          {wards &&
            wards.length > 0 &&
            wards.map((ward: any) => (
              <option key={ward.wardId} value={ward.wardId} className="bg-slate-900 text-white">
                {ward.newWardNumber} - {ward.wardName}
              </option>
            ))}
        </select>
        <div className="absolute right-6 top-1/2 -translate-y-1/2 pointer-events-none opacity-20 group-hover:opacity-100 transition-opacity">
           <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M19 9l-7 7-7-7" />
           </svg>
        </div>
      </div>
      {isLoading && <div className="text-[10px] font-bold text-slate-500 px-2 italic animate-pulse tracking-widest uppercase">Indexing Wards...</div>}
      {!zoneId && !isLoading && <div className="text-[10px] font-bold text-slate-500/50 px-2 italic tracking-widest uppercase">Awaiting Zone</div>}
    </div>
  );
}

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

  const selectStyles = "w-full text-sm font-medium rounded-lg px-3 py-2.5 outline-none transition-all appearance-none cursor-pointer bg-white border border-gray-300 text-gray-800 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 disabled:opacity-50 disabled:cursor-not-allowed";

  return (
    <div className="space-y-1.5">
      {!hideLabel && (
        <label className="block text-xs font-semibold uppercase tracking-wider text-gray-500 ml-0.5">
          Ward
        </label>
      )}
      <div className="relative">
        <select
          className={selectStyles}
          value={value || ""}
          onChange={(e) => onChange(e.target.value || null)}
          disabled={isLoading || !!error || !zoneId}
        >
          <option value="">Select Ward</option>
          {wards &&
            wards.length > 0 &&
            wards.map((ward: any) => (
              <option key={ward.wardId} value={ward.wardId}>
                {ward.newWardNumber} - {ward.wardName}
              </option>
            ))}
        </select>
        <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400">
           <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
           </svg>
        </div>
      </div>
      {isLoading && <div className="text-xs text-gray-400 px-0.5 animate-pulse">Loading wards...</div>}
      {!zoneId && !isLoading && <div className="text-xs text-gray-400 px-0.5">Select a zone first</div>}
    </div>
  );
}

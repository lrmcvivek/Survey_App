"use client";
import React from "react";
import { useQuery } from "@tanstack/react-query";
import { masterDataApi } from "@/lib/api";

interface SurveyTypeSelectorProps {
  value: string | null;
  onChange: (value: string | null) => void;
  isDark?: boolean;
  hideLabel?: boolean;
}

const SurveyTypeSelector: React.FC<SurveyTypeSelectorProps> = ({
  value,
  onChange,
  isDark = false,
  hideLabel = false
}) => {
  const { data, isLoading, error } = useQuery({
    queryKey: ["surveyTypes"],
    queryFn: async () => {
      return await masterDataApi.getSurveyTypes();
    },
  });

  const baseStyles = "w-full text-sm font-bold rounded-2xl px-6 py-4 outline-none transition-all appearance-none cursor-pointer";
  const darkStyles = "bg-slate-800/40 border border-slate-700/50 text-slate-200 focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500/50";
  const lightStyles = "bg-slate-50 border border-slate-100 text-slate-700 focus:ring-4 focus:ring-blue-500/5 focus:border-blue-500/20";

  return (
    <div className="space-y-2">
      {!hideLabel && (
        <label className={`block text-[10px] font-black uppercase tracking-[0.2em] ml-1 ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>
          Objective <span className="text-red-500">*</span>
        </label>
      )}
      <div className="relative group">
        <select
          className={`${baseStyles} ${isDark ? darkStyles : lightStyles}`}
          value={value || ""}
          onChange={(e) => onChange(e.target.value || null)}
          disabled={isLoading || !!error}
          required
        >
          <option value="">Select Survey Type</option>
          {data &&
            data.map((st: any) => (
              <option key={st.surveyTypeId} value={st.surveyTypeId} className="bg-slate-900 text-white">
                {st.surveyTypeName}
              </option>
            ))}
        </select>
        <div className="absolute right-6 top-1/2 -translate-y-1/2 pointer-events-none opacity-20 group-hover:opacity-100 transition-opacity">
           <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M19 9l-7 7-7-7" />
           </svg>
        </div>
      </div>
      {isLoading && <div className="text-[10px] font-bold text-slate-500 px-2 italic animate-pulse tracking-widest uppercase">Initializing...</div>}
      {error && <div className="text-[10px] font-bold text-red-500 px-2 italic tracking-widest uppercase">System fault</div>}
    </div>
  );
};

export default SurveyTypeSelector;

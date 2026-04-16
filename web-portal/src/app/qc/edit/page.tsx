"use client";
import React, { useState, useEffect } from "react";
import MainLayout from "@/components/layout/MainLayout";
import ULBSelector from "@/components/masters/ULBSelector";
import ZoneSelector from "@/components/masters/ZoneSelector";
import WardSelector from "@/components/masters/WardSelector";
import MohallaSelector from "@/components/masters/MohallaSelector";
import SurveyTypeSelector from "@/components/masters/SurveyTypeSelector";
import { useAuth } from "@/features/auth/AuthContext";
import { 
  Filter, 
  MapPin, 
  Calendar, 
  Target, 
  Search, 
  RotateCcw,
  ChevronRight
} from "lucide-react";

export default function QCEditFilterPage() {
  const { user } = useAuth();
  
  const [ulbId, setUlbId] = useState<string | null>(null);
  const [zoneId, setZoneId] = useState<string | null>(null);
  const [wardId, setWardId] = useState<string | null>(null);
  const [mohallaId, setMohallaId] = useState<string | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const [fromDate, setFromDate] = useState<string>("");
  const [toDate, setToDate] = useState<string>("");
  const [error, setError] = useState<string>("");
  const [surveyTypeId, setSurveyTypeId] = useState<string | null>(null);
  const [propertyTypeId, setPropertyTypeId] = useState<string | null>(null);
  const [qcDone, setQcDone] = useState<string>("ALL");

  useEffect(() => {
    setZoneId(null);
    setWardId(null);
    setMohallaId(null);
    setUserId(null);
  }, [ulbId]);

  useEffect(() => {
    setWardId(null);
    setMohallaId(null);
    setUserId(null);
  }, [zoneId]);

  useEffect(() => {
    setMohallaId(null);
    setUserId(null);
  }, [wardId]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!surveyTypeId || !ulbId) {
      setError("Please select at least the Survey Type and ULB to proceed.");
      return;
    }
    setError("");
    
    const params = new URLSearchParams({
      surveyTypeId,
      ulbId,
      zoneId: zoneId || "",
      wardId: wardId || "",
      mohallaId: mohallaId || "",
      userId: userId || "",
      propertyTypeId: propertyTypeId || "",
      fromDate,
      toDate,
      qcDone,
      userRole: user?.role || "",
      qcLevel: "1",
    });
    
    window.open(`/qc/edit/table?${params.toString()}`, "_blank");
  };

  return (
    <MainLayout>
      <div className="bg-[#161B26] border border-slate-800 shadow-2xl shadow-black/40 overflow-hidden">
            <div className="bg-slate-800/20 border-b border-slate-800 p-8 flex items-center gap-4">
              <div className="w-12 h-12 bg-blue-600/10 rounded-2xl border border-blue-500/20 flex items-center justify-center text-blue-400">
                <Filter className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-2xl font-black text-white tracking-tight">Review Parameters</h3>
                <p className="text-slate-500 text-[10px] font-black uppercase tracking-[0.2em] mt-1 italic leading-none">Filter Registry</p>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="p-10 space-y-12">
              {/* Classification */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-3">
                  <label className="flex items-center gap-2 text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] ml-1">
                    <Target className="w-3.5 h-3.5" />
                    Objective Category
                  </label>
                  <SurveyTypeSelector value={surveyTypeId} onChange={setSurveyTypeId} isDark />
                </div>
                <div className="space-y-3">
                  <label className="flex items-center gap-2 text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] ml-1">
                    <MapPin className="w-3.5 h-3.5" />
                    Urban Local Body
                  </label>
                  <ULBSelector value={ulbId} onChange={setUlbId} isDark />
                </div>
              </div>

              {/* Geographic Hierarchy */}
              <div className="space-y-6 pt-10 border-t border-slate-800/50">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="space-y-2">
                    <ZoneSelector ulbId={ulbId} value={zoneId} onChange={setZoneId} isDark />
                  </div>
                  <div className="space-y-2">
                    <WardSelector zoneId={zoneId} value={wardId} onChange={setWardId} isDark />
                  </div>
                  <div className="space-y-2">
                    <MohallaSelector wardId={wardId} value={mohallaId} onChange={setMohallaId} isDark />
                  </div>
                </div>
              </div>

              {/* Metadata & Chronology */}
              <div className="pt-10 border-t border-slate-800/50">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                  <div className="space-y-3">
                    <label className="flex items-center gap-2 text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] ml-1">
                      <Calendar className="w-3.5 h-3.5" />
                      Audited From
                    </label>
                    <input
                      type="date"
                      className="w-full px-6 py-4 bg-slate-800/40 border border-slate-700/50 rounded-2xl focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500/50 transition-all text-slate-200 font-bold outline-none"
                      value={fromDate}
                      onChange={(e) => setFromDate(e.target.value)}
                    />
                  </div>
                  <div className="space-y-3">
                    <label className="flex items-center gap-2 text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] ml-1">
                      <Calendar className="w-3.5 h-3.5" />
                      Audited Until
                    </label>
                    <input
                      type="date"
                      className="w-full px-6 py-4 bg-slate-800/40 border border-slate-700/50 rounded-2xl focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500/50 transition-all text-slate-200 font-bold outline-none"
                      value={toDate}
                      onChange={(e) => setToDate(e.target.value)}
                    />
                  </div>
                  <div className="space-y-3">
                    <label className="flex items-center gap-2 text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] ml-1">
                      <Target className="w-3.5 h-3.5" />
                      Review State
                    </label>
                    <select
                      className="w-full px-6 py-4 bg-slate-800/40 border border-slate-700/50 rounded-2xl focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500/50 transition-all text-slate-200 font-bold outline-none cursor-pointer appearance-none"
                      value={qcDone}
                      onChange={(e) => setQcDone(e.target.value)}
                    >
                      <option value="ALL">All Records</option>
                      <option value="PENDING">Pending Review</option>
                      <option value="DONE">Verified Records</option>
                    </select>
                  </div>
                </div>
              </div>

              {error && (
                <div className="p-4 bg-red-500/10 text-red-400 text-[10px] font-black rounded-2xl border border-red-500/20 flex items-center gap-3 animate-pulse italic uppercase tracking-widest">
                  <Filter className="w-4 h-4" />
                  {error}
                </div>
              )}

              <div className="flex flex-col md:flex-row gap-4 pt-10 border-t border-slate-800/50">
                <button
                  type="button"
                  className="flex-1 flex items-center justify-center gap-2 px-8 py-5 bg-slate-800 text-slate-400 font-black rounded-2xl hover:bg-slate-700 transition-all uppercase tracking-widest text-[10px] active:scale-95"
                  onClick={() => {
                    setSurveyTypeId(null);
                    setUlbId(null);
                    setZoneId(null);
                    setWardId(null);
                    setMohallaId(null);
                    setUserId(null);
                    setPropertyTypeId(null);
                    setFromDate("");
                    setToDate("");
                    setQcDone("ALL");
                    setError("");
                  }}
                >
                  <RotateCcw className="w-4 h-4" />
                  Reset Matrix
                </button>
                <button
                  type="submit"
                  className="flex-[2] flex items-center justify-center gap-3 px-8 py-5 bg-blue-600 text-white font-black rounded-2xl shadow-xl shadow-blue-900/20 hover:bg-blue-500 transition-all uppercase tracking-widest text-[10px] group active:scale-95"
                >
                  <Search className="w-4 h-4" />
                  Launch Interface
                  <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </button>
              </div>
            </form>
          </div>
    </MainLayout>
  );
}

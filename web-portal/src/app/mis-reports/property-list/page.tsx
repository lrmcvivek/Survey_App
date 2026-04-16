"use client";
import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import MainLayout from "@/components/layout/MainLayout";
import ULBSelector from "@/components/masters/ULBSelector";
import ZoneSelector from "@/components/masters/ZoneSelector";
import WardSelector from "@/components/masters/WardSelector";
import MohallaSelector from "@/components/masters/MohallaSelector";
import SurveyTypeSelector from "@/components/masters/SurveyTypeSelector";
import {  
  Calendar, 
  Target, 
  Search, 
  RotateCcw,
  Sparkles,
  ChevronRight,
  Hash,
  Database,
  Activity,
  Zap
} from "lucide-react";

export default function PropertyListFilterPage() {
  const router = useRouter();
  const [ulbId, setUlbId] = useState<string | null>(null);
  const [zoneId, setZoneId] = useState<string | null>(null);
  const [wardId, setWardId] = useState<string | null>(null);
  const [mohallaId, setMohallaId] = useState<string | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const [mapId, setMapId] = useState<string>("");
  const [gisId, setGisId] = useState<string>("");
  const [fromDate, setFromDate] = useState<string>("");
  const [toDate, setToDate] = useState<string>("");
  const [error, setError] = useState<string>("");
  const [surveyTypeId, setSurveyTypeId] = useState<string | null>(null);
  const [subGisId, setSubGisId] = useState<string>("");

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
      setError("Selection required: Objective Category and ULB node must be defined.");
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
      mapId,
      gisId,
      subGisId,
      fromDate,
      toDate,
    });
    window.open(
      `/mis-reports/property-list/full-table?${params.toString()}`,
      "_blank"
    );
  };

  return (
    <MainLayout>
      <div className="max-w-8xl mx-auto space-y-12">
          {/* Header */}
          <div className="bg-[#161B26] border border-slate-800 shadow-2xl relative overflow-hidden animate-in fade-in zoom-in-95 duration-700">
            {/* Form Header */}
            <div className="p-6 border-b border-slate-800/50 flex items-center justify-between bg-slate-800/20 relative z-10">
               <div className="flex items-center gap-4">
                  <div>
                     <h3 className="text-xl font-black text-white tracking-tight  uppercase">Property List</h3>
                     <p className="text-[15px] text-slate-500 font-black uppercase tracking-widest mt-1 ">Data parameters</p>
                  </div>
               </div>
               <Sparkles className="w-6 h-6 text-slate-700 animate-pulse" />
            </div>

            {/* Background Aesthetic */}
            <div className="absolute top-0 right-0 p-24 opacity-5 pointer-events-none">
               <Activity className="w-64 h-64 text-white" />
            </div>

            <form onSubmit={handleSubmit} className="p-10 space-y-12 relative z-10">
               {/* Core Parameters */}
               <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <SurveyTypeSelector isDark={true} value={surveyTypeId} onChange={setSurveyTypeId} />
                  <ULBSelector isDark={true} value={ulbId} onChange={setUlbId} />
               </div>

               {/* Spatial Hierarchy */}
               <div className="space-y-6 pt-6 border-t border-slate-800/50">
                  <h4 className="text-[15px] font-black text-slate-500 uppercase tracking-[0.3em]  border-l-2 border-blue-500 pl-4">Geographical Hierarchy</h4>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                     <ZoneSelector isDark={true} ulbId={ulbId} value={zoneId} onChange={setZoneId} />
                     <WardSelector isDark={true} zoneId={zoneId} value={wardId} onChange={setWardId} />
                     <MohallaSelector isDark={true} wardId={wardId} value={mohallaId} onChange={setMohallaId} />
                  </div>
               </div>

               {/* Identification Array */}
               <div className="space-y-6 pt-6 border-t border-slate-800/50">
                  <h4 className="text-[15px] font-black text-slate-500 uppercase tracking-[0.3em]  border-l-2 border-amber-500 pl-4"> IDs Information</h4>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                     <div className="space-y-2">
                        <label className="text-[15px] font-black text-slate-500 uppercase tracking-widest  ml-1 flex items-center gap-2">
                           <Hash className="w-3 h-3 text-amber-500" />
                           Map ID
                        </label>
                        <input 
                          placeholder="Enter Map ID..." 
                          value={mapId} 
                          onChange={e => setMapId(e.target.value)} 
                          className="w-full bg-slate-900 border border-slate-800 rounded-2xl px-5 py-4 text-sm font-bold text-slate-200 outline-none focus:ring-4 focus:ring-blue-500/10 font-mono transition-all"
                        />
                     </div>
                     <div className="space-y-2">
                        <label className="text-[15px] font-black text-slate-500 uppercase tracking-widest  ml-1 flex items-center gap-2">
                           <Hash className="w-3 h-3 text-amber-500" />
                           GIS ID
                        </label>
                        <input 
                          placeholder="Enter GIS ID..." 
                          value={gisId} 
                          onChange={e => setGisId(e.target.value)} 
                          className="w-full bg-slate-900 border border-slate-800 rounded-2xl px-5 py-4 text-sm font-bold text-slate-200 outline-none focus:ring-4 focus:ring-blue-500/10 font-mono transition-all"
                        />
                     </div>
                     <div className="space-y-2">
                        <label className="text-[15px] font-black text-slate-500 uppercase tracking-widest  ml-1 flex items-center gap-2">
                           <Hash className="w-3 h-3 text-amber-500" />
                           Sub-GIS ID
                        </label>
                        <input 
                          placeholder="Enter Sub-GIS ID..." 
                          value={subGisId} 
                          onChange={e => setSubGisId(e.target.value)} 
                          className="w-full bg-slate-900 border border-slate-800 rounded-2xl px-5 py-4 text-sm font-bold text-slate-200 outline-none focus:ring-4 focus:ring-blue-500/10 font-mono transition-all"
                        />
                     </div>
                  </div>
               </div>

               {/* Chronological Bounds */}
               <div className="space-y-6 pt-6 border-t border-slate-800/50">
                  <h4 className="text-[15px] font-black text-slate-500 uppercase tracking-[0.3em]  border-l-2 border-emerald-500 pl-4">Date Range</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                     <div className="space-y-2">
                        <label className="text-[15px] font-black text-slate-500 uppercase tracking-widest  ml-1 flex items-center gap-2">
                           <Calendar className="w-3 h-3 text-emerald-500" />
                           Start Date
                        </label>
                        <input 
                          type="date" 
                          value={fromDate} 
                          onChange={e => setFromDate(e.target.value)} 
                          className="w-full bg-slate-900 border border-slate-800 rounded-2xl px-5 py-4 text-sm font-bold text-slate-200 outline-none focus:ring-4 focus:ring-blue-500/10 uppercase tracking-widest"
                        />
                     </div>
                     <div className="space-y-2">
                        <label className="text-[15px] font-black text-slate-500 uppercase tracking-widest  ml-1 flex items-center gap-2">
                           <Calendar className="w-3 h-3 text-emerald-500" />
                           End Date
                        </label>
                        <input 
                          type="date" 
                          value={toDate} 
                          onChange={e => setToDate(e.target.value)} 
                          className="w-full bg-slate-900 border border-slate-800 rounded-2xl px-5 py-4 text-sm font-bold text-slate-200 outline-none focus:ring-4 focus:ring-blue-500/10 uppercase tracking-widest"
                        />
                     </div>
                  </div>
               </div>

               {error && (
                  <div className="p-4 bg-red-500/10 border border-red-500/20 text-red-400 text-[15px] font-black rounded-2xl flex items-center gap-3  uppercase tracking-[0.1em] animate-pulse">
                     <Target className="w-4 h-4" />
                     Protocol Error: {error}
                  </div>
               )}

               <div className="flex gap-4 pt-8">
                  <button 
                    type="button" 
                    onClick={() => {
                      setSurveyTypeId(null); setUlbId(null); setZoneId(null); setWardId(null); 
                      setMohallaId(null); setMapId(""); setGisId(""); setSubGisId(""); 
                      setFromDate(""); setToDate(""); setError("");
                    }}
                    className="flex-1 py-5 bg-[#161B26] border border-slate-800 text-slate-500 hover:text-white rounded-2xl font-black uppercase tracking-widest text-[15px] transition-all active:scale-95 flex items-center justify-center gap-2"
                  >
                    <RotateCcw className="w-4 h-4" />
                    Reset Buffer
                  </button>
                  <button 
                    type="submit" 
                    className="flex-[2] py-5 bg-blue-600 hover:bg-blue-500 text-white rounded-2xl font-black uppercase tracking-widest text-[15px] shadow-2xl shadow-blue-900/40 transition-all active:scale-95 flex items-center justify-center gap-3 group"
                  >
                    <Search className="w-4 h-4" />
                    Extract Data Stream
                    <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                  </button>
               </div>
            </form>
          </div>
        </div>
    </MainLayout>
  );
}

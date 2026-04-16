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
      <div className="max-w-5xl mx-auto space-y-8">
          {/* Header */}
          <div className="bg-white border border-gray-200 shadow-sm rounded-xl overflow-hidden animate-in fade-in zoom-in-95 duration-500">
            {/* Form Header */}
            <div className="p-6 border-b border-gray-100 flex items-center justify-between bg-gray-50/50">
               <div>
                  <h1 className="text-xl font-bold text-gray-900 tracking-tight">Property Survey List</h1>
                  <p className="text-sm text-gray-500 font-medium mt-1">Select filters to view property records</p>
               </div>
               <Activity className="w-5 h-5 text-gray-300" />
            </div>

            <form onSubmit={handleSubmit} className="p-8 space-y-10">
               {/* Core Parameters */}
               <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="space-y-2">
                     <label className="text-[11px] font-bold text-gray-500 uppercase tracking-wider ml-1">Survey Type</label>
                     <SurveyTypeSelector isDark={false} value={surveyTypeId} onChange={setSurveyTypeId} />
                  </div>
                  <div className="space-y-2">
                     <label className="text-[11px] font-bold text-gray-500 uppercase tracking-wider ml-1">Municipality (ULB)</label>
                     <ULBSelector isDark={false} value={ulbId} onChange={setUlbId} />
                  </div>
               </div>

               {/* Location Hierarchy */}
               <div className="space-y-6 pt-6 border-t border-gray-100">
                  <h4 className="text-[11px] font-bold text-gray-400 uppercase tracking-widest pl-1">Location Details</h4>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                     <div className="space-y-2">
                        <label className="text-[11px] font-bold text-gray-500 uppercase tracking-wider ml-1">Zone</label>
                        <ZoneSelector isDark={false} ulbId={ulbId} value={zoneId} onChange={setZoneId} />
                     </div>
                     <div className="space-y-2">
                        <label className="text-[11px] font-bold text-gray-500 uppercase tracking-wider ml-1">Ward</label>
                        <WardSelector isDark={false} zoneId={zoneId} value={wardId} onChange={setWardId} />
                     </div>
                     <div className="space-y-2">
                        <label className="text-[11px] font-bold text-gray-500 uppercase tracking-wider ml-1">Mohalla</label>
                        <MohallaSelector isDark={false} wardId={wardId} value={mohallaId} onChange={setMohallaId} />
                     </div>
                  </div>
               </div>

               {/* Property IDs */}
               <div className="space-y-6 pt-6 border-t border-gray-100">
                  <h4 className="text-[11px] font-bold text-gray-400 uppercase tracking-widest pl-1">Reference Numbers</h4>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                     <div className="space-y-2">
                        <label className="text-[11px] font-bold text-gray-500 uppercase tracking-wider ml-1 flex items-center gap-1.5">
                           <Hash className="w-3 h-3 text-blue-500" />
                           Map ID
                        </label>
                        <input 
                          placeholder="Enter Map ID..." 
                          value={mapId} 
                          onChange={e => setMapId(e.target.value)} 
                          className="w-full bg-gray-50 border border-gray-200 rounded-lg px-4 py-3 text-sm font-semibold text-gray-900 outline-none focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600 transition-all shadow-sm"
                        />
                     </div>
                     <div className="space-y-2">
                        <label className="text-[11px] font-bold text-gray-500 uppercase tracking-wider ml-1 flex items-center gap-1.5">
                           <Hash className="w-3 h-3 text-blue-500" />
                           GIS ID
                        </label>
                        <input 
                          placeholder="Enter GIS ID..." 
                          value={gisId} 
                          onChange={e => setGisId(e.target.value)} 
                          className="w-full bg-gray-50 border border-gray-200 rounded-lg px-4 py-3 text-sm font-semibold text-gray-900 outline-none focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600 transition-all shadow-sm"
                        />
                     </div>
                     <div className="space-y-2">
                        <label className="text-[11px] font-bold text-gray-500 uppercase tracking-wider ml-1 flex items-center gap-1.5">
                           <Hash className="w-3 h-3 text-blue-500" />
                           Sub-GIS ID
                        </label>
                        <input 
                          placeholder="Enter Sub-GIS ID..." 
                          value={subGisId} 
                          onChange={e => setSubGisId(e.target.value)} 
                          className="w-full bg-gray-50 border border-gray-200 rounded-lg px-4 py-3 text-sm font-semibold text-gray-900 outline-none focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600 transition-all shadow-sm"
                        />
                     </div>
                  </div>
               </div>

               {/* Date Selection */}
               <div className="space-y-6 pt-6 border-t border-gray-100">
                  <h4 className="text-[11px] font-bold text-gray-400 uppercase tracking-widest pl-1">Date Selection</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                     <div className="space-y-2">
                        <label className="text-[11px] font-bold text-gray-500 uppercase tracking-wider ml-1 flex items-center gap-1.5">
                           <Calendar className="w-3 h-3 text-gray-400" />
                           Start Date
                        </label>
                        <input 
                          type="date" 
                          value={fromDate} 
                          onChange={e => setFromDate(e.target.value)} 
                          className="w-full bg-gray-50 border border-gray-200 rounded-lg px-4 py-3 text-sm font-semibold text-gray-700 outline-none focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600 transition-all"
                        />
                     </div>
                     <div className="space-y-2">
                        <label className="text-[11px] font-bold text-gray-500 uppercase tracking-wider ml-1 flex items-center gap-1.5">
                           <Calendar className="w-3 h-3 text-gray-400" />
                           End Date
                        </label>
                        <input 
                          type="date" 
                          value={toDate} 
                          onChange={e => setToDate(e.target.value)} 
                          className="w-full bg-gray-50 border border-gray-200 rounded-lg px-4 py-3 text-sm font-semibold text-gray-700 outline-none focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600 transition-all"
                        />
                     </div>
                  </div>
               </div>

               {error && (
                  <div className="p-4 bg-red-50 border border-red-100 text-red-600 text-sm font-bold rounded-lg flex items-center gap-2">
                     <Target className="w-4 h-4" />
                     Error: {error}
                  </div>
               )}

               <div className="flex gap-4 pt-4">
                  <button 
                    type="button" 
                    onClick={() => {
                      setSurveyTypeId(null); setUlbId(null); setZoneId(null); setWardId(null); 
                      setMohallaId(null); setMapId(""); setGisId(""); setSubGisId(""); 
                      setFromDate(""); setToDate(""); setError("");
                    }}
                    className="flex-1 py-3.5 bg-gray-100 text-gray-600 hover:bg-gray-200 rounded-lg font-bold uppercase tracking-wider text-xs transition-all active:scale-95 flex items-center justify-center gap-2"
                  >
                    <RotateCcw className="w-4 h-4" />
                    Reset Filters
                  </button>
                  <button 
                    type="submit" 
                    className="flex-[2] py-3.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-bold uppercase tracking-wider text-xs shadow-md transition-all active:scale-95 flex items-center justify-center gap-2 group"
                  >
                    <Search className="w-4 h-4" />
                    Search Properties
                    <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                  </button>
               </div>
            </form>
          </div>
        </div>
    </MainLayout>
  );
}

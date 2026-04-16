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
      <div className="bg-white border border-gray-200 shadow-sm overflow-hidden rounded-xl">
            <div className="bg-gray-50/50 border-b border-gray-200 p-6 flex items-center gap-4">
              <div className="w-10 h-10 bg-blue-50 rounded-lg border border-blue-100 flex items-center justify-center text-blue-600">
                <Filter className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-gray-900 tracking-tight">Search Records</h3>
                <p className="text-gray-500 text-xs font-bold uppercase tracking-wider mt-1 leading-none">Filter parameters</p>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="p-8 space-y-10">
              {/* Classification */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="flex items-center gap-2 text-xs font-bold text-gray-600 uppercase tracking-wider ml-1">
                    <Target className="w-3.5 h-3.5" />
                    Survey Type
                  </label>
                  <SurveyTypeSelector value={surveyTypeId} onChange={setSurveyTypeId} isDark={false} hideLabel={true} />
                </div>
                <div className="space-y-2">
                  <label className="flex items-center gap-2 text-xs font-bold text-gray-600 uppercase tracking-wider ml-1">
                    <MapPin className="w-3.5 h-3.5" />
                    Urban Local Body
                  </label>
                  <ULBSelector value={ulbId} onChange={setUlbId} isDark={false} hideLabel={true} />
                </div>
              </div>

              {/* Geographic Hierarchy */}
              <div className="space-y-6 pt-8 border-t border-gray-100">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="space-y-2">
                    <ZoneSelector ulbId={ulbId} value={zoneId} onChange={setZoneId} isDark={false} />
                  </div>
                  <div className="space-y-2">
                    <WardSelector zoneId={zoneId} value={wardId} onChange={setWardId} isDark={false} />
                  </div>
                  <div className="space-y-2">
                    <MohallaSelector wardId={wardId} value={mohallaId} onChange={setMohallaId} isDark={false} />
                  </div>
                </div>
              </div>

              {/* Metadata & Chronology */}
              <div className="pt-8 border-t border-gray-100">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="space-y-1.5">
                    <label className="flex items-center gap-2 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                      <Calendar className="w-3.5 h-3.5" />
                      Date From
                    </label>
                    <input
                      type="date"
                      className="w-full px-3 py-2.5 bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 transition-all text-gray-800 text-sm font-medium outline-none"
                      value={fromDate}
                      onChange={(e) => setFromDate(e.target.value)}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="flex items-center gap-2 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                      <Calendar className="w-3.5 h-3.5" />
                      Date To
                    </label>
                    <input
                      type="date"
                      className="w-full px-3 py-2.5 bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 transition-all text-gray-800 text-sm font-medium outline-none"
                      value={toDate}
                      onChange={(e) => setToDate(e.target.value)}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="flex items-center gap-2 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                      <Target className="w-3.5 h-3.5" />
                      Review Status
                    </label>
                    <div className="relative">
                      <select
                        className="w-full text-sm font-medium rounded-lg px-3 py-2.5 outline-none transition-all appearance-none cursor-pointer bg-white border border-gray-300 text-gray-800 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400"
                        value={qcDone}
                        onChange={(e) => setQcDone(e.target.value)}
                      >
                        <option value="ALL">All Records</option>
                        <option value="PENDING">Pending Review</option>
                        <option value="DONE">Verified Records</option>
                      </select>
                      <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {error && (
                <div className="p-3 bg-red-50 text-red-600 text-xs font-bold rounded-lg border border-red-100 flex items-center gap-2">
                  <Filter className="w-4 h-4" />
                  {error}
                </div>
              )}

              <div className="flex flex-col md:flex-row gap-4 pt-8 border-t border-gray-100">
                <button
                  type="button"
                  className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-gray-100 text-gray-700 font-bold rounded-lg hover:bg-gray-200 transition-all uppercase tracking-wider text-xs active:scale-95"
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
                  Reset Filters
                </button>
                <button
                  type="submit"
                  className="flex-[2] flex items-center justify-center gap-2 px-6 py-3 bg-blue-600 text-white font-bold rounded-lg shadow-sm hover:bg-blue-700 transition-all uppercase tracking-wider text-xs group active:scale-95"
                >
                  <Search className="w-4 h-4" />
                  Apply Filters
                  <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </button>
              </div>
            </form>
          </div>
    </MainLayout>
  );
}

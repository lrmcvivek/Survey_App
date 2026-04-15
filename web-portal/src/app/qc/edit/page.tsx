"use client";
import React, { useState, useEffect } from "react";

import MainLayout from "@/components/layout/MainLayout";
import ULBSelector from "@/components/masters/ULBSelector";
import ZoneSelector from "@/components/masters/ZoneSelector";
import WardSelector from "@/components/masters/WardSelector";
import MohallaSelector from "@/components/masters/MohallaSelector";
import SurveyTypeSelector from "@/components/masters/SurveyTypeSelector";
import PropertyTypeSelector from "@/components/masters/PropertyTypeSelector";
import UserSelector from "@/components/masters/UserSelector";
import { useAuth } from "@/features/auth/AuthContext";

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

  // Reset cascading filters
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
      setError("Survey Type and ULB are required.");
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
      qcLevel: "1", // Default to Level 1 QC
    });
    
    // Open in new tab
    window.open(`/qc/edit/table?${params.toString()}`, "_blank");
  };

  return (
    <MainLayout>
      <div className="w-full">
        <div className="border rounded shadow bg-black">
          <div className="bg-sky-900 text-white text-lg font-bold px-6 py-2 rounded-t border-2 border-gray-900">
            QC Edit - Property Review
          </div>
          <form
            onSubmit={handleSubmit}
            className="p-6 grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-4 bg-black text-xs"
          >
            <SurveyTypeSelector
              value={surveyTypeId}
              onChange={setSurveyTypeId}
            />
            
            <div>
              <ULBSelector value={ulbId} onChange={setUlbId} />
            </div>
            
            <div>
              <ZoneSelector ulbId={ulbId} value={zoneId} onChange={setZoneId} />
            </div>
            
            <div>
              <WardSelector
                zoneId={zoneId}
                value={wardId}
                onChange={setWardId}
              />
            </div>
            
            <MohallaSelector
              wardId={wardId}
              value={mohallaId}
              onChange={setMohallaId}
            />
            
            <div>
              <label className="block text-gray-300 mb-1">From Date</label>
              <input
                type="date"
                className="w-full border rounded px-3 py-2 bg-gray-800 text-white"
                value={fromDate}
                onChange={(e) => setFromDate(e.target.value)}
              />
            </div>
            
            <div>
              <label className="block text-gray-300 mb-1">To Date</label>
              <input
                type="date"
                className="w-full border rounded px-3 py-2 bg-gray-800 text-white"
                value={toDate}
                onChange={(e) => setToDate(e.target.value)}
              />
            </div>
            
            <div>
              <label className="block text-gray-300 mb-1">QC Status</label>
              <select
                className="w-full border rounded px-3 py-2 bg-gray-800 text-white"
                value={qcDone}
                onChange={(e) => setQcDone(e.target.value)}
              >
                <option value="ALL">All</option>
                <option value="PENDING">Pending QC</option>
                <option value="DONE">QC Done</option>
              </select>
            </div>
            
            {error && (
              <div className="col-span-2 text-red-500 text-sm">{error}</div>
            )}
            
            <div className="col-span-2 flex gap-4 mt-4">
              <button
                type="submit"
                className="px-6 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
              >
                View Properties
              </button>
              <button
                type="button"
                className="px-6 py-2 bg-gray-600 text-white rounded hover:bg-gray-700"
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
                Reset
              </button>
            </div>
          </form>
        </div>
      </div>
    </MainLayout>
  );
}

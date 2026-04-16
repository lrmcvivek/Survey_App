"use client";
import React, { useState, useEffect } from "react";
import MainLayout from "@/components/layout/MainLayout";
import Loading from "@/components/ui/loading";
import { 
  Calendar, 
  RotateCcw, 
  ShieldCheck, 
  Plus,
  ArrowRight,
  Database,
  Search,
  ChevronRight,
  Sparkles,
  History,
  Zap,
  Activity
} from "lucide-react";

export default function AssessmentYearMasterPage() {
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setLoading(false);
    }, 800);
    return () => clearTimeout(timer);
  }, []);

  if (loading) return <Loading fullScreen />;

  return (
    <MainLayout>
      <div className="space-y-8">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-gray-200 pb-6">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
               <Calendar className="w-6 h-6 text-blue-600" />
               <h1 className="text-xl font-bold text-gray-900 tracking-tight">Assessment Year Management</h1>
            </div>
            <p className="text-gray-500 text-sm">Manage and configure assessment years for property tax calculations and record keeping.</p>
          </div>
          
          <button className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white font-bold rounded shadow hover:bg-blue-700 transition-all active:scale-95 uppercase tracking-wider text-xs">
            <Plus className="w-4 h-4" />
            Add Assessment Year
          </button>
        </div>

        {/* Assessment Year Overview */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
           <div className="bg-white border border-gray-200 p-6 rounded-lg shadow-sm flex items-center gap-6">
              <div className="w-14 h-14 bg-blue-50 rounded-lg flex items-center justify-center text-blue-600 shrink-0">
                 <History className="w-7 h-7" />
              </div>
              <div>
                 <h4 className="text-[11px] font-bold text-gray-400 uppercase tracking-wider leading-none mb-1">Active Year</h4>
                 <p className="text-xl font-bold text-gray-900">2024 - 2025</p>
              </div>
           </div>
           
           <div className="bg-white border border-gray-200 p-6 rounded-lg shadow-sm flex items-center gap-6">
              <div className="w-14 h-14 bg-emerald-50 rounded-lg flex items-center justify-center text-emerald-600 shrink-0">
                 <ShieldCheck className="w-7 h-7" />
              </div>
              <div>
                 <h4 className="text-[11px] font-bold text-gray-400 uppercase tracking-wider leading-none mb-1">Archived Records</h4>
                 <p className="text-xl font-bold text-gray-900">03 YEARS</p>
              </div>
           </div>

           <div className="bg-white border border-gray-200 p-6 rounded-lg shadow-sm flex items-center gap-6">
              <div className="w-14 h-14 bg-amber-50 rounded-lg flex items-center justify-center text-amber-600 shrink-0">
                 <RotateCcw className="w-7 h-7" />
              </div>
              <div>
                 <h4 className="text-[11px] font-bold text-gray-400 uppercase tracking-wider leading-none mb-1">Synchronization</h4>
                 <p className="text-xl font-bold text-gray-900 text-amber-600">ACTIVE</p>
              </div>
           </div>
        </div>

        {/* Assessment Year List Container */}
        <div className="bg-white border border-gray-200 rounded-lg shadow-sm overflow-hidden min-h-[400px] flex flex-col">
           <div className="p-6 border-b border-gray-100 flex items-center justify-between bg-gray-50/50">
              <div className="flex items-center gap-3">
                 <Database className="w-5 h-5 text-gray-400" />
                 <h3 className="text-sm font-bold text-gray-900 uppercase tracking-tight">Assessment Year History</h3>
              </div>
              <div className="relative">
                 <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                 <input 
                   placeholder="Search Years..." 
                   className="bg-white border border-gray-300 rounded-md pl-9 pr-4 py-1.5 text-xs text-gray-700 outline-none focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600 transition-all w-48"
                 />
              </div>
           </div>

           <div className="flex-1 flex flex-col items-center justify-center p-12 space-y-6 text-center">
              <div className="w-16 h-16 bg-gray-50 border border-gray-100 rounded-full flex items-center justify-center text-gray-200">
                 <Zap className="w-8 h-8" />
              </div>
              <div className="space-y-2">
                 <h3 className="text-lg font-bold text-gray-900 uppercase">No Assessment Years Found</h3>
                 <p className="text-gray-500 max-w-sm mx-auto text-sm leading-relaxed">
                    No assessment year records have been found in the system. Please add a new assessment year to begin tax calculation operations.
                 </p>
              </div>
              <button className="flex items-center gap-2 px-8 py-3 bg-blue-600 text-white rounded font-bold uppercase tracking-wider text-xs hover:bg-blue-700 shadow-md transition-all active:scale-95 group">
                 <Plus className="w-4 h-4" />
                 Add Assessment Year
                 <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </button>
           </div>
        </div>
      </div>
    </MainLayout>
  );
}

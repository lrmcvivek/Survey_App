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
      <div className="min-h-screen bg-[#0B0F19] p-4 md:p-8">
        <div className="max-w-[1400px] mx-auto space-y-10">
          {/* Header */}
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 border-b border-slate-800/50 pb-8">
            <div className="space-y-2">
              <div className="flex items-center gap-3">
                 <div className="w-10 h-10 bg-blue-600/10 rounded-xl flex items-center justify-center text-blue-400 font-black italic">
                    <Calendar className="w-6 h-6" />
                 </div>
                 <h1 className="text-3xl font-black text-white tracking-tight uppercase italic">Assessment <span className="text-blue-500">Timeline</span></h1>
              </div>
              <p className="text-slate-500 text-sm font-medium italic">Manage fiscal assessment cycles and chronological audit anchors</p>
            </div>
            
            <button className="flex items-center gap-2 px-6 py-4 bg-blue-600 text-white font-black rounded-2xl shadow-xl shadow-blue-900/30 hover:bg-blue-500 transition-all active:scale-95 uppercase tracking-widest text-[10px]">
              <Plus className="w-4 h-4" />
              Initialize Cycle
            </button>
          </div>

          {/* Timeline Bento */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
             <div className="bg-[#161B26] border border-slate-800 p-8 rounded-[2.5rem] flex items-center gap-6 group hover:border-blue-500/50 transition-all cursor-default relative overflow-hidden">
                <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:scale-125 transition-transform duration-700">
                   <Activity className="w-20 h-20 text-white" />
                </div>
                <div className="w-16 h-16 bg-blue-600/10 rounded-2xl flex items-center justify-center text-blue-400 shrink-0">
                   <History className="w-8 h-8" />
                </div>
                <div>
                   <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-widest leading-none mb-1 italic">Active Cycle</h4>
                   <p className="text-2xl font-black text-white italic">2024 - 2025</p>
                </div>
             </div>
             
             <div className="bg-[#161B26] border border-slate-800 p-8 rounded-[2.5rem] flex items-center gap-6 group hover:border-emerald-500/50 transition-all cursor-default relative overflow-hidden">
                <div className="w-16 h-16 bg-emerald-500/10 rounded-2xl flex items-center justify-center text-emerald-400 shrink-0">
                   <ShieldCheck className="w-8 h-8" />
                </div>
                <div>
                   <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-widest leading-none mb-1 italic">Audit Locks</h4>
                   <p className="text-2xl font-black text-white italic">03 ARCHIVED</p>
                </div>
             </div>

             <div className="bg-[#161B26] border border-slate-800 p-8 rounded-[2.5rem] flex items-center gap-6 group hover:border-amber-500/50 transition-all cursor-default relative overflow-hidden">
                <div className="w-16 h-16 bg-amber-500/10 rounded-2xl flex items-center justify-center text-amber-400 shrink-0">
                   <RotateCcw className="w-8 h-8" />
                </div>
                <div>
                   <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-widest leading-none mb-1 italic">Synchronization</h4>
                   <p className="text-2xl font-black text-white italic">REAL-TIME</p>
                </div>
             </div>
          </div>

          {/* Timeline Registry */}
          <div className="bg-[#161B26] border border-slate-800 rounded-[3rem] shadow-2xl overflow-hidden relative min-h-[500px] flex flex-col">
             <div className="p-10 border-b border-slate-800/50 flex items-center justify-between relative z-10 bg-slate-800/20">
                <div className="flex items-center gap-4">
                   <div className="w-10 h-10 bg-slate-900 rounded-xl flex items-center justify-center text-blue-400 border border-slate-800">
                      <Database className="w-5 h-5" />
                   </div>
                   <h3 className="text-lg font-black text-white italic uppercase tracking-tight">Chronological Inventory</h3>
                </div>
                <div className="relative group">
                   <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-700 group-focus-within:text-blue-400 transition-colors" />
                   <input 
                     placeholder="Filter Epochs..." 
                     className="bg-slate-900 border border-slate-800 rounded-xl pl-10 pr-4 py-2 text-[10px] font-black text-slate-400 outline-none focus:ring-4 focus:ring-blue-500/10 transition-all font-mono uppercase tracking-widest w-48"
                   />
                </div>
             </div>

             <div className="flex-1 flex flex-col items-center justify-center p-20 space-y-8 text-center relative z-10">
                <div className="relative">
                   <div className="absolute inset-0 bg-blue-500/5 blur-[80px] rounded-full animate-pulse"></div>
                   <div className="w-24 h-24 bg-slate-900 border border-slate-800 rounded-full flex items-center justify-center mx-auto text-slate-700 shadow-inner">
                      <Zap className="w-12 h-12" />
                   </div>
                </div>
                <div className="space-y-3">
                   <h3 className="text-3xl font-black text-white uppercase italic tracking-tighter">Timeline Static</h3>
                   <p className="text-slate-500 max-w-sm mx-auto font-medium italic leading-relaxed">
                      No assessment iterations have been initialized. Commencing a new cycle will activate calculation engines for the selected period.
                   </p>
                </div>
                <button className="flex items-center gap-3 px-12 py-5 bg-blue-600 text-white rounded-[2rem] font-black uppercase tracking-widest text-[10px] hover:bg-blue-500 shadow-2xl shadow-blue-900/40 transition-all active:scale-95 group">
                   <Sparkles className="w-4 h-4" />
                   Provision Cycle iteration
                   <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </button>
             </div>
          </div>
        </div>
      </div>
    </MainLayout>
  );
}

"use client";
import React, { useState, useEffect } from "react";
import MainLayout from "@/components/layout/MainLayout";
import Loading from "@/components/ui/loading";
import { 
  Percent, 
  Search, 
  MoreVertical, 
  ShieldCheck, 
  Info,
  ChevronRight,
  Plus,
  ArrowUpRight,
  TrendingUp,
  Database,
  Lock,
  Zap
} from "lucide-react";

export default function SurchargeMasterPage() {
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
                 <div className="w-10 h-10 bg-indigo-600/10 rounded-xl flex items-center justify-center text-indigo-400">
                    <TrendingUp className="w-6 h-6" />
                 </div>
                 <h1 className="text-3xl font-black text-white tracking-tight uppercase italic">Surcharge Master</h1>
              </div>
              <p className="text-slate-500 text-sm font-medium italic">Configure progressive taxation multipliers and fiscal weightage</p>
            </div>
            
            <button className="flex items-center gap-2 px-6 py-4 bg-indigo-600 text-white font-black rounded-2xl shadow-xl shadow-indigo-900/30 hover:bg-indigo-500 transition-all active:scale-95 uppercase tracking-widest text-[10px]">
              <Plus className="w-4 h-4" />
              Initialize Logic
            </button>
          </div>

          {/* Stats Bento */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
             <div className="bg-[#161B26] border border-slate-800 p-8 rounded-[2rem] space-y-4 group hover:border-indigo-500/50 transition-all">
                <div className="flex justify-between items-start">
                   <div className="w-12 h-12 bg-indigo-500/10 rounded-2xl flex items-center justify-center text-indigo-400">
                      <Percent className="w-6 h-6" />
                   </div>
                   <ArrowUpRight className="w-5 h-5 text-slate-700 group-hover:text-indigo-400 transition-colors" />
                </div>
                <div>
                   <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1 italic">Active Multipliers</h4>
                   <p className="text-3xl font-black text-white">08</p>
                </div>
             </div>
             <div className="bg-[#161B26] border border-slate-800 p-8 rounded-[2rem] space-y-4 group hover:border-emerald-500/50 transition-all">
                <div className="flex justify-between items-start">
                   <div className="w-12 h-12 bg-emerald-500/10 rounded-2xl flex items-center justify-center text-emerald-400">
                      <ShieldCheck className="w-6 h-6" />
                   </div>
                   <ArrowUpRight className="w-5 h-5 text-slate-700 group-hover:text-emerald-400 transition-colors" />
                </div>
                <div>
                   <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1 italic">Audit Integrity</h4>
                   <p className="text-3xl font-black text-white">100%</p>
                </div>
             </div>
             <div className="bg-[#161B26] border border-slate-800 p-8 rounded-[2rem] space-y-4 group hover:border-amber-500/50 transition-all">
                <div className="flex justify-between items-start">
                   <div className="w-12 h-12 bg-amber-500/10 rounded-2xl flex items-center justify-center text-amber-400">
                      <Lock className="w-6 h-6" />
                   </div>
                   <ArrowUpRight className="w-5 h-5 text-slate-700 group-hover:text-amber-400 transition-colors" />
                </div>
                <div>
                   <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1 italic">Protocol Locked</h4>
                   <p className="text-3xl font-black text-white">READY</p>
                </div>
             </div>
          </div>

          {/* Table Placeholder */}
          <div className="bg-[#161B26] border border-slate-800 rounded-[2.5rem] shadow-2xl overflow-hidden min-h-[400px] flex flex-col">
             <div className="p-8 border-b border-slate-800/50 flex items-center justify-between">
                <div className="flex items-center gap-4">
                   <div className="w-10 h-10 bg-slate-800 rounded-xl flex items-center justify-center text-indigo-400">
                      <Database className="w-5 h-5" />
                   </div>
                   <h3 className="text-lg font-black text-white italic uppercase tracking-tight">Multiplier Registry</h3>
                </div>
                <div className="relative group">
                   <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-600 group-focus-within:text-indigo-400 transition-colors" />
                   <input 
                     placeholder="Filter Logic..." 
                     className="bg-slate-900 border border-slate-800 rounded-xl pl-10 pr-4 py-2 text-xs font-bold text-slate-400 outline-none focus:ring-4 focus:ring-indigo-500/10 transition-all font-mono"
                   />
                </div>
             </div>

             <div className="flex-1 flex flex-col items-center justify-center p-20 space-y-6 text-center opacity-40">
                <div className="relative">
                   <div className="absolute inset-0 bg-indigo-500/20 blur-3xl rounded-full"></div>
                   <Zap className="w-20 h-20 text-indigo-400 relative z-10 animate-pulse" />
                </div>
                <div className="space-y-2">
                   <h3 className="text-2xl font-black text-white uppercase italic">No Surcharge Vectors</h3>
                   <p className="text-slate-500 max-w-sm mx-auto font-medium">The financial engine is awaiting surcharge parameters. Initialize a new node to begin fiscal weightage application.</p>
                </div>
                <button className="flex items-center gap-3 px-8 py-4 bg-slate-800 text-slate-400 rounded-2xl font-black uppercase tracking-[0.2em] text-[10px] hover:text-white transition-all">
                   <Plus className="w-4 h-4" />
                   Provision Vector
                </button>
             </div>
          </div>
        </div>
      </div>
    </MainLayout>
  );
}

"use client";
import React, { useState, useEffect } from "react";
import MainLayout from "@/components/layout/MainLayout";
import Loading from "@/components/ui/loading";
import { 
  History, 
  TrendingDown, 
  ShieldCheck, 
  Plus,
  ArrowDownRight,
  Database,
  Search,
  ChevronRight,
  Clock,
  Home,
  Zap,
  LayoutGrid
} from "lucide-react";

export default function BADiscountMasterPage() {
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
                 <div className="w-10 h-10 bg-amber-600/10 rounded-xl flex items-center justify-center text-amber-400 font-black italic">
                    <History className="w-6 h-6" />
                 </div>
                 <h1 className="text-3xl font-black text-white tracking-tight uppercase italic">Structural Decay <span className="text-amber-500">Discount Matrix</span></h1>
              </div>
              <p className="text-slate-500 text-sm font-medium italic">Configure progressive structure-age based valuation depreciation logic</p>
            </div>
            
            <button className="flex items-center gap-2 px-6 py-4 bg-amber-600 text-white font-black rounded-2xl shadow-xl shadow-amber-900/30 hover:bg-amber-500 transition-all active:scale-95 uppercase tracking-widest text-[10px]">
              <Plus className="w-4 h-4" />
              Initialize Decay Vector
            </button>
          </div>

          {/* Metrics Bento */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
             {[
               { icon: Clock, label: "Max Age Bracket", value: "40+ Years", color: "amber" },
               { icon: TrendingDown, label: "Peak Depreciation", value: "35%", color: "red" },
               { icon: ShieldCheck, label: "Legal Alignment", value: "VERIFIED", color: "emerald" }
             ].map((item, i) => (
               <div key={i} className="bg-[#161B26] border border-slate-800 p-8 rounded-[2.5rem] space-y-4 group hover:border-[#F59E0B]/50 transition-all cursor-default">
                  <div className={`w-12 h-12 bg-${item.color}-500/10 rounded-2xl flex items-center justify-center text-${item.color}-400`}>
                     <item.icon className="w-6 h-6" />
                  </div>
                  <div className="flex justify-between items-end">
                     <div>
                        <h4 className="text-[10px] font-black text-slate-600 uppercase tracking-widest leading-none mb-2">{item.label}</h4>
                        <p className="text-3xl font-black text-white leading-none">{item.value}</p>
                     </div>
                     <ArrowDownRight className="w-6 h-6 text-slate-800 group-hover:text-amber-400 transition-colors" />
                  </div>
               </div>
             ))}
          </div>

          {/* Logic Registry */}
          <div className="bg-[#161B26] border border-slate-800 rounded-[3rem] shadow-2xl overflow-hidden relative min-h-[500px] flex flex-col">
             {/* Background Mesh */}
             <div className="absolute inset-0 opacity-[0.02] pointer-events-none overflow-hidden">
                <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-amber-500 rounded-full blur-[120px] -mr-48 -mt-48"></div>
                <div className="grid grid-cols-12 gap-1 w-full h-full p-10 grayscale">
                   {Array.from({length: 48}).map((_, i) => (
                      <div key={i} className="aspect-square border border-white/10 rounded-lg"></div>
                   ))}
                </div>
             </div>

             <div className="p-10 border-b border-slate-800/50 flex items-center justify-between relative z-10 bg-slate-800/20">
                <div className="flex items-center gap-4">
                   <div className="w-10 h-10 bg-slate-900 rounded-xl flex items-center justify-center text-amber-400 border border-slate-800">
                      <LayoutGrid className="w-5 h-5" />
                   </div>
                   <h3 className="text-lg font-black text-white italic uppercase tracking-tight">Depreciation Schedule</h3>
                </div>
                <div className="relative group">
                   <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-700 group-focus-within:text-amber-400 transition-colors" />
                   <input 
                     placeholder="Filter Epochs..." 
                     className="bg-slate-900 border border-slate-800 rounded-xl pl-10 pr-4 py-2 text-[10px] font-black text-slate-400 outline-none focus:ring-4 focus:ring-amber-500/10 transition-all font-mono uppercase tracking-widest w-48"
                   />
                </div>
             </div>

             <div className="flex-1 flex flex-col items-center justify-center p-20 space-y-8 text-center relative z-10 transition-all group-hover:bg-amber-500/[0.01]">
                <div className="w-24 h-24 bg-amber-500/10 rounded-full flex items-center justify-center mx-auto text-amber-500/50 border border-amber-500/10 group-hover:scale-110 transition-transform duration-700 group-hover:bg-amber-500/20">
                   <Home className="w-12 h-12" />
                </div>
                <div className="space-y-3">
                   <h3 className="text-3xl font-black text-white uppercase italic tracking-tighter">Decay Matrix Offline</h3>
                   <p className="text-slate-500 max-w-sm mx-auto font-medium italic">
                      No structural age discount rules have been committed to the registry. Define the decay vectors to enable automated structural depreciation.
                   </p>
                </div>
                <button className="flex items-center gap-3 px-10 py-5 bg-amber-600 text-white rounded-[2rem] font-black uppercase tracking-widest text-[10px] hover:bg-amber-500 shadow-2xl shadow-amber-900/40 transition-all active:scale-95 group">
                   <Zap className="w-4 h-4" />
                   Provision Decay Rule
                   <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </button>
             </div>
          </div>
        </div>
      </div>
    </MainLayout>
  );
}

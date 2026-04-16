"use client";
import React, { useState, useEffect } from "react";
import MainLayout from "@/components/layout/MainLayout";
import Loading from "@/components/ui/loading";
import { 
  BarChart4, 
  MapPin, 
  ShieldCheck, 
  Plus,
  ArrowUpRight,
  Database,
  Search,
  ChevronRight,
  Navigation,
  Sparkles,
  Zap,
  Activity
} from "lucide-react";

export default function WardRateMasterPage() {
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
                    <Navigation className="w-6 h-6" />
                 </div>
                 <h1 className="text-3xl font-black text-white tracking-tight uppercase italic">Ward <span className="text-blue-500">Tariff Master</span></h1>
              </div>
              <p className="text-slate-500 text-sm font-medium italic">Configure spatial unit valuation rates and topographical pricing models</p>
            </div>
            
            <button className="flex items-center gap-2 px-6 py-4 bg-blue-600 text-white font-black rounded-2xl shadow-xl shadow-blue-900/30 hover:bg-blue-500 transition-all active:scale-95 uppercase tracking-widest text-[10px]">
              <Plus className="w-4 h-4" />
              Initialize Tariff
            </button>
          </div>

          {/* Rate Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
             {[
               { icon: MapPin, label: "Coverage Nodes", value: "256 Wards", color: "blue" },
               { icon: BarChart4, label: "Avg Rate Index", value: "₹4.50/sqft", color: "indigo" },
               { icon: Activity, label: "Live Deployment", value: "STABLE", color: "emerald" }
             ].map((item, i) => (
               <div key={i} className="bg-[#161B26] border border-slate-800 p-8 rounded-[2.5rem] space-y-4 group hover:border-blue-500/50 transition-all cursor-default">
                  <div className="flex justify-between items-start">
                     <div className={`w-12 h-12 bg-${item.color}-500/10 rounded-2xl flex items-center justify-center text-${item.color}-400`}>
                        <item.icon className="w-6 h-6" />
                     </div>
                     <ArrowUpRight className="w-5 h-5 text-slate-800 group-hover:text-blue-500 transition-colors" />
                  </div>
                  <div>
                     <h4 className="text-[10px] font-black text-slate-600 uppercase tracking-widest leading-none mb-2">{item.label}</h4>
                     <p className="text-3xl font-black text-white leading-none">{item.value}</p>
                  </div>
               </div>
             ))}
          </div>

          {/* Tariff Registry */}
          <div className="bg-[#161B26] border border-slate-800 rounded-[3rem] shadow-2xl overflow-hidden relative min-h-[500px] flex flex-col group">
             {/* Abstract Grid Mesh */}
             <div className="absolute inset-0 opacity-[0.03] pointer-events-none overflow-hidden">
                <div className="grid grid-cols-24 gap-1 w-full h-full grayscale group-hover:scale-110 transition-transform duration-1000">
                   {Array.from({length: 120}).map((_, i) => (
                      <div key={i} className="aspect-square border border-white/5 rounded-sm"></div>
                   ))}
                </div>
             </div>

             <div className="p-10 border-b border-slate-800/50 flex items-center justify-between relative z-10 bg-slate-800/20">
                <div className="flex items-center gap-4">
                   <div className="w-10 h-10 bg-slate-900 rounded-xl flex items-center justify-center text-blue-400 border border-slate-800">
                      <Database className="w-5 h-5" />
                   </div>
                   <h3 className="text-lg font-black text-white italic uppercase tracking-tight">Tariff Node Registry</h3>
                </div>
                <div className="relative group">
                   <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-700 group-focus-within:text-blue-400 transition-colors" />
                   <input 
                     placeholder="Search Nodes..." 
                     className="bg-slate-900 border border-slate-800 rounded-xl pl-10 pr-4 py-2 text-[10px] font-black text-slate-400 outline-none focus:ring-4 focus:ring-blue-500/10 transition-all font-mono uppercase tracking-widest w-48"
                   />
                </div>
             </div>

             <div className="flex-1 flex flex-col items-center justify-center p-20 space-y-8 text-center relative z-10">
                <div className="relative">
                   <div className="absolute inset-0 bg-blue-500/5 blur-[120px] rounded-full group-hover:bg-blue-500/10 transition-all duration-1000"></div>
                   <div className="w-24 h-24 bg-slate-900 border border-slate-800 rounded-full flex items-center justify-center mx-auto text-blue-500/20 group-hover:text-blue-400 transition-colors duration-500 shadow-2xl">
                      <Zap className="w-12 h-12" />
                   </div>
                </div>
                <div className="space-y-3">
                   <h3 className="text-3xl font-black text-white uppercase italic tracking-tighter">Tariff Engine Offline</h3>
                   <p className="text-slate-500 max-w-sm mx-auto font-medium italic">
                      No ward-specific valuation rates have been initialized. Commencing a provision protocol will activate regional taxation logic.
                   </p>
                </div>
                <button className="flex items-center gap-3 px-12 py-5 bg-blue-600 text-white rounded-[2rem] font-black uppercase tracking-widest text-[10px] hover:bg-blue-500 shadow-2xl shadow-blue-900/40 transition-all active:scale-95 group">
                   <Sparkles className="w-4 h-4" />
                   Provision Regional Tariff
                   <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </button>
             </div>
          </div>
        </div>
      </div>
    </MainLayout>
  );
}

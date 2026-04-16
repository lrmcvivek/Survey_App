"use client";
import React, { useState, useEffect } from "react";
import MainLayout from "@/components/layout/MainLayout";
import Loading from "@/components/ui/loading";
import { Users, ShieldCheck } from "lucide-center-react"; // Use lucide icons
import { Users as UsersIcon, ShieldCheck as ShieldIcon, Construction } from "lucide-react";

export default function VendorWardAllotmentPage() {
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setLoading(false);
    }, 500);
    return () => clearTimeout(timer);
  }, []);

  if (loading) {
    return <Loading fullScreen />;
  }

  return (
    <MainLayout>
      <div className="min-h-screen bg-[#0B0F19] p-4 md:p-8 flex flex-col items-center justify-center">
        <div className="max-w-md w-full text-center space-y-8 animate-in fade-in zoom-in duration-700">
           <div className="relative mx-auto w-32 h-32">
              <div className="absolute inset-0 bg-blue-600/20 rounded-[2.5rem] blur-2xl animate-pulse"></div>
              <div className="relative bg-[#161B26] border border-slate-800 w-full h-full rounded-[2.5rem] flex items-center justify-center text-blue-400 shadow-2xl">
                 <UsersIcon className="w-12 h-12" />
              </div>
              <div className="absolute -bottom-2 -right-2 bg-emerald-500 text-slate-950 p-2 rounded-xl shadow-lg">
                 <ShieldIcon className="w-5 h-5" />
              </div>
           </div>
           
           <div className="space-y-4">
              <h1 className="text-4xl font-black text-white tracking-tighter uppercase italic">Allocation Matrix</h1>
              <p className="text-slate-500 font-medium italic leading-relaxed">
                Vendor-to-Ward allotment algorithms are currently being recalibrated. Deployment of the allotment matrix will be available in the next sync.
              </p>
           </div>

           <div className="pt-8 flex flex-col gap-3">
              <div className="h-1 bg-slate-800 rounded-full overflow-hidden">
                 <div className="h-full bg-blue-600 w-1/2 shadow-[0_0_15px_rgba(59,130,246,0.6)] animate-pulse"></div>
              </div>
              <div className="flex justify-between text-[10px] font-black uppercase tracking-[0.2em] text-slate-600 italic">
                 <span>Calibration Phase</span>
                 <span>50% Assigned</span>
              </div>
              <div className="flex items-center gap-2 justify-center text-amber-500/50 pt-2">
                 <Construction className="w-4 h-4" />
                 <span className="text-[10px] font-black uppercase tracking-widest">Under Construction</span>
              </div>
           </div>
        </div>
      </div>
    </MainLayout>
  );
}

"use client";
import React, { useState, useEffect } from "react";
import MainLayout from "@/components/layout/MainLayout";
import Loading from "@/components/ui/loading";
import { Receipt, Construction } from "lucide-react";

export default function TaxApplicabilityPage() {
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
      <div className="min-h-screen bg-gray-50 p-6 md:p-12 flex flex-col items-center justify-center">
        <Receipt className="w-16 h-16 text-gray-300 mb-6" />
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Tax Applicability</h1>
        <p className="text-gray-500 font-medium">This module is under construction</p>
      </div>
    </MainLayout>
  );
}

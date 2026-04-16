"use client";

import React, { useState, useEffect } from "react";
import Header from "./Header";
import Sidebar from "./Sidebar";
import { useAuth } from "@/features/auth/AuthContext";

interface MainLayoutProps {
  children: React.ReactNode;
}

const MainLayout: React.FC<MainLayoutProps> = ({ children }) => {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const { user } = useAuth();

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 1024) {
        setSidebarOpen(false);
      } else {
        setSidebarOpen(true);
      }
    };
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  return (
    <div className="min-h-screen bg-[#0B0F19]">
      <Sidebar isOpen={sidebarOpen} onToggle={toggleSidebar} />

      <div
        className={`flex flex-col min-h-screen transition-all duration-300 ease-in-out ${
          sidebarOpen ? "lg:pl-[272px]" : "lg:pl-[72px] pl-0"
        }`}
      >
        <Header onMenuClick={toggleSidebar} user={user} />

        <main className="flex-grow bg-[#0B0F19]">
          <div className="max-w-8xl mx-auto overflow-hidden">
            {children}
          </div>
        </main>

        <footer className="py-6 px-8 text-center bg-[#0B0F19] border-t border-slate-800/50 text-slate-600 text-[10px] font-black uppercase tracking-[0.2em] italic">
          &copy; {new Date().getFullYear()} Property Tax Survey Management Portal // System Established
        </footer>
      </div>
    </div>
  );
};

export default MainLayout;

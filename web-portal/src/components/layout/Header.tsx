"use client";

import React, { useState } from "react";
import { useAuth, AuthUser } from "@/features/auth/AuthContext";
import { Menu, X, Bell, User as UserIcon, LogOut, ChevronDown, Monitor } from "lucide-react";

interface HeaderProps {
  onMenuClick: () => void;
  user: AuthUser | null;
}

const Header: React.FC<HeaderProps> = ({ user, onMenuClick }) => {
  const { logout } = useAuth();
  const [userMenuOpen, setUserMenuOpen] = useState(false);

  const handleLogout = () => {
    logout();
    setUserMenuOpen(false);
  };

  const getRoleDisplayName = (role: string) => {
    const roleMap: { [key: string]: string } = {
      SUPERADMIN: "Super Admin",
      ADMIN: "Administrator",
      SUPERVISOR: "Supervisor",
      SURVEYOR: "Surveyor",
    };
    return roleMap[role] || role;
  };

  return (
    <header className="sticky top-0 bg-white z-[40] border-b border-gray-200 h-16 shrink-0 shadow-sm">
      <div className="h-full px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-full">
          {/* Left side - Menu Toggle & Title */}
          <div className="flex items-center gap-4">
            <button
              id="mobile-menu-toggle"
              onClick={onMenuClick}
              className="p-2 -ml-2 text-gray-500 hover:text-gray-900 lg:hidden transition-all"
              aria-label="Toggle Menu"
            >
              <Menu className="w-6 h-6" />
            </button>
            <div className="flex items-center gap-2">
               <h1 className="text-sm md:text-lg font-bold text-gray-900 tracking-tight truncate max-w-[180px] sm:max-w-none">
                 Property Tax Management System
               </h1>
            </div>
          </div>

          {/* Right side - User menu & Tools */}
          <div className="flex items-center gap-2 md:gap-4">
            <div className="hidden sm:flex items-center gap-4 mr-2 border-r border-gray-200 pr-4">
               <button className="p-2 text-gray-400 hover:text-gray-600 transition-colors relative">
                  <Bell className="w-4 h-4" />
                  <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 bg-red-500 rounded-full"></span>
               </button>
            </div>

            {/* Profile Section */}
            <div className="relative">
              <button
                id="user-menu-button"
                onClick={() => setUserMenuOpen(!userMenuOpen)}
                className="flex items-center gap-2 p-1 rounded-lg hover:bg-gray-100 border border-transparent hover:border-gray-200 transition-all group"
              >
                <div className="w-8 h-8 rounded-md bg-blue-600 flex items-center justify-center shadow-sm shrink-0">
                  <span className="text-white text-xs font-bold uppercase">
                    {user?.name?.charAt(0) || user?.username?.charAt(0) || "U"}
                  </span>
                </div>
                <div className="hidden md:flex flex-col items-start pr-1">
                  <p className="text-xs font-semibold text-gray-900 leading-none mb-1">
                    {user?.name || user?.username}
                  </p>
                  <p className="text-[10px] font-medium text-gray-500 uppercase tracking-wide">
                    {getRoleDisplayName(user?.role || "")}
                  </p>
                </div>
                <ChevronDown className={`hidden md:block w-3 h-3 text-gray-400 transition-transform duration-300 ${userMenuOpen ? "rotate-180" : ""}`} />
              </button>

              {/* Context Menu */}
              {userMenuOpen && (
                <div className="absolute right-0 mt-2 w-56 bg-white border border-gray-200 rounded-lg shadow-xl py-1 z-50 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
                  <div className="px-4 py-3 border-b border-gray-100 bg-gray-50/50">
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-0.5">Signed in as</p>
                    <p className="text-sm font-semibold text-gray-900 truncate">
                      {user?.name || user?.username}
                    </p>
                  </div>

                  <a
                    href="/profile"
                    className="flex items-center px-4 py-2.5 text-xs font-medium text-gray-700 hover:bg-gray-50 transition-all group"
                    onClick={() => setUserMenuOpen(false)}
                  >
                    <UserIcon className="mr-3 h-4 w-4 text-gray-400 group-hover:text-blue-500" />
                    My Profile
                  </a>

                  <button
                    onClick={handleLogout}
                    className="flex w-full items-center px-4 py-2.5 text-xs font-medium text-red-600 hover:bg-red-50 transition-all group"
                  >
                    <LogOut className="mr-3 h-4 w-4" />
                    Logout
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {userMenuOpen && (
        <div className="fixed inset-0 z-40" onClick={() => setUserMenuOpen(false)} />
      )}
    </header>
  );
};

export default Header;

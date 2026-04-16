"use client";
import React, { useEffect } from "react";
import { useQuery } from "@tanstack/react-query";

interface UserSelectorProps {
  ulbId: string | null;
  zoneId: string | null;
  wardId: string | null;
  value: string | null;
  onChange: (userId: string | null) => void;
}

export default function UserSelector({
  ulbId,
  zoneId,
  wardId,
  value,
  onChange,
}: UserSelectorProps) {
  useEffect(() => {
    onChange(null);
  }, [ulbId, zoneId, wardId]);

  const { data, isLoading, error } = useQuery({
    queryKey: ["users", ulbId, zoneId, wardId],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (ulbId) params.append("ulbId", ulbId);
      if (zoneId) params.append("zoneId", zoneId);
      if (wardId) params.append("wardId", wardId);
      const res = await fetch(`/api/user?${params.toString()}`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("auth_token")}`,
        },
      });
      if (!res.ok) throw new Error("Failed to fetch users");
      return res.json();
    },
    enabled: !!ulbId,
  });

  const selectStyles = "w-full text-sm font-medium rounded-lg px-3 py-2.5 outline-none transition-all appearance-none cursor-pointer bg-white border border-gray-300 text-gray-800 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 disabled:opacity-50 disabled:cursor-not-allowed";

  return (
    <div className="space-y-1.5">
      <label className="block text-xs font-semibold uppercase tracking-wider text-gray-500 ml-0.5">
        User
      </label>
      <div className="relative">
        <select
          className={selectStyles}
          value={value || ""}
          onChange={(e) => onChange(e.target.value || null)}
          disabled={isLoading || !!error || !ulbId}
        >
          <option value="">Select User</option>
          {data &&
            data.users &&
            data.users.map((u: any) => (
              <option key={u.userId} value={u.userId}>
                {u.name || u.username}
              </option>
            ))}
        </select>
        <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400">
           <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
           </svg>
        </div>
      </div>
      {isLoading && <div className="text-xs text-gray-400 px-0.5 animate-pulse">Loading users...</div>}
      {error && <div className="text-xs text-red-500 px-0.5">Error loading users</div>}
    </div>
  );
}

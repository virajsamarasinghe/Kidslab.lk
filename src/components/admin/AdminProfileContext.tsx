"use client";

import { createContext, useContext, useState, type ReactNode } from "react";
import type { Role } from "@/lib/roles";

export interface AdminProfile {
  name: string;
  email: string;
  avatar: string;
  role: Role;
  mustChangePassword: boolean;
}

interface AdminProfileContextValue extends AdminProfile {
  setProfile: (patch: Partial<AdminProfile>) => void;
}

const AdminProfileContext = createContext<AdminProfileContextValue | null>(null);

export function AdminProfileProvider({ initial, children }: { initial: AdminProfile; children: ReactNode }) {
  const [profile, setProfileState] = useState<AdminProfile>(initial);

  function setProfile(patch: Partial<AdminProfile>) {
    setProfileState(prev => ({ ...prev, ...patch }));
  }

  return (
    <AdminProfileContext.Provider value={{ ...profile, setProfile }}>
      {children}
    </AdminProfileContext.Provider>
  );
}

export function useAdminProfile() {
  const ctx = useContext(AdminProfileContext);
  if (!ctx) throw new Error("useAdminProfile must be used within AdminProfileProvider");
  return ctx;
}

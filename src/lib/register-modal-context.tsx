"use client";

import { createContext, useContext, useState } from "react";

const RegisterModalContext = createContext<{
  open: boolean;
  setOpen: (open: boolean) => void;
}>({
  open: false,
  setOpen: () => {},
});

export function useRegisterModal() {
  const { setOpen } = useContext(RegisterModalContext);
  return { openRegisterModal: () => setOpen(true) };
}

export function useRegisterModalState() {
  return useContext(RegisterModalContext);
}

export function RegisterModalProvider({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  return (
    <RegisterModalContext.Provider value={{ open, setOpen }}>
      {children}
    </RegisterModalContext.Provider>
  );
}

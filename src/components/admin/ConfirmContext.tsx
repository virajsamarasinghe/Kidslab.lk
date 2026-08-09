"use client";

import { createContext, useCallback, useContext, useRef, useState, type ReactNode } from "react";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel,
  AlertDialogContent, AlertDialogDescription, AlertDialogFooter,
  AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";

export interface ConfirmOptions {
  title: string;
  description?: string;
  /** Label on the confirming button. Defaults to "Confirm". */
  confirmLabel?: string;
  cancelLabel?: string;
  /** Renders the confirm button in red — use for deletes and access removal. */
  destructive?: boolean;
}

type ConfirmFn = (options: ConfirmOptions) => Promise<boolean>;

const ConfirmContext = createContext<ConfirmFn | null>(null);

/**
 * One shared confirmation dialog for the whole admin shell.
 *
 * Callers `await confirm({...})` and get a boolean, which reads like the native
 * `window.confirm` but renders in the dashboard's own styling. Mounting a
 * single dialog here (rather than one per page) keeps every prompt identical
 * and avoids each page wiring up its own open/target state.
 */
export function ConfirmProvider({ children }: { children: ReactNode }) {
  const [options, setOptions] = useState<ConfirmOptions | null>(null);
  // Held across renders so the dialog's buttons can settle the promise the
  // caller is awaiting.
  const resolverRef = useRef<((value: boolean) => void) | null>(null);

  const confirm = useCallback<ConfirmFn>(opts => {
    setOptions(opts);
    return new Promise<boolean>(resolve => {
      resolverRef.current = resolve;
    });
  }, []);

  function settle(result: boolean) {
    resolverRef.current?.(result);
    resolverRef.current = null;
    setOptions(null);
  }

  return (
    <ConfirmContext.Provider value={confirm}>
      {children}
      <AlertDialog
        open={options !== null}
        // Covers dismissal by Escape or backdrop click, which must resolve
        // false rather than leaving the caller awaiting forever.
        onOpenChange={open => { if (!open) settle(false); }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{options?.title}</AlertDialogTitle>
            {options?.description && (
              <AlertDialogDescription>{options.description}</AlertDialogDescription>
            )}
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => settle(false)}>
              {options?.cancelLabel ?? "Cancel"}
            </AlertDialogCancel>
            <AlertDialogAction
              className={
                options?.destructive
                  ? "bg-red-600 hover:bg-red-700 text-white"
                  : "btn-brand-navy text-white"
              }
              onClick={() => settle(true)}
            >
              {options?.confirmLabel ?? "Confirm"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </ConfirmContext.Provider>
  );
}

export function useConfirm() {
  const ctx = useContext(ConfirmContext);
  if (!ctx) throw new Error("useConfirm must be used within ConfirmProvider");
  return ctx;
}

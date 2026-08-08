"use client";

import { useEffect } from "react";
import { AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

export default function AdminError({
  error,
  unstable_retry,
}: {
  error: Error & { digest?: string };
  unstable_retry: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="p-8 flex items-center justify-center">
      <Card className="pcb-card border-slate-100 shadow-sm max-w-md w-full p-8 flex flex-col items-center text-center gap-3">
        <AlertTriangle className="w-8 h-8 text-red-500" />
        <h2 className="text-lg font-semibold text-slate-900">Something went wrong</h2>
        <p className="text-sm text-slate-500">
          This page hit an unexpected error. Try again, or head back to the dashboard.
        </p>
        <div className="flex gap-3 mt-2">
          <Button variant="outline" onClick={() => { window.location.href = "/admin"; }}>
            Back to dashboard
          </Button>
          <Button className="btn-brand-navy text-white" onClick={() => unstable_retry()}>
            Try again
          </Button>
        </div>
      </Card>
    </div>
  );
}

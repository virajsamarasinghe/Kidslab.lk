import { Card, CardContent } from "@/components/ui/card";

export default function CrmRowSkeleton() {
  return (
    <>
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-5 mb-6">
        <Card className="pcb-card border-slate-100 shadow-sm xl:col-span-2">
          <CardContent className="py-5 space-y-3">
            {Array.from({ length: 5 }, (_, i) => (
              <div key={i}>
                <div className="h-3 w-28 rounded bg-slate-100 animate-pulse mb-1.5" />
                <div className="h-2 w-full rounded-full bg-slate-100 animate-pulse" />
              </div>
            ))}
          </CardContent>
        </Card>
        <Card className="pcb-card border-slate-100 shadow-sm">
          <CardContent className="py-5 space-y-3">
            {Array.from({ length: 4 }, (_, i) => (
              <div key={i} className="h-9 rounded bg-slate-100 animate-pulse" />
            ))}
          </CardContent>
        </Card>
      </div>
      <Card className="pcb-card border-slate-100 shadow-sm">
        <CardContent className="py-5 space-y-3">
          {Array.from({ length: 5 }, (_, i) => (
            <div key={i} className="h-8 rounded bg-slate-100 animate-pulse" />
          ))}
        </CardContent>
      </Card>
    </>
  );
}

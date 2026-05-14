import { Loader2 } from "lucide-react";

export default function CustomerLoading() {
  return (
    <div className="min-h-screen bg-dash-bg flex items-center justify-center px-4">
      <div className="flex flex-col items-center justify-center gap-4 text-center">
        <div className="w-16 h-16 rounded-2xl bg-white shadow-soft flex items-center justify-center border border-gray-100">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
        <div className="space-y-1">
          <p className="text-sm font-black uppercase tracking-widest text-gray-700">
            Loading
          </p>
          <p className="text-xs text-gray-400 font-medium">
            Bringing you back to your dashboard...
          </p>
        </div>
      </div>
    </div>
  );
}

import { Loader2 } from "lucide-react";

export default function CustomerLoading() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] gap-3">
      <Loader2 className="w-10 h-10 animate-spin text-primary" />
      <p className="text-sm font-bold text-gray-400 uppercase tracking-widest">Retrieving your feast...</p>
    </div>
  );
}

"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { MapPin, ArrowRight } from "lucide-react";
import { RestaurantLocation } from "@/types/restaurant";

const locations: RestaurantLocation[] = ["Newcastle", "Downpatrick", "Kilkeel"];

export default function Home() {
  const router = useRouter();
  const [selectedLocation, setSelectedLocation] = useState<string | null>(null);

  useEffect(() => {
    const savedLocation = localStorage.getItem("selectedLocation");
    if (savedLocation) {
      setSelectedLocation(savedLocation);
    }
  }, []);

  const handleLocationSelect = (location: RestaurantLocation) => {
    localStorage.setItem("selectedLocation", location);
    setSelectedLocation(location);
    router.push(`/restaurants?location=${encodeURIComponent(location)}`);
  };

  return (
    <main className="min-h-screen flex flex-col items-center justify-center bg-[#f8fafc] p-4">
      <div className="max-w-2xl w-full text-center space-y-12">
        <div className="space-y-6">
          <div className="flex justify-center">
            <div className="p-6 bg-orange-100 rounded-[2.5rem] shadow-sm animate-bounce-slow">
              <MapPin className="h-16 w-16 text-orange-600" />
            </div>
          </div>
          <div className="space-y-4">
            <h1 className="text-5xl md:text-7xl font-black tracking-tight text-slate-900">
              Your <span className="text-orange-600 underline decoration-orange-200 underline-offset-8">Local</span> Food Hub
            </h1>
            <p className="text-xl text-slate-500 font-bold max-w-lg mx-auto leading-relaxed">
              Serving the best flavors across Newcastle, Downpatrick, and Kilkeel.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {locations.map((location) => (
            <button
              key={location}
              onClick={() => handleLocationSelect(location)}
              className="group relative flex flex-col items-center p-8 bg-white rounded-[3rem] shadow-xl hover:shadow-2xl hover:scale-105 transition-all duration-500 border-none overflow-hidden cursor-pointer"
            >
              <div className="absolute inset-0 bg-gradient-to-br from-orange-500/0 to-orange-500/5 group-hover:from-orange-500/5 transition-all"></div>
              <div className="w-16 h-16 bg-slate-50 rounded-2xl flex items-center justify-center mb-6 group-hover:bg-orange-600 group-hover:text-white transition-colors duration-500 shadow-sm">
                <MapPin className="h-8 w-8" />
              </div>
              <span className="text-2xl font-black text-slate-900 tracking-tight mb-2">{location}</span>
              <p className="text-xs text-slate-400 font-black uppercase tracking-widest flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                Explore <ArrowRight className="w-3 h-3" />
              </p>
            </button>
          ))}
        </div>

        {selectedLocation && (
          <div className="pt-8">
            <div className="inline-flex items-center gap-3 bg-white px-6 py-3 rounded-2xl shadow-sm border border-slate-100">
              <div className="w-3 h-3 rounded-full bg-green-500 animate-pulse" />
              <p className="text-sm font-black text-slate-400 uppercase tracking-tighter">
                Last seen in <span className="text-slate-900">{selectedLocation}</span>
              </p>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}

"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useSite } from "@/context/SiteContext";
import { Home, ArrowRight, SearchX } from "lucide-react";

const COUNTDOWN = 5;

export default function NotFound() {
  const { site } = useSite();
  const router = useRouter();
  const [seconds, setSeconds] = useState(COUNTDOWN);

  useEffect(() => {
    if (seconds <= 0) {
      router.push("/");
      return;
    }
    const t = setTimeout(() => setSeconds((s) => s - 1), 1000);
    return () => clearTimeout(t);
  }, [seconds, router]);

  const { gradientFrom, gradientVia, gradientTo, accent } = site.theme;

  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center px-4 theme-transition"
      style={{
        background: `linear-gradient(135deg, ${gradientFrom} 0%, ${gradientVia} 55%, ${gradientTo} 100%)`,
      }}
    >
      {/* Decorative blobs */}
      <div
        className="fixed top-[-15%] right-[-15%] w-[450px] h-[450px] rounded-full opacity-15 blur-3xl pointer-events-none"
        style={{ background: gradientTo }}
      />
      <div
        className="fixed bottom-[-15%] left-[-15%] w-[380px] h-[380px] rounded-full opacity-15 blur-3xl pointer-events-none"
        style={{ background: gradientFrom }}
      />

      <div className="relative z-10 text-center max-w-md w-full">
        {/* Icon */}
        <div className="flex justify-center mb-6">
          <div className="w-24 h-24 rounded-3xl bg-white/20 backdrop-blur-sm border border-white/30 flex items-center justify-center shadow-xl">
            <SearchX className="w-12 h-12 text-white" strokeWidth={1.5} />
          </div>
        </div>

        {/* 404 */}
        <p className="font-heading font-black text-white/30 text-8xl sm:text-9xl leading-none mb-2 select-none">
          404
        </p>

        <h1 className="font-heading font-black text-white text-2xl sm:text-3xl mb-3 -mt-2">
          Page not found
        </h1>
        <p className="text-white/70 text-sm sm:text-base leading-relaxed mb-8">
          Looks like this page took a wrong turn. The URL you entered doesn&apos;t exist on{" "}
          <span className="font-semibold text-white">{site.name}</span>.
        </p>

        {/* Card */}
        <div
          className="rounded-3xl shadow-2xl px-6 py-6 mb-6 border"
          style={{
            background: "rgba(255,255,255,0.12)",
            backdropFilter: "blur(16px)",
            borderColor: "rgba(255,255,255,0.25)",
          }}
        >
          {/* Countdown ring */}
          <div className="flex items-center justify-center mb-4">
            <div className="relative w-16 h-16">
              <svg className="w-16 h-16 -rotate-90" viewBox="0 0 64 64">
                <circle
                  cx="32" cy="32" r="28"
                  fill="none"
                  stroke="rgba(255,255,255,0.2)"
                  strokeWidth="5"
                />
                <circle
                  cx="32" cy="32" r="28"
                  fill="none"
                  stroke="white"
                  strokeWidth="5"
                  strokeLinecap="round"
                  strokeDasharray={`${2 * Math.PI * 28}`}
                  strokeDashoffset={`${2 * Math.PI * 28 * (1 - seconds / COUNTDOWN)}`}
                  style={{ transition: "stroke-dashoffset 1s linear" }}
                />
              </svg>
              <span className="absolute inset-0 flex items-center justify-center font-heading font-black text-xl text-white">
                {seconds}
              </span>
            </div>
          </div>

          <p className="text-white/70 text-sm mb-5">
            Redirecting you to the homepage in{" "}
            <span className="font-semibold text-white">{seconds}s</span>…
          </p>

          <button
            onClick={() => router.push("/")}
            className="w-full h-12 rounded-2xl font-bold text-sm flex items-center justify-center gap-2 transition-all hover:opacity-90 active:scale-[0.98] shadow-md"
            style={{
              background: `linear-gradient(135deg, ${accent}, ${gradientTo})`,
              color: "#fff",
            }}
          >
            <Home className="w-4 h-4" />
            Go to Homepage Now
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}

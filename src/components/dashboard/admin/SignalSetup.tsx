"use client";

import { useState, useEffect, useCallback } from "react";
import { MessageSquare, RefreshCw, CheckCircle, XCircle, Loader2, QrCode, Phone } from "lucide-react";
import { toast } from "sonner";

type Mode = "qr" | "phone";

export default function SignalSetup() {
  const [mode, setMode] = useState<Mode>("qr");
  const [status, setStatus] = useState<{ configured: boolean; reachable?: boolean; accounts: string[] } | null>(null);
  const [loadingStatus, setLoadingStatus] = useState(true);
  const [qrUrl, setQrUrl] = useState<string | null>(null);
  const [loadingQr, setLoadingQr] = useState(false);
  const [phoneNumber, setPhoneNumber] = useState("");
  const [connecting, setConnecting] = useState(false);

  const fetchStatus = useCallback(async () => {
    setLoadingStatus(true);
    try {
      const res = await fetch("/api/signal/status");
      const json = await res.json();
      setStatus(json.data || json);
    } catch {
      setStatus({ configured: false, accounts: [] });
    } finally {
      setLoadingStatus(false);
    }
  }, []);

  useEffect(() => {
    fetchStatus();
  }, [fetchStatus]);

  const loadQr = async () => {
    setLoadingQr(true);
    setQrUrl(null);
    try {
      // Fetch QR as blob and create an object URL
      const res = await fetch("/api/signal/qr?deviceName=FoodDelivery");
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        toast.error((err as any).error || "Failed to load QR code.");
        return;
      }
      const blob = await res.blob();
      setQrUrl(URL.createObjectURL(blob));
    } catch {
      toast.error("Could not reach Signal CLI. Is it running?");
    } finally {
      setLoadingQr(false);
    }
  };

  const handleConnect = async () => {
    if (!phoneNumber.trim()) {
      toast.error("Enter a phone number.");
      return;
    }
    setConnecting(true);
    try {
      const res = await fetch("/api/signal/connect", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phoneNumber: phoneNumber.trim() }),
      });
      const json = await res.json();
      if (!res.ok) {
        toast.error((json as any).error || "Connection failed.");
      } else {
        toast.success((json.data as any)?.message || "Registration started.");
        fetchStatus();
      }
    } catch {
      toast.error("Network error — is Signal CLI running?");
    } finally {
      setConnecting(false);
    }
  };

  const isLinked = (status?.accounts?.length ?? 0) > 0;

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-3.5 border-b border-gray-100">
        <div className="flex items-center gap-2">
          <MessageSquare className="w-4 h-4 text-gray-500" />
          <h2 className="text-sm font-semibold text-gray-900">Signal Notifications</h2>
        </div>
        <button
          onClick={fetchStatus}
          disabled={loadingStatus}
          className="p-1.5 rounded-lg hover:bg-gray-50 transition-colors"
          title="Refresh status"
        >
          <RefreshCw className={`w-3.5 h-3.5 text-gray-400 ${loadingStatus ? "animate-spin" : ""}`} />
        </button>
      </div>

      <div className="p-5 space-y-5">
        {/* Status */}
        {loadingStatus ? (
          <div className="flex items-center gap-2 text-sm text-gray-400">
            <Loader2 className="w-4 h-4 animate-spin" /> Checking status…
          </div>
        ) : (
          <div className="flex items-center gap-2.5">
            {!status?.configured ? (
              <>
                <XCircle className="w-4 h-4 text-gray-300" />
                <span className="text-sm text-gray-400">SIGNAL_CLI_API_URL not set in .env</span>
              </>
            ) : !status.reachable ? (
              <>
                <XCircle className="w-4 h-4 text-red-400" />
                <span className="text-sm text-red-500">Signal CLI unreachable — is it running on port 8080?</span>
              </>
            ) : isLinked ? (
              <>
                <CheckCircle className="w-4 h-4 text-emerald-500" />
                <span className="text-sm text-emerald-600 font-medium">
                  Linked: {status.accounts.join(", ")}
                </span>
              </>
            ) : (
              <>
                <XCircle className="w-4 h-4 text-amber-400" />
                <span className="text-sm text-amber-600">No account linked yet</span>
              </>
            )}
          </div>
        )}

        {/* Mode switcher */}
        <div className="flex items-center gap-1 p-1 bg-gray-50 rounded-xl w-fit border border-gray-100">
          <button
            onClick={() => setMode("qr")}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              mode === "qr" ? "bg-white text-gray-900 shadow-sm" : "text-gray-400 hover:text-gray-600"
            }`}
          >
            <QrCode className="w-3.5 h-3.5" /> QR Code
          </button>
          <button
            onClick={() => setMode("phone")}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              mode === "phone" ? "bg-white text-gray-900 shadow-sm" : "text-gray-400 hover:text-gray-600"
            }`}
          >
            <Phone className="w-3.5 h-3.5" /> Phone Number
          </button>
        </div>

        {/* QR Code panel */}
        {mode === "qr" && (
          <div className="space-y-3">
            <p className="text-xs text-gray-500">
              Open Signal on your phone → <strong>Settings → Linked Devices → Link New Device</strong>, then scan this QR code.
            </p>
            {qrUrl ? (
              <div className="space-y-3">
                <img
                  src={qrUrl}
                  alt="Signal Link QR Code"
                  className="w-52 h-52 rounded-2xl border border-gray-100 shadow-sm"
                />
                <button
                  onClick={loadQr}
                  className="flex items-center gap-1.5 text-xs font-semibold text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <RefreshCw className="w-3 h-3" /> Regenerate
                </button>
              </div>
            ) : (
              <button
                onClick={loadQr}
                disabled={loadingQr || !status?.reachable}
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gray-900 text-white text-xs font-bold uppercase tracking-widest hover:bg-gray-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loadingQr ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <QrCode className="w-3.5 h-3.5" />
                )}
                {loadingQr ? "Loading…" : "Show QR Code"}
              </button>
            )}
          </div>
        )}

        {/* Phone number panel */}
        {mode === "phone" && (
          <div className="space-y-3">
            <p className="text-xs text-gray-500">
              Register a new Signal number. You'll receive an SMS verification code on that number.
            </p>
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-2 flex-1 px-3 py-2.5 rounded-xl border border-gray-200 bg-gray-50">
                <Phone className="w-4 h-4 text-gray-400 shrink-0" />
                <input
                  type="tel"
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value)}
                  placeholder="+44 7911 123456"
                  className="flex-1 text-sm bg-transparent outline-none"
                />
              </div>
              <button
                onClick={handleConnect}
                disabled={connecting || !status?.reachable}
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gray-900 text-white text-xs font-bold uppercase tracking-widest hover:bg-gray-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap"
              >
                {connecting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : null}
                {connecting ? "Connecting…" : "Register"}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

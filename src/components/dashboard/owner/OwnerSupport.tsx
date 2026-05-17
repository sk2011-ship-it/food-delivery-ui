"use client";

import { useState } from "react";
import { Send } from "lucide-react";
import PageHeader from "@/components/dashboard/shared/PageHeader";
import { toast } from "sonner";

export default function OwnerSupport() {
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!subject.trim()) {
      toast.error("Please enter a subject.");
      return;
    }
    if (message.trim().length < 10) {
      toast.error("Message must be at least 10 characters.");
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch("/api/owner/support", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ subject: subject.trim(), message: message.trim() }),
      });

      const json = await res.json();

      if (!res.ok) {
        throw new Error(json.error ?? "Failed to submit support request.");
      }

      toast.success("Support request sent! We will get back to you soon.");
      setSubject("");
      setMessage("");
    } catch (err: any) {
      console.error("[OwnerSupport] Submit error:", err);
      toast.error(err.message ?? "Something went wrong. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div>
      <PageHeader
        title="Contact Support"
        subtitle="Have a question or issue? Send us a message and we'll get back to you."
      />

      <div className="max-w-2xl">
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-100">
            <p className="text-sm text-gray-600">
              Our support team typically responds within one business day.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="p-6 space-y-5">
            {/* Subject */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-gray-600" htmlFor="support-subject">
                Subject
              </label>
              <input
                id="support-subject"
                type="text"
                placeholder="e.g. Issue with menu items not showing"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                maxLength={200}
                required
                className="w-full h-10 px-3 rounded-xl border border-gray-200 text-sm outline-none focus:border-gray-400 bg-white"
              />
            </div>

            {/* Message */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-gray-600" htmlFor="support-message">
                Message
              </label>
              <textarea
                id="support-message"
                placeholder="Describe your issue or question in as much detail as possible..."
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                maxLength={5000}
                rows={7}
                required
                className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm outline-none focus:border-gray-400 bg-white resize-none"
              />
              <p className="text-xs text-gray-400 text-right">{message.length} / 5000</p>
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={submitting}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gray-900 text-white text-sm font-semibold hover:bg-gray-700 transition-colors disabled:opacity-60"
            >
              {submitting ? (
                <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
              ) : (
                <Send className="w-4 h-4" />
              )}
              {submitting ? "Sending..." : "Send Message"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

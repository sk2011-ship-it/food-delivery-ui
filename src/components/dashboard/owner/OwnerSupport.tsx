"use client";

import { useEffect, useMemo, useState } from "react";
import { Send, MessageSquare, Clock, Phone, Mail, HelpCircle, ChevronRight, MapPin, Inbox } from "lucide-react";
import PageHeader from "@/components/dashboard/shared/PageHeader";
import { toast } from "sonner";

type SupportMessage = { id: string; sender: "OWNER" | "ADMIN"; senderName: string; message: string; createdAt: string };
type SupportTicket = { id: string; subject: string; status: "PENDING" | "ANSWERED" | "CLOSED"; updatedAt: string; messages: SupportMessage[] };

const FAQ = [
  { q: "How do I update my menu?", a: "Go to Restaurants → select your restaurant → Menu tab." },
  { q: "How do I change my opening hours?", a: "Go to Restaurants → select your restaurant → Settings tab." },
  { q: "When do I get paid?", a: "Settlements are processed weekly. View the Reports page for details." },
  { q: "How do I cancel an order?", a: "Open the live order card and tap Decline or Cancel." },
];

interface Props { location: string | null; }

export default function OwnerSupport({ location }: Props) {
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [openFaq, setOpenFaq] = useState<number | null>(null);
  const [tickets, setTickets] = useState<SupportTicket[]>([]);
  const [loadingTickets, setLoadingTickets] = useState(true);

  const contact = useMemo(() => getLocationContact(location), [location]);

  useEffect(() => {
    fetch("/api/owner/support")
      .then((r) => r.json())
      .then((d) => setTickets(d.data?.tickets ?? []))
      .catch(() => toast.error("Failed to load support history."))
      .finally(() => setLoadingTickets(false));
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!subject.trim()) return toast.error("Please enter a subject.");
    if (message.trim().length < 10) return toast.error("Message must be at least 10 characters.");

    setSubmitting(true);
    try {
      const res = await fetch("/api/owner/support", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ subject: subject.trim(), message: message.trim() }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "Failed to submit support request.");
      toast.success("Support request sent!");
      setSubject("");
      setMessage("");
      const refreshed = await fetch("/api/owner/support").then((r) => r.json());
      setTickets(refreshed.data?.tickets ?? []);
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Something went wrong. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="h-full flex flex-col">
      <PageHeader title="Contact Support" subtitle="Send a message and track admin replies in one place." />
      <div className="flex-1 grid grid-cols-1 lg:grid-cols-3 gap-6 mt-2">
        <div className="lg:col-span-2 flex flex-col gap-6">
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm flex flex-col overflow-hidden">
            <div className="flex items-center gap-3 px-6 py-4 border-b border-gray-100 bg-gray-50/60">
              <div className="w-9 h-9 rounded-xl bg-gray-900 flex items-center justify-center shrink-0">
                <MessageSquare className="w-4 h-4 text-white" />
              </div>
              <div>
                <p className="text-sm font-semibold text-gray-900">Send a Message</p>
                <p className="text-xs text-gray-500">Admins will see this as a pending support request</p>
              </div>
            </div>
            <form onSubmit={handleSubmit} className="flex flex-col flex-1 p-6 gap-5">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-gray-600 uppercase tracking-wide" htmlFor="support-subject">Subject</label>
                <input id="support-subject" type="text" value={subject} onChange={(e) => setSubject(e.target.value)} maxLength={200} required className="w-full h-11 px-4 rounded-xl border border-gray-200 text-sm outline-none focus:border-gray-900 focus:ring-2 focus:ring-gray-900/10 bg-white transition-all" />
              </div>
              <div className="space-y-1.5 flex-1 flex flex-col">
                <label className="text-xs font-semibold text-gray-600 uppercase tracking-wide" htmlFor="support-message">Message</label>
                <textarea id="support-message" value={message} onChange={(e) => setMessage(e.target.value)} maxLength={5000} required className="w-full flex-1 min-h-[180px] px-4 py-3 rounded-xl border border-gray-200 text-sm outline-none focus:border-gray-900 focus:ring-2 focus:ring-gray-900/10 bg-white resize-none transition-all" />
              </div>
              <button type="submit" disabled={submitting} className="self-start flex items-center gap-2 px-6 py-3 rounded-xl bg-gray-900 text-white text-sm font-semibold hover:bg-gray-700 active:scale-95 transition-all disabled:opacity-60">
                {submitting ? <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" /> : <Send className="w-4 h-4" />}
                {submitting ? "Sending..." : "Send Message"}
              </button>
            </form>
          </div>

          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="flex items-center gap-3 px-6 py-4 border-b border-gray-100">
              <div className="w-9 h-9 rounded-xl bg-blue-50 flex items-center justify-center shrink-0">
                <Inbox className="w-4 h-4 text-blue-600" />
              </div>
              <div>
                <p className="text-sm font-semibold text-gray-900">Support History</p>
                <p className="text-xs text-gray-500">Pending and answered messages appear here</p>
              </div>
            </div>
            <div className="p-5 space-y-4">
              {loadingTickets ? <p className="text-sm text-gray-500">Loading support history...</p> : tickets.length === 0 ? (
                <p className="text-sm text-gray-500">No support requests yet.</p>
              ) : tickets.map((ticket) => (
                <div key={ticket.id} className="rounded-xl border border-gray-100 p-4">
                  <div className="flex items-center justify-between gap-3 mb-3">
                    <div>
                      <p className="text-sm font-semibold text-gray-900">{ticket.subject}</p>
                      <p className="text-xs text-gray-500">Status: {ticket.status.toLowerCase()}</p>
                    </div>
                    <span className={`text-[11px] font-semibold px-2.5 py-1 rounded-full ${ticket.status === "ANSWERED" ? "bg-green-50 text-green-700" : "bg-amber-50 text-amber-700"}`}>{ticket.status === "ANSWERED" ? "Answered by admin" : "Pending"}</span>
                  </div>
                  <div className="space-y-2">
                    {ticket.messages.slice().reverse().map((msg) => (
                      <div key={msg.id} className={`rounded-lg px-3 py-2 text-sm ${msg.sender === "ADMIN" ? "bg-blue-50 text-blue-900" : "bg-gray-50 text-gray-800"}`}>
                        <div className="text-[11px] uppercase tracking-wide font-semibold mb-1">{msg.sender === "ADMIN" ? `Admin reply by ${msg.senderName}` : "Your message"}</div>
                        <p className="whitespace-pre-wrap">{msg.message}</p>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-5">
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="flex items-center gap-3 px-5 py-4 border-b border-gray-100 bg-gray-50/60">
              <div className="w-9 h-9 rounded-xl bg-blue-50 flex items-center justify-center shrink-0">
                <MapPin className="w-4 h-4 text-blue-600" />
              </div>
              <div>
                <p className="text-sm font-semibold text-gray-900">{contact.area} Support Team</p>
                <p className="text-xs text-gray-400">Your local point of contact</p>
              </div>
            </div>
            <div className="p-5 space-y-4">
              <a href={`tel:${contact.phone.replace(/\s/g, "")}`} className="flex items-center gap-3 group">
                <div className="w-8 h-8 rounded-lg bg-green-50 flex items-center justify-center shrink-0">
                  <Phone className="w-3.5 h-3.5 text-green-600" />
                </div>
                <div>
                  <p className="text-[10px] text-gray-400 font-semibold uppercase tracking-wide">Phone</p>
                  <p className="text-sm font-semibold text-gray-900 group-hover:text-blue-600 transition-colors">{contact.phone}</p>
                </div>
              </a>
              <a href={`mailto:${contact.email}`} className="flex items-center gap-3 group">
                <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center shrink-0">
                  <Mail className="w-3.5 h-3.5 text-blue-600" />
                </div>
                <div>
                  <p className="text-[10px] text-gray-400 font-semibold uppercase tracking-wide">Email</p>
                  <p className="text-sm font-semibold text-gray-900 group-hover:text-blue-600 transition-colors break-all">{contact.email}</p>
                </div>
              </a>
              {contact.whatsapp && (
                <a href={`https://wa.me/${contact.whatsapp.replace(/\D/g, "")}`} target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 group">
                  <div className="w-8 h-8 rounded-lg bg-green-50 flex items-center justify-center shrink-0">
                    <MessageSquare className="w-3.5 h-3.5 text-green-600" />
                  </div>
                  <div>
                    <p className="text-[10px] text-gray-400 font-semibold uppercase tracking-wide">WhatsApp</p>
                    <p className="text-sm font-semibold text-gray-900 group-hover:text-green-600 transition-colors">{contact.whatsapp}</p>
                  </div>
                </a>
              )}
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-9 h-9 rounded-xl bg-amber-50 flex items-center justify-center shrink-0">
                <Clock className="w-4 h-4 text-amber-600" />
              </div>
              <p className="text-sm font-semibold text-gray-900">Response Times</p>
            </div>
            <div className="space-y-2.5">
              {[
                { label: "General queries", value: "Within 24 hrs" },
                { label: "Urgent issues", value: "Within 4 hrs" },
                { label: "Support hours", value: contact.hours },
              ].map((row) => (
                <div key={row.label} className="flex justify-between text-xs">
                  <span className="text-gray-500">{row.label}</span>
                  <span className="font-semibold text-gray-900">{row.value}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="flex items-center gap-3 px-5 py-4 border-b border-gray-100">
              <div className="w-9 h-9 rounded-xl bg-green-50 flex items-center justify-center shrink-0">
                <HelpCircle className="w-4 h-4 text-green-600" />
              </div>
              <p className="text-sm font-semibold text-gray-900">Quick Answers</p>
            </div>
            <div className="divide-y divide-gray-50">
              {FAQ.map((item, idx) => (
                <button key={idx} type="button" onClick={() => setOpenFaq(openFaq === idx ? null : idx)} className="w-full text-left px-5 py-3.5 hover:bg-gray-50 transition-colors">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xs font-semibold text-gray-800">{item.q}</span>
                    <ChevronRight className={`w-3.5 h-3.5 text-gray-400 shrink-0 transition-transform ${openFaq === idx ? "rotate-90" : ""}`} />
                  </div>
                  {openFaq === idx && <p className="text-xs text-gray-500 mt-2 leading-relaxed">{item.a}</p>}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function getLocationContact(location: string | null) {
  const loc = (location ?? "").toLowerCase();
  if (loc.includes("newcastle")) return { area: "Newcastle", phone: "+44 28 4372 0000", email: "newcastle@kilkeeleats.com", hours: "Mon–Sat, 9am–6pm", whatsapp: "+44 7700 900 200" };
  if (loc.includes("downpatrick")) return { area: "Downpatrick", phone: "+44 28 4461 0000", email: "downpatrick@kilkeeleats.com", hours: "Mon–Sat, 9am–6pm", whatsapp: "+44 7700 900 300" };
  return { area: "Kilkeel", phone: "+44 28 4176 0000", email: "support@kilkeeleats.com", hours: "Mon–Sat, 9am–6pm", whatsapp: "+44 7700 900 100" };
}

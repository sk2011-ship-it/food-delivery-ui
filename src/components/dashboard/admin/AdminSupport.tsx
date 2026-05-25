"use client";

import { useEffect, useState } from "react";
import { Inbox, Reply } from "lucide-react";
import PageHeader from "@/components/dashboard/shared/PageHeader";
import { toast } from "sonner";
import { useAuthStore } from "@/store/useAuthStore";

type Ticket = { id: string; subject: string; status: "PENDING" | "ANSWERED" | "CLOSED"; ownerId: string; updatedAt: string };
type Message = { id: string; ticketId: string; sender: "OWNER" | "ADMIN"; senderName: string; message: string; createdAt: string };

export default function AdminSupport() {
  const { session } = useAuthStore();
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [reply, setReply] = useState("");
  const [selectedTicketId, setSelectedTicketId] = useState<string | null>(null);

  const load = async () => {
    const res = await fetch("/api/admin/support", { headers: { Authorization: `Bearer ${session?.access_token}` } });
    const json = await res.json();
    setTickets(json.data?.tickets ?? []);
    setMessages(json.data?.messages ?? []);
    setSelectedTicketId((prev) => prev ?? json.data?.tickets?.[0]?.id ?? null);
  };

  // eslint-disable-next-line react-hooks/set-state-in-effect, react-hooks/exhaustive-deps
  useEffect(() => { load().catch(() => toast.error("Failed to load support inbox.")); }, [session?.access_token]);

  const sendReply = async () => {
    if (!selectedTicketId || !reply.trim()) return;
    const res = await fetch("/api/admin/support", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${session?.access_token}` },
      body: JSON.stringify({ ticketId: selectedTicketId, message: reply.trim() }),
    });
    if (!res.ok) {
      toast.error("Failed to send reply.");
      return;
    }
    toast.success("Reply sent to owner.");
    setReply("");
    await load();
  };

  const activeMessages = messages.filter((m) => m.ticketId === selectedTicketId).sort((a, b) => a.createdAt.localeCompare(b.createdAt));

  return (
    <div className="space-y-5">
      <PageHeader title="Support Inbox" subtitle="Review owner requests and reply directly." />
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-5">
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden xl:col-span-1">
          <div className="px-5 py-4 border-b border-gray-100 flex items-center gap-2">
            <Inbox className="w-4 h-4 text-gray-500" />
            <h2 className="text-sm font-semibold">Owner Requests</h2>
          </div>
          <div className="divide-y divide-gray-100">
            {tickets.map((ticket) => (
              <button key={ticket.id} onClick={() => setSelectedTicketId(ticket.id)} className={`w-full text-left p-4 hover:bg-gray-50 ${selectedTicketId === ticket.id ? "bg-blue-50/60" : ""}`}>
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-sm font-semibold text-gray-900">{ticket.subject}</p>
                    <p className="text-xs text-gray-500">{ticket.status.toLowerCase()}</p>
                  </div>
                  <span className={`text-[11px] px-2 py-1 rounded-full font-semibold ${ticket.status === "ANSWERED" ? "bg-green-50 text-green-700" : "bg-amber-50 text-amber-700"}`}>{ticket.status}</span>
                </div>
              </button>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden xl:col-span-2">
          <div className="px-5 py-4 border-b border-gray-100">
            <h2 className="text-sm font-semibold text-gray-900">Conversation</h2>
          </div>
          <div className="p-5 space-y-3 min-h-[280px]">
            {activeMessages.length === 0 ? <p className="text-sm text-gray-500">Select a ticket to view the conversation.</p> : activeMessages.map((msg) => (
              <div key={msg.id} className={`max-w-2xl rounded-xl px-4 py-3 text-sm ${msg.sender === "ADMIN" ? "ml-auto bg-gray-900 text-white" : "bg-gray-50 text-gray-800"}`}>
                <p className="text-[11px] uppercase tracking-wide font-semibold mb-1 opacity-80">{msg.sender === "ADMIN" ? `Admin reply by ${msg.senderName}` : `Owner request by ${msg.senderName}`}</p>
                <p className="whitespace-pre-wrap">{msg.message}</p>
              </div>
            ))}
          </div>
          <div className="border-t border-gray-100 p-5">
            <textarea value={reply} onChange={(e) => setReply(e.target.value)} placeholder="Write an admin reply..." className="w-full min-h-[120px] rounded-xl border border-gray-200 p-4 text-sm outline-none focus:border-gray-900" />
            <button onClick={sendReply} className="mt-3 inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gray-900 text-white text-sm font-semibold">
              <Reply className="w-4 h-4" /> Send Reply
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

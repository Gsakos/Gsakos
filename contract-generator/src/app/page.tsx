"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { DisclaimerBanner } from "@/components/DisclaimerBanner";
import { GlassCard } from "@/components/ui/GlassCard";
import { Button } from "@/components/ui/Button";

interface PartyDraft {
  name: string;
  email: string;
  role: string;
}

const MAX_PARTIES = 6;

function emptyParty(role: string): PartyDraft {
  return { name: "", email: "", role };
}

export default function HomePage() {
  const router = useRouter();
  const [contractTitle, setContractTitle] = useState("");
  const [location, setLocation] = useState("");
  const [situation, setSituation] = useState("");
  const [parties, setParties] = useState<PartyDraft[]>([
    emptyParty("Party A"),
    emptyParty("Party B"),
  ]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function updateParty(index: number, field: keyof PartyDraft, value: string) {
    setParties((prev) => prev.map((p, i) => (i === index ? { ...p, [field]: value } : p)));
  }

  function addParty() {
    if (parties.length >= MAX_PARTIES) return;
    setParties((prev) => [...prev, emptyParty(`Party ${String.fromCharCode(65 + prev.length)}`)]);
  }

  function removeParty(index: number) {
    if (parties.length <= 2) return;
    setParties((prev) => prev.filter((_, i) => i !== index));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);

    try {
      const res = await fetch("/api/contracts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ contractTitle, location, situation, parties }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Something went wrong drafting the contract.");
      }
      router.push(`/draft/${data.id}?key=${data.draftToken}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
      setSubmitting(false);
    }
  }

  return (
    <main className="mx-auto max-w-2xl px-4 py-12 sm:py-16">
      <div className="mb-8 flex items-center gap-3">
        <Image
          src="/icons/icon-192.png"
          alt=""
          width={44}
          height={44}
          className="rounded-[14px] shadow-lg shadow-indigo-500/20"
        />
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
            DealSeal
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">Draft it. Send it. Seal it.</p>
        </div>
      </div>

      <p className="text-slate-600 dark:text-slate-300">
        Describe the situation, add the people involved, and get a plain-language agreement you
        can edit, send out for signature, and have emailed back once everyone&apos;s signed.
      </p>

      <div className="mt-6">
        <DisclaimerBanner />
      </div>

      <GlassCard className="mt-8">
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-200">
              Contract title <span className="text-slate-400">(optional)</span>
            </label>
            <input
              type="text"
              value={contractTitle}
              onChange={(e) => setContractTitle(e.target.value)}
              placeholder="e.g. Freelance Design Agreement"
              className="glass-input mt-1 w-full rounded-xl px-3 py-2 text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-400 dark:text-white"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-200">
              Location
            </label>
            <input
              type="text"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              required
              placeholder="e.g. Austin, Texas, USA"
              className="glass-input mt-1 w-full rounded-xl px-3 py-2 text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-400 dark:text-white"
            />
            <p className="mt-1 text-xs text-slate-400">Used to set the governing law / jurisdiction.</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-200">
              Situation
            </label>
            <textarea
              value={situation}
              onChange={(e) => setSituation(e.target.value)}
              required
              rows={6}
              placeholder="Describe what's being agreed, by whom, for how much, over what time, and any special terms..."
              className="glass-input mt-1 w-full rounded-xl px-3 py-2 text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-400 dark:text-white"
            />
          </div>

          <div>
            <div className="flex items-center justify-between">
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-200">
                Parties
              </label>
              {parties.length < MAX_PARTIES && (
                <button
                  type="button"
                  onClick={addParty}
                  className="text-sm font-medium text-indigo-600 hover:text-indigo-800 dark:text-indigo-300 dark:hover:text-indigo-100"
                >
                  + Add party
                </button>
              )}
            </div>

            <div className="mt-2 space-y-3">
              {parties.map((party, index) => (
                <div
                  key={index}
                  className="glass-input grid grid-cols-1 gap-2 rounded-xl p-3 sm:grid-cols-3"
                >
                  <input
                    type="text"
                    value={party.name}
                    onChange={(e) => updateParty(index, "name", e.target.value)}
                    placeholder="Full name"
                    required
                    className="rounded-lg border-0 bg-white/60 px-2 py-1.5 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-400 dark:bg-white/10 dark:text-white"
                  />
                  <input
                    type="email"
                    value={party.email}
                    onChange={(e) => updateParty(index, "email", e.target.value)}
                    placeholder="Email"
                    required
                    className="rounded-lg border-0 bg-white/60 px-2 py-1.5 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-400 dark:bg-white/10 dark:text-white"
                  />
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={party.role}
                      onChange={(e) => updateParty(index, "role", e.target.value)}
                      placeholder="Role (e.g. Client)"
                      required
                      className="w-full rounded-lg border-0 bg-white/60 px-2 py-1.5 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-400 dark:bg-white/10 dark:text-white"
                    />
                    {parties.length > 2 && (
                      <button
                        type="button"
                        onClick={() => removeParty(index)}
                        className="shrink-0 text-sm text-slate-400 hover:text-red-500"
                        aria-label="Remove party"
                      >
                        ✕
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {error && <p className="text-sm text-red-500">{error}</p>}

          <Button type="submit" disabled={submitting} className="w-full py-3 text-base">
            {submitting ? "Drafting your contract..." : "Generate contract"}
          </Button>
        </form>
      </GlassCard>
    </main>
  );
}

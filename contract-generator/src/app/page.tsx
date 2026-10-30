"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { DisclaimerBanner } from "@/components/DisclaimerBanner";

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
    <main className="mx-auto max-w-2xl px-4 py-12">
      <h1 className="text-2xl font-bold text-slate-900">Contract Generator</h1>
      <p className="mt-2 text-slate-600">
        Describe the situation, add the people involved, and Claude will draft a plain-language
        agreement you can edit, send out for signature, and have emailed back once everyone's
        signed.
      </p>

      <div className="mt-6">
        <DisclaimerBanner />
      </div>

      <form onSubmit={handleSubmit} className="mt-8 space-y-6">
        <div>
          <label className="block text-sm font-medium text-slate-700">
            Contract title <span className="text-slate-400">(optional)</span>
          </label>
          <input
            type="text"
            value={contractTitle}
            onChange={(e) => setContractTitle(e.target.value)}
            placeholder="e.g. Freelance Design Agreement"
            className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-slate-400"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700">Location</label>
          <input
            type="text"
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            required
            placeholder="e.g. Austin, Texas, USA"
            className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-slate-400"
          />
          <p className="mt-1 text-xs text-slate-400">Used to set the governing law / jurisdiction.</p>
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700">Situation</label>
          <textarea
            value={situation}
            onChange={(e) => setSituation(e.target.value)}
            required
            rows={6}
            placeholder="Describe what's being agreed, by whom, for how much, over what time, and any special terms..."
            className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-slate-400"
          />
        </div>

        <div>
          <div className="flex items-center justify-between">
            <label className="block text-sm font-medium text-slate-700">Parties</label>
            {parties.length < MAX_PARTIES && (
              <button
                type="button"
                onClick={addParty}
                className="text-sm font-medium text-slate-600 hover:text-slate-900"
              >
                + Add party
              </button>
            )}
          </div>

          <div className="mt-2 space-y-3">
            {parties.map((party, index) => (
              <div key={index} className="grid grid-cols-1 gap-2 rounded-md border border-slate-200 p-3 sm:grid-cols-3">
                <input
                  type="text"
                  value={party.name}
                  onChange={(e) => updateParty(index, "name", e.target.value)}
                  placeholder="Full name"
                  required
                  className="rounded-md border border-slate-300 px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-slate-400"
                />
                <input
                  type="email"
                  value={party.email}
                  onChange={(e) => updateParty(index, "email", e.target.value)}
                  placeholder="Email"
                  required
                  className="rounded-md border border-slate-300 px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-slate-400"
                />
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={party.role}
                    onChange={(e) => updateParty(index, "role", e.target.value)}
                    placeholder="Role (e.g. Client)"
                    required
                    className="w-full rounded-md border border-slate-300 px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-slate-400"
                  />
                  {parties.length > 2 && (
                    <button
                      type="button"
                      onClick={() => removeParty(index)}
                      className="shrink-0 text-sm text-slate-400 hover:text-red-600"
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

        {error && <p className="text-sm text-red-600">{error}</p>}

        <button
          type="submit"
          disabled={submitting}
          className="w-full rounded-md bg-slate-900 px-4 py-3 font-medium text-white hover:bg-slate-800 disabled:opacity-50"
        >
          {submitting ? "Drafting your contract..." : "Generate contract"}
        </button>
      </form>
    </main>
  );
}

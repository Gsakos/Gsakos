"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams, useSearchParams } from "next/navigation";
import { ContractDocument } from "@/components/ContractDocument";
import { SignatureDisplay } from "@/components/SignatureDisplay";
import { DisclaimerBanner } from "@/components/DisclaimerBanner";
import { GlassCard } from "@/components/ui/GlassCard";
import { Button } from "@/components/ui/Button";
import type { DraftFacingContract } from "@/lib/types";

export default function DraftPage() {
  const { id } = useParams<{ id: string }>();
  const searchParams = useSearchParams();
  const key = searchParams.get("key") || "";

  const [contract, setContract] = useState<DraftFacingContract | null>(null);
  const [editedText, setEditedText] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [sending, setSending] = useState(false);
  const [emailSent, setEmailSent] = useState(true);
  const [copiedPartyId, setCopiedPartyId] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/contracts/${id}?key=${encodeURIComponent(key)}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Could not load this contract.");
      setContract(data.contract);
      setEditedText(data.contract.contractText);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setLoading(false);
    }
  }, [id, key]);

  useEffect(() => {
    load();
  }, [load]);

  async function handleSave() {
    setSaving(true);
    setError(null);
    try {
      const res = await fetch(`/api/contracts/${id}?key=${encodeURIComponent(key)}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ contractText: editedText }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Could not save changes.");
      setContract(data.contract);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setSaving(false);
    }
  }

  async function handleSend() {
    setSending(true);
    setError(null);
    try {
      const res = await fetch(`/api/contracts/${id}/send?key=${encodeURIComponent(key)}`, {
        method: "POST",
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Could not send the contract.");
      setContract(data.contract);
      setEmailSent(Boolean(data.emailSent));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setSending(false);
    }
  }

  function copyLink(partyId: string, url: string) {
    navigator.clipboard.writeText(url);
    setCopiedPartyId(partyId);
    setTimeout(() => setCopiedPartyId((cur) => (cur === partyId ? null : cur)), 1500);
  }

  if (loading) {
    return (
      <main className="mx-auto max-w-2xl px-4 py-12 text-slate-500 dark:text-slate-400">
        Loading...
      </main>
    );
  }

  if (error && !contract) {
    return (
      <main className="mx-auto max-w-2xl px-4 py-12">
        <GlassCard>
          <p className="text-red-500">{error}</p>
        </GlassCard>
      </main>
    );
  }

  if (!contract) return null;

  const isDraft = contract.status === "draft";
  const isFullySigned = contract.status === "fully_signed";

  return (
    <main className="mx-auto max-w-3xl px-4 py-12">
      <div className="no-print">
        <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Drafter view</p>
        <h1 className="mt-1 text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
          {contract.title}
        </h1>

        <div className="mt-4">
          <DisclaimerBanner />
        </div>

        {!emailSent && (
          <div className="glass mt-4 rounded-2xl border-blue-200/60 px-4 py-3 text-sm text-blue-900 dark:text-blue-200">
            Email isn&apos;t configured on this deployment (no <code>RESEND_API_KEY</code>), so
            nothing was emailed automatically. Use the &quot;Copy link&quot; buttons below to send
            each signing link yourself.
          </div>
        )}

        {error && <p className="mt-4 text-sm text-red-500">{error}</p>}
      </div>

      <GlassCard strong className="mt-6 print-area">
        {isDraft ? (
          <>
            <p className="no-print mb-2 text-sm font-medium text-slate-700 dark:text-slate-200">
              Review and edit the draft below before sending it out.
            </p>
            <textarea
              value={editedText}
              onChange={(e) => setEditedText(e.target.value)}
              rows={20}
              className="glass-input no-print w-full rounded-xl p-3 font-mono text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-400 dark:text-white"
            />
          </>
        ) : (
          <ContractDocument text={contract.contractText} />
        )}
      </GlassCard>

      <div className="no-print mt-8">
        <h2 className="text-lg font-semibold text-slate-900 dark:text-white">
          {isFullySigned ? "Signatures" : "Parties"}
        </h2>
        <div className="mt-3 space-y-3">
          {contract.parties.map((party) => (
            <div key={party.id}>
              {isDraft ? (
                <div className="glass flex items-center justify-between rounded-2xl p-4">
                  <div>
                    <p className="font-medium text-slate-900 dark:text-white">{party.name}</p>
                    <p className="text-sm text-slate-500 dark:text-slate-400">
                      {party.role} · {party.email}
                    </p>
                  </div>
                </div>
              ) : (
                <div>
                  <SignatureDisplayFromDraftParty party={party} />
                  {!party.signed && (
                    <button
                      onClick={() => copyLink(party.id, party.signingUrl)}
                      className="mt-1 text-xs font-medium text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white"
                    >
                      {copiedPartyId === party.id ? "Copied!" : "Copy signing link"}
                    </button>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      <div className="no-print mt-8 flex gap-3">
        {isDraft && (
          <>
            <Button variant="glass" onClick={handleSave} disabled={saving}>
              {saving ? "Saving..." : "Save changes"}
            </Button>
            <Button onClick={handleSend} disabled={sending}>
              {sending ? "Sending..." : "Send for signature"}
            </Button>
          </>
        )}

        {!isDraft && !isFullySigned && (
          <Button variant="glass" onClick={handleSend} disabled={sending}>
            {sending ? "Resending..." : "Resend to parties who haven't signed"}
          </Button>
        )}

        {isFullySigned && <Button onClick={() => window.print()}>Download / print PDF</Button>}
      </div>
    </main>
  );
}

function SignatureDisplayFromDraftParty({
  party,
}: {
  party: DraftFacingContract["parties"][number];
}) {
  return (
    <SignatureDisplay
      name={party.name}
      role={party.role}
      signed={party.signed}
      signedAt={party.signedAt}
      signatureType={party.signatureType}
      signatureValue={party.signatureValue}
    />
  );
}

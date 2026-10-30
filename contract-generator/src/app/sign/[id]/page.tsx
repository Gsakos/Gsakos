"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams, useSearchParams } from "next/navigation";
import { ContractDocument } from "@/components/ContractDocument";
import { SignatureDisplay } from "@/components/SignatureDisplay";
import { DisclaimerBanner } from "@/components/DisclaimerBanner";
import { SignaturePad } from "@/components/SignaturePad";
import type { PartyFacingContract, SignatureType } from "@/lib/types";

export default function SignPage() {
  const { id } = useParams<{ id: string }>();
  const searchParams = useSearchParams();
  const token = searchParams.get("token") || "";

  const [contract, setContract] = useState<PartyFacingContract | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [agree, setAgree] = useState(false);
  const [signatureType, setSignatureType] = useState<SignatureType>("typed");
  const [signatureValue, setSignatureValue] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/contracts/${id}?token=${encodeURIComponent(token)}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Could not load this contract.");
      setContract(data.contract);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setLoading(false);
    }
  }, [id, token]);

  useEffect(() => {
    load();
  }, [load]);

  async function handleSign(e: React.FormEvent) {
    e.preventDefault();
    if (!agree || !signatureValue) return;
    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch(`/api/contracts/${id}/sign?token=${encodeURIComponent(token)}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ signatureType, signatureValue, agree }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Could not record your signature.");
      setContract(data.contract);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) {
    return <main className="mx-auto max-w-2xl px-4 py-12 text-slate-500">Loading...</main>;
  }

  if (error && !contract) {
    return (
      <main className="mx-auto max-w-2xl px-4 py-12">
        <p className="text-red-600">{error}</p>
      </main>
    );
  }

  if (!contract) return null;

  const isFullySigned = contract.status === "fully_signed";
  const alreadySigned = contract.viewer.signed;
  const othersPending = contract.parties.filter((p) => !p.signed).map((p) => p.name);

  return (
    <main className="mx-auto max-w-3xl px-4 py-12">
      <div className="no-print">
        <h1 className="text-2xl font-bold text-slate-900">{contract.title}</h1>
        <p className="mt-1 text-slate-600">
          Hi {contract.viewer.name} ({contract.viewer.role}) - please review the agreement below.
        </p>

        <div className="mt-4">
          <DisclaimerBanner />
        </div>

        {error && <p className="mt-4 text-sm text-red-600">{error}</p>}
      </div>

      <section className="mt-6 rounded-xl border border-slate-200 bg-white p-6 shadow-sm print-area">
        <ContractDocument text={contract.contractText} />
      </section>

      <div className="no-print mt-8">
        <h2 className="text-lg font-semibold text-slate-900">Signatures</h2>
        <div className="mt-3 space-y-3">
          {contract.parties.map((party) => (
            <SignatureDisplay
              key={party.name}
              name={party.name}
              role={party.role}
              signed={party.signed}
              signedAt={party.signedAt}
              signatureType={party.signatureType}
              signatureValue={party.signatureValue}
            />
          ))}
        </div>
      </div>

      <div className="no-print mt-8">
        {isFullySigned ? (
          <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-4">
            <p className="font-medium text-emerald-800">
              This agreement is fully signed by everyone involved.
            </p>
            <button
              onClick={() => window.print()}
              className="mt-3 rounded-md bg-slate-900 px-4 py-2 font-medium text-white hover:bg-slate-800"
            >
              Download / print PDF
            </button>
          </div>
        ) : alreadySigned ? (
          <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
            <p className="font-medium text-slate-800">You&apos;ve signed this agreement.</p>
            {othersPending.length > 0 && (
              <p className="mt-1 text-sm text-slate-600">
                Still waiting on: {othersPending.join(", ")}.
              </p>
            )}
            <button
              onClick={() => load()}
              className="mt-3 text-sm font-medium text-slate-600 underline hover:text-slate-900"
            >
              Check for updates
            </button>
          </div>
        ) : (
          <form onSubmit={handleSign} className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="text-lg font-semibold text-slate-900">Sign this agreement</h2>
            <div className="mt-4">
              <SignaturePad
                defaultTypedName={contract.viewer.name}
                onCapture={(type, value) => {
                  setSignatureType(type);
                  setSignatureValue(value);
                }}
              />
            </div>

            <label className="mt-4 flex items-start gap-2 text-sm text-slate-700">
              <input
                type="checkbox"
                checked={agree}
                onChange={(e) => setAgree(e.target.checked)}
                className="mt-0.5"
              />
              I have read the agreement above and agree to be bound by its terms.
            </label>

            <button
              type="submit"
              disabled={!agree || !signatureValue || submitting}
              className="mt-4 w-full rounded-md bg-slate-900 px-4 py-3 font-medium text-white hover:bg-slate-800 disabled:opacity-50"
            >
              {submitting ? "Signing..." : "Sign"}
            </button>
          </form>
        )}
      </div>
    </main>
  );
}

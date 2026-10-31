import type { SignatureType } from "@/lib/types";

interface SignatureDisplayProps {
  name: string;
  role: string;
  signed: boolean;
  signedAt: string | null;
  signatureType?: SignatureType | null;
  signatureValue?: string | null;
}

export function SignatureDisplay({
  name,
  role,
  signed,
  signedAt,
  signatureType,
  signatureValue,
}: SignatureDisplayProps) {
  return (
    <div className="glass rounded-2xl p-4">
      <div className="flex items-center justify-between">
        <div>
          <p className="font-medium text-slate-900 dark:text-white">{name}</p>
          <p className="text-sm text-slate-500 dark:text-slate-400">{role}</p>
        </div>
        <span
          className={`rounded-full px-3 py-1 text-xs font-medium ${
            signed
              ? "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300"
              : "bg-slate-500/10 text-slate-500 dark:text-slate-400"
          }`}
        >
          {signed ? "Signed" : "Awaiting signature"}
        </span>
      </div>

      {signed && signatureValue ? (
        <div className="mt-3 border-t border-white/30 pt-3 dark:border-white/10">
          {signatureType === "drawn" ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={signatureValue} alt={`${name}'s signature`} className="h-16" />
          ) : (
            <p className="font-signature text-2xl italic text-slate-800 dark:text-slate-100">
              {signatureValue}
            </p>
          )}
          {signedAt && (
            <p className="mt-1 text-xs text-slate-400">
              Signed {new Date(signedAt).toLocaleString()}
            </p>
          )}
        </div>
      ) : null}
    </div>
  );
}

export function getAppUrl(): string {
  return process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
}

export function signingUrl(contractId: string, token: string): string {
  return `${getAppUrl()}/sign/${contractId}?token=${encodeURIComponent(token)}`;
}

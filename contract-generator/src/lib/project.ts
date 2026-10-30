import type { Contract, DraftFacingContract, PartyFacingContract } from "./types";
import { signingUrl } from "./urls";

export function toDraftFacing(contract: Contract): DraftFacingContract {
  return {
    id: contract.id,
    title: contract.title,
    situation: contract.situation,
    location: contract.location,
    contractText: contract.contractText,
    status: contract.status,
    createdAt: contract.createdAt,
    sentAt: contract.sentAt,
    fullySignedAt: contract.fullySignedAt,
    parties: contract.parties.map((p) => ({
      id: p.id,
      name: p.name,
      email: p.email,
      role: p.role,
      signed: p.signed,
      signedAt: p.signedAt,
      signatureType: p.signatureType,
      signatureValue: p.signatureValue,
      signingUrl: signingUrl(contract.id, p.signToken),
    })),
  };
}

export function toPartyFacing(contract: Contract, viewerPartyId: string): PartyFacingContract {
  const viewer = contract.parties.find((p) => p.id === viewerPartyId);
  if (!viewer) {
    throw new Error("Viewer party not found on contract");
  }

  return {
    id: contract.id,
    title: contract.title,
    location: contract.location,
    contractText: contract.contractText,
    status: contract.status,
    createdAt: contract.createdAt,
    fullySignedAt: contract.fullySignedAt,
    viewer: {
      partyId: viewer.id,
      name: viewer.name,
      role: viewer.role,
      signed: viewer.signed,
      signedAt: viewer.signedAt,
    },
    parties: contract.parties.map((p) => ({
      name: p.name,
      role: p.role,
      signed: p.signed,
      signedAt: p.signedAt,
      signatureType: p.signatureType,
      signatureValue: p.signatureValue,
    })),
  };
}

export function getClientIp(request: Request): string | null {
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0].trim();
  return request.headers.get("x-real-ip");
}

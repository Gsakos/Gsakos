export type ContractStatus = "draft" | "sent" | "partially_signed" | "fully_signed";

export type SignatureType = "typed" | "drawn";

export interface Party {
  id: string;
  name: string;
  email: string;
  role: string;
  signToken: string;
  signed: boolean;
  signedAt: string | null;
  signatureType: SignatureType | null;
  /** Typed signatures store the typed name; drawn signatures store a PNG data URL. */
  signatureValue: string | null;
  ipAddress: string | null;
}

export interface Contract {
  id: string;
  draftToken: string;
  createdAt: string;
  title: string;
  situation: string;
  location: string;
  contractText: string;
  parties: Party[];
  status: ContractStatus;
  sentAt: string | null;
  fullySignedAt: string | null;
}

/** Shape returned to a party viewing/signing their own link - no tokens, no other parties' emails. */
export interface PartyFacingContract {
  id: string;
  title: string;
  location: string;
  contractText: string;
  status: ContractStatus;
  createdAt: string;
  fullySignedAt: string | null;
  viewer: {
    partyId: string;
    name: string;
    role: string;
    signed: boolean;
    signedAt: string | null;
  };
  parties: Array<{
    name: string;
    role: string;
    signed: boolean;
    signedAt: string | null;
    signatureType: SignatureType | null;
    signatureValue: string | null;
  }>;
}

/** Shape returned to the drafter - includes signing links, excludes raw tokens. */
export interface DraftFacingContract {
  id: string;
  title: string;
  situation: string;
  location: string;
  contractText: string;
  status: ContractStatus;
  createdAt: string;
  sentAt: string | null;
  fullySignedAt: string | null;
  parties: Array<{
    id: string;
    name: string;
    email: string;
    role: string;
    signed: boolean;
    signedAt: string | null;
    signatureType: SignatureType | null;
    signatureValue: string | null;
    signingUrl: string;
  }>;
}

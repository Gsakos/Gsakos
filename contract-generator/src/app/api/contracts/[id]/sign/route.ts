import { NextResponse } from "next/server";
import { getContract, saveContract } from "@/lib/store";
import { toPartyFacing, getClientIp } from "@/lib/project";
import { sendFullyExecutedEmail } from "@/lib/email";
import { signingUrl } from "@/lib/urls";
import type { SignatureType } from "@/lib/types";

type RouteParams = { params: Promise<{ id: string }> };

const MAX_SIGNATURE_VALUE_LENGTH = 500_000; // ~500KB, generous for a drawn PNG data URL

interface SignBody {
  signatureType?: SignatureType;
  signatureValue?: string;
  agree?: boolean;
}

export async function POST(request: Request, { params }: RouteParams) {
  const { id } = await params;
  const contract = getContract(id);
  if (!contract) {
    return NextResponse.json({ error: "Contract not found." }, { status: 404 });
  }

  const url = new URL(request.url);
  const token = url.searchParams.get("token");
  const party = token ? contract.parties.find((p) => p.signToken === token) : undefined;
  if (!party) {
    return NextResponse.json({ error: "Not authorized to sign this contract." }, { status: 403 });
  }

  if (party.signed) {
    return NextResponse.json({ error: "You have already signed this contract." }, { status: 409 });
  }

  let body: SignBody;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  if (!body.agree) {
    return NextResponse.json(
      { error: "You must confirm that you have read and agree to the terms." },
      { status: 400 },
    );
  }
  if (body.signatureType !== "typed" && body.signatureType !== "drawn") {
    return NextResponse.json({ error: "Invalid signature type." }, { status: 400 });
  }
  const signatureValue = (body.signatureValue || "").trim();
  if (!signatureValue) {
    return NextResponse.json({ error: "A signature is required." }, { status: 400 });
  }
  if (signatureValue.length > MAX_SIGNATURE_VALUE_LENGTH) {
    return NextResponse.json({ error: "Signature data is too large." }, { status: 400 });
  }
  if (body.signatureType === "drawn" && !signatureValue.startsWith("data:image/png;base64,")) {
    return NextResponse.json({ error: "Invalid drawn signature." }, { status: 400 });
  }

  party.signed = true;
  party.signedAt = new Date().toISOString();
  party.signatureType = body.signatureType;
  party.signatureValue = signatureValue;
  party.ipAddress = getClientIp(request);

  const allSigned = contract.parties.every((p) => p.signed);
  if (allSigned) {
    contract.status = "fully_signed";
    contract.fullySignedAt = new Date().toISOString();
  } else if (contract.status === "sent") {
    contract.status = "partially_signed";
  }

  saveContract(contract);

  if (allSigned) {
    for (const p of contract.parties) {
      await sendFullyExecutedEmail({
        to: p.email,
        partyName: p.name,
        contractTitle: contract.title,
        viewUrl: signingUrl(contract.id, p.signToken),
      });
    }
  }

  return NextResponse.json({ contract: toPartyFacing(contract, party.id) });
}

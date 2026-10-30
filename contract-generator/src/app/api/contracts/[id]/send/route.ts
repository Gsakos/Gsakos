import { NextResponse } from "next/server";
import { getContract, saveContract } from "@/lib/store";
import { toDraftFacing } from "@/lib/project";
import { sendSigningRequestEmail, emailIsConfigured } from "@/lib/email";
import { signingUrl } from "@/lib/urls";

type RouteParams = { params: Promise<{ id: string }> };

export async function POST(request: Request, { params }: RouteParams) {
  const { id } = await params;
  const contract = getContract(id);
  if (!contract) {
    return NextResponse.json({ error: "Contract not found." }, { status: 404 });
  }

  const url = new URL(request.url);
  const key = url.searchParams.get("key");
  if (!key || key !== contract.draftToken) {
    return NextResponse.json({ error: "Not authorized." }, { status: 403 });
  }

  if (contract.status === "fully_signed") {
    return NextResponse.json({ error: "This contract is already fully signed." }, { status: 409 });
  }

  const isFirstSend = contract.status === "draft";

  for (const party of contract.parties) {
    if (party.signed) continue;
    const otherNames = contract.parties.filter((p) => p.id !== party.id).map((p) => p.name);
    await sendSigningRequestEmail({
      to: party.email,
      partyName: party.name,
      contractTitle: contract.title,
      signingUrl: signingUrl(contract.id, party.signToken),
      otherPartyNames: otherNames,
    });
  }

  if (isFirstSend) {
    contract.status = "sent";
    contract.sentAt = new Date().toISOString();
    saveContract(contract);
  }

  return NextResponse.json({
    contract: toDraftFacing(contract),
    emailSent: emailIsConfigured(),
  });
}

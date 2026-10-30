import { NextResponse } from "next/server";
import { getContract, saveContract } from "@/lib/store";
import { toDraftFacing, toPartyFacing } from "@/lib/project";

type RouteParams = { params: Promise<{ id: string }> };

export async function GET(request: Request, { params }: RouteParams) {
  const { id } = await params;
  const contract = getContract(id);
  if (!contract) {
    return NextResponse.json({ error: "Contract not found." }, { status: 404 });
  }

  const url = new URL(request.url);
  const key = url.searchParams.get("key");
  const token = url.searchParams.get("token");

  if (key && key === contract.draftToken) {
    return NextResponse.json({ view: "draft", contract: toDraftFacing(contract) });
  }

  if (token) {
    const party = contract.parties.find((p) => p.signToken === token);
    if (party) {
      return NextResponse.json({ view: "party", contract: toPartyFacing(contract, party.id) });
    }
  }

  return NextResponse.json({ error: "Not authorized to view this contract." }, { status: 403 });
}

interface PatchBody {
  contractText?: string;
}

export async function PATCH(request: Request, { params }: RouteParams) {
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

  if (contract.status !== "draft") {
    return NextResponse.json(
      { error: "This contract has already been sent and can no longer be edited." },
      { status: 409 },
    );
  }

  let body: PatchBody;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const contractText = (body.contractText || "").trim();
  if (!contractText) {
    return NextResponse.json({ error: "Contract text cannot be empty." }, { status: 400 });
  }

  contract.contractText = contractText;
  saveContract(contract);

  return NextResponse.json({ view: "draft", contract: toDraftFacing(contract) });
}

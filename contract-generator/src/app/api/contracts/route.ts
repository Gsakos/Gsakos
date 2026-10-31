import { NextResponse } from "next/server";
import { draftContract } from "@/lib/anthropic";
import { saveContract } from "@/lib/store";
import { generateId, generateToken } from "@/lib/tokens";
import type { Contract, Party } from "@/lib/types";

const MAX_SITUATION_LENGTH = 4000;
const MAX_PARTIES = 6;
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

interface CreateContractBody {
  situation?: string;
  location?: string;
  contractTitle?: string;
  parties?: Array<{ name?: string; email?: string; role?: string }>;
}

export async function POST(request: Request) {
  let body: CreateContractBody;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const situation = (body.situation || "").trim();
  const location = (body.location || "").trim();
  const contractTitle = (body.contractTitle || "").trim();
  const rawParties = Array.isArray(body.parties) ? body.parties : [];

  if (!situation) {
    return NextResponse.json({ error: "Describe the situation first." }, { status: 400 });
  }
  if (situation.length > MAX_SITUATION_LENGTH) {
    return NextResponse.json(
      { error: `Situation must be under ${MAX_SITUATION_LENGTH} characters.` },
      { status: 400 },
    );
  }
  if (!location) {
    return NextResponse.json({ error: "Location is required." }, { status: 400 });
  }
  if (rawParties.length < 2) {
    return NextResponse.json({ error: "At least two parties are required." }, { status: 400 });
  }
  if (rawParties.length > MAX_PARTIES) {
    return NextResponse.json({ error: `At most ${MAX_PARTIES} parties are supported.` }, { status: 400 });
  }

  const parties: Party[] = [];
  for (const raw of rawParties) {
    const name = (raw.name || "").trim();
    const email = (raw.email || "").trim();
    const role = (raw.role || "").trim() || "Party";

    if (!name || !email) {
      return NextResponse.json(
        { error: "Every party needs a name and an email address." },
        { status: 400 },
      );
    }
    if (!EMAIL_PATTERN.test(email)) {
      return NextResponse.json({ error: `"${email}" doesn't look like a valid email.` }, { status: 400 });
    }

    parties.push({
      id: generateId(),
      name,
      email,
      role,
      signToken: generateToken(),
      signed: false,
      signedAt: null,
      signatureType: null,
      signatureValue: null,
      ipAddress: null,
    });
  }

  const effectiveDate = new Date().toISOString().slice(0, 10);

  const draft = await draftContract({
    situation,
    location,
    contractTitle: contractTitle || undefined,
    effectiveDate,
    parties: parties.map((p) => ({ name: p.name, role: p.role })),
  });

  if (!draft.ok) {
    return NextResponse.json({ error: draft.reason }, { status: 422 });
  }

  const titleMatch = draft.text.match(/^#\s+(.+)$/m);
  const title = contractTitle || titleMatch?.[1]?.trim() || "Agreement";

  const contract: Contract = {
    id: generateId(),
    draftToken: generateToken(),
    createdAt: new Date().toISOString(),
    title,
    situation,
    location,
    contractText: draft.text,
    parties,
    status: "draft",
    sentAt: null,
    fullySignedAt: null,
  };

  await saveContract(contract);

  return NextResponse.json({ id: contract.id, draftToken: contract.draftToken });
}

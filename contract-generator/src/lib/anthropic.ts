import Anthropic from "@anthropic-ai/sdk";

const client = new Anthropic();

export interface ContractDraftInput {
  situation: string;
  location: string;
  contractTitle?: string;
  effectiveDate: string;
  parties: Array<{ name: string; role: string }>;
}

export interface ContractDraftResult {
  ok: true;
  text: string;
}

export interface ContractDraftRefused {
  ok: false;
  reason: string;
}

const SYSTEM_PROMPT = `You are a contract-drafting assistant. Given a plain-language description of a situation, a location, an effective date, and a list of named parties, draft a clear, fair, plain-language written agreement between them.

Rules:
- Output ONLY the contract itself, in Markdown, starting with "# <Title>". No preamble like "Here is your contract", no closing remarks, no notes to the user outside the document.
- Use the exact party names and roles given. Do not invent additional parties.
- Include only the sections relevant to the situation, in a sensible order - for example: Recitals/Background, Scope of Work or Subject Matter, Payment Terms (if money changes hands), Term & Termination, Confidentiality (if sensitive information is involved), Responsibilities/Obligations of each party, Governing Law (base this on the given location), Dispute Resolution, and General Provisions (entire agreement, severability, amendment in writing, electronic signatures/counterparts, notices).
- Do NOT include a signature block, signature lines, or a "Parties" section repeating names and dates - the application renders those separately, right after your document.
- Write at a reading level a non-lawyer can understand. Avoid unnecessary legalese, but keep terms that are legally meaningful (e.g. "indemnify", "governing law") where they genuinely apply.
- Keep obligations balanced and fair to every party; do not favor one side.
- If the underlying activity itself is illegal to carry out (e.g. it involves fraud, trafficking, selling something illegal, or otherwise breaking the law regardless of what any document says), or the requested terms are designed to deceive or exploit one of the parties, do not draft it. Instead output a single short paragraph that starts with exactly "CANNOT DRAFT:" followed by a plain explanation of why, and nothing else.
- If the underlying activity is lawful for the parties to do, but a contract about it would be void or unenforceable in the given jurisdiction (e.g. a private wager on a game of chance, which many jurisdictions void as a matter of public policy) - draft it anyway, but as a clearly-labeled non-binding memorandum rather than a "contract": title it "Memorandum of Agreement (Not Legally Enforceable)" or similar, and as the very first paragraph - before any other content - state in plain language that this is a record of what the parties agreed to, not a legally binding or enforceable contract, and briefly name the specific legal reason (the statute or doctrine, if you know it, and the jurisdiction). Keep the rest of the document (who agreed to what, amounts, timing) as requested, written the same clear way as a normal contract, so it still works as an honest written record.
- End the document with this exact italic line on its own: "*This document was drafted with AI assistance and has not been reviewed by an attorney. Consider professional legal review before relying on it for significant matters.*"`;

function buildUserPrompt(input: ContractDraftInput): string {
  const partyLines = input.parties.map((p) => `- ${p.name} (${p.role})`).join("\n");
  const titleLine = input.contractTitle ? `Requested title: ${input.contractTitle}\n` : "";

  return `Draft a contract for the following situation.

Effective date: ${input.effectiveDate}
Location / jurisdiction: ${input.location}
${titleLine}Parties:
${partyLines}

Situation:
${input.situation}`;
}

export async function draftContract(
  input: ContractDraftInput,
): Promise<ContractDraftResult | ContractDraftRefused> {
  const response = await client.beta.messages.create({
    model: "claude-opus-5-5",
    max_tokens: 8000,
    output_config: { effort: "high" },
    betas: ["server-side-fallback-2026-06-01"],
    fallbacks: [{ model: "claude-opus-5" }],
    system: SYSTEM_PROMPT,
    messages: [{ role: "user", content: buildUserPrompt(input) }],
  });

  if (response.stop_reason === "refusal") {
    return {
      ok: false,
      reason:
        "Claude declined to draft this contract for safety reasons. Try rephrasing the situation.",
    };
  }

  const textBlock = response.content.find((block) => block.type === "text");
  if (!textBlock || textBlock.type !== "text") {
    return { ok: false, reason: "Claude did not return any contract text. Please try again." };
  }

  const text = textBlock.text.trim();
  if (text.startsWith("CANNOT DRAFT:")) {
    return { ok: false, reason: text.replace(/^CANNOT DRAFT:\s*/, "") };
  }

  return { ok: true, text };
}

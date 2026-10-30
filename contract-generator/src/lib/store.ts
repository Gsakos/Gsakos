import fs from "fs";
import path from "path";
import type { Contract } from "./types";

// Simple file-based storage: good enough for local use or a single persistent
// server, and needs zero extra infrastructure. It will NOT survive across
// invocations on a stateless/serverless host (e.g. Vercel) - for that, swap
// this module for a real database (Postgres, SQLite on a persistent volume,
// etc.) while keeping the same getContract/saveContract function signatures.
const DATA_DIR = path.join(process.cwd(), "data", "contracts");

const ID_PATTERN = /^[0-9a-f-]{36}$/i;

function ensureDir() {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
}

function filePath(id: string): string {
  if (!ID_PATTERN.test(id)) {
    throw new Error("Invalid contract id");
  }
  return path.join(DATA_DIR, `${id}.json`);
}

export function saveContract(contract: Contract): void {
  ensureDir();
  fs.writeFileSync(filePath(contract.id), JSON.stringify(contract, null, 2), "utf-8");
}

export function getContract(id: string): Contract | null {
  try {
    const raw = fs.readFileSync(filePath(id), "utf-8");
    return JSON.parse(raw) as Contract;
  } catch {
    return null;
  }
}

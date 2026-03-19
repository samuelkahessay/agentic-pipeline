// ── Compliance Scanner — deterministic rule-based engine ─────────────────────
// Mirrors the ASP.NET C# classification logic from Run 05.
// No LLM calls. Fully synchronous. Returns a disposition + findings array.

export type ComplianceDisposition = "AUTO_BLOCK" | "HUMAN_REQUIRED" | "ADVISORY";
export type ComplianceRegulation = "PIPEDA" | "FINTRAC";
export type FindingSeverity = "Low" | "Medium" | "High" | "Critical";
export type ContentType = "CODE" | "DIFF" | "LOG" | "FREETEXT";

export interface ComplianceFinding {
  id: string;
  regulation: ComplianceRegulation;
  severity: FindingSeverity;
  disposition: ComplianceDisposition;
  ruleId: string;
  description: string;
  lineNumber?: number;
  codeSnippet?: string;
}

export interface ScanResult {
  disposition: ComplianceDisposition;
  findings: ComplianceFinding[];
}

// ── ID helper ─────────────────────────────────────────────────────────────────

function findingId(): string {
  return `f-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
}

// ── Rule definitions ──────────────────────────────────────────────────────────

interface Rule {
  id: string;
  regulation: ComplianceRegulation;
  severity: FindingSeverity;
  disposition: ComplianceDisposition;
  description: string;
  // Pattern is tested against each line and the full content
  pattern: RegExp;
  // Some rules only fire in specific content types (undefined = all types)
  contentTypes?: ContentType[];
}

const RULES: Rule[] = [
  // ── PIPEDA rules ──────────────────────────────────────────────────────────

  {
    id: "PIPEDA-001",
    regulation: "PIPEDA",
    severity: "Critical",
    disposition: "AUTO_BLOCK",
    description: "Email address logged or stored in plaintext — PII exposure violates PIPEDA s.4.7",
    pattern: /[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}/,
    contentTypes: ["LOG", "CODE", "DIFF"],
  },
  {
    id: "PIPEDA-002",
    regulation: "PIPEDA",
    severity: "Critical",
    disposition: "AUTO_BLOCK",
    description:
      "Social Insurance Number (SIN) pattern detected — direct PII disclosure prohibited under PIPEDA s.4.7",
    // Canadian SIN: 9 digits optionally separated by spaces or dashes
    pattern: /\b\d{3}[-\s]?\d{3}[-\s]?\d{3}\b/,
  },
  {
    id: "PIPEDA-003",
    regulation: "PIPEDA",
    severity: "High",
    disposition: "HUMAN_REQUIRED",
    description:
      "Phone number in log context — may constitute PII under PIPEDA depending on associated data",
    pattern: /\b(\+?1[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}\b/,
    contentTypes: ["LOG", "FREETEXT"],
  },
  {
    id: "PIPEDA-004",
    regulation: "PIPEDA",
    severity: "High",
    disposition: "AUTO_BLOCK",
    description:
      "Unencrypted storage reference for personal data — PIPEDA s.4.7 requires appropriate safeguards",
    pattern:
      /\b(password|passwd|secret|credentials?|api_?key|private_?key)\s*[:=]\s*["']?[^\s"']{4,}/i,
  },
  {
    id: "PIPEDA-005",
    regulation: "PIPEDA",
    severity: "Medium",
    disposition: "ADVISORY",
    description:
      "Consent gap: personal data collected without explicit opt-in reference — review PIPEDA Principle 3",
    pattern: /\b(consent|opt[_-]?in|privacy[_-]?policy|gdpr|casl)\b/i,
    contentTypes: ["CODE", "DIFF", "FREETEXT"],
  },
  {
    id: "PIPEDA-006",
    regulation: "PIPEDA",
    severity: "High",
    disposition: "HUMAN_REQUIRED",
    description:
      "Health or medical data reference detected — sensitive personal information under PIPEDA s.4.3.4",
    pattern:
      /\b(health[_\s]?record|medical[_\s]?data|diagnosis|prescription|patient[_\s]?id|dob|date[_\s]?of[_\s]?birth)\b/i,
  },
  {
    id: "PIPEDA-007",
    regulation: "PIPEDA",
    severity: "Low",
    disposition: "ADVISORY",
    description:
      "Data retention policy not referenced — PIPEDA Principle 5 requires defined retention schedules",
    pattern: /\b(retention|purge|delete[_\s]?after|expire[_\s]?at|ttl)\b/i,
    contentTypes: ["CODE", "DIFF", "FREETEXT"],
  },

  // ── FINTRAC rules ─────────────────────────────────────────────────────────

  {
    id: "FINTRAC-001",
    regulation: "FINTRAC",
    severity: "Critical",
    disposition: "AUTO_BLOCK",
    description:
      "Large cash transaction exceeding $10,000 threshold — mandatory reporting under Proceeds of Crime Act s.9",
    // Matches amounts like $10,500 or 15000 CAD or 12500.00
    pattern:
      /\$\s?(1[0-9],\d{3}|[2-9]\d,\d{3}|\d{3},\d{3})|(\b1[0-9]\d{3,}|\b[2-9]\d{4,})\s*(cad|usd|dollars?)?/i,
  },
  {
    id: "FINTRAC-002",
    regulation: "FINTRAC",
    severity: "High",
    disposition: "HUMAN_REQUIRED",
    description:
      "Missing KYC (Know Your Customer) reference in transaction context — FINTRAC requires identity verification",
    pattern: /\b(kyc|know[_\s]?your[_\s]?customer|identity[_\s]?verif|id[_\s]?check|aml)\b/i,
  },
  {
    id: "FINTRAC-003",
    regulation: "FINTRAC",
    severity: "High",
    disposition: "AUTO_BLOCK",
    description:
      "Suspicious transaction pattern: structured splitting to avoid reporting threshold (structuring)",
    // Looking for multiple transactions just under the threshold
    pattern: /\b9[,.]?[0-9]{3}|8[,.]?[0-9]{3}|7[,.]?[0-9]{3}\b.*\b(transaction|transfer|payment)/i,
  },
  {
    id: "FINTRAC-004",
    regulation: "FINTRAC",
    severity: "Medium",
    disposition: "ADVISORY",
    description:
      "Wire transfer reference without beneficiary identification — FINTRAC requires beneficiary data on international transfers",
    pattern: /\b(wire[_\s]?transfer|swift|iban|beneficiary|remittance|cross[_\s]?border)\b/i,
  },
  {
    id: "FINTRAC-005",
    regulation: "FINTRAC",
    severity: "Critical",
    disposition: "AUTO_BLOCK",
    description:
      "Cryptocurrency transaction without FINTRAC registration — virtual asset service providers must register",
    pattern: /\b(bitcoin|btc|ethereum|eth|crypto[_\s]?currency|virtual[_\s]?asset|vasp|wallet[_\s]?address|0x[0-9a-fA-F]{40})\b/i,
  },
  {
    id: "FINTRAC-006",
    regulation: "FINTRAC",
    severity: "High",
    disposition: "HUMAN_REQUIRED",
    description:
      "Politically Exposed Person (PEP) reference without enhanced due diligence — FINTRAC requires EDD for PEPs",
    pattern: /\b(pep|politically[_\s]?exposed|beneficial[_\s]?owner|ultimate[_\s]?beneficial)\b/i,
  },
  {
    id: "FINTRAC-007",
    regulation: "FINTRAC",
    severity: "Low",
    disposition: "ADVISORY",
    description:
      "Anti-money laundering (AML) keyword detected — verify FINTRAC compliance program documentation",
    pattern: /\b(money[_\s]?laundering|terrorist[_\s]?financing|sanctions[_\s]?list|ofac|fintrac[_\s]?report)\b/i,
  },
];

// ── Scanner ───────────────────────────────────────────────────────────────────

export function scanContent(
  content: string,
  contentType: ContentType
): ScanResult {
  const lines = content.split("\n");
  const findings: ComplianceFinding[] = [];
  const firedRules = new Set<string>();

  for (const rule of RULES) {
    // Skip rules that don't apply to this content type
    if (rule.contentTypes && !rule.contentTypes.includes(contentType)) {
      continue;
    }

    // Test line-by-line first to capture line numbers and snippets
    let ruleMatched = false;
    for (let i = 0; i < lines.length; i++) {
      if (rule.pattern.test(lines[i])) {
        if (!firedRules.has(rule.id)) {
          firedRules.add(rule.id);
          findings.push({
            id: findingId(),
            regulation: rule.regulation,
            severity: rule.severity,
            disposition: rule.disposition,
            ruleId: rule.id,
            description: rule.description,
            lineNumber: i + 1,
            codeSnippet: lines[i].trim().slice(0, 120),
          });
          ruleMatched = true;
          break;
        }
      }
    }

    // If no line match, test full content (for multi-line patterns)
    if (!ruleMatched && !firedRules.has(rule.id) && rule.pattern.test(content)) {
      firedRules.add(rule.id);
      findings.push({
        id: findingId(),
        regulation: rule.regulation,
        severity: rule.severity,
        disposition: rule.disposition,
        ruleId: rule.id,
        description: rule.description,
      });
    }
  }

  // ── Disposition classification ────────────────────────────────────────────
  // Critical findings → AUTO_BLOCK (no further review possible)
  // Any HUMAN_REQUIRED finding (and no AUTO_BLOCK) → HUMAN_REQUIRED
  // Otherwise → ADVISORY or CLEAN

  const disposition = classifyDisposition(findings);

  return { disposition, findings };
}

function classifyDisposition(findings: ComplianceFinding[]): ComplianceDisposition {
  if (findings.some((f) => f.disposition === "AUTO_BLOCK")) {
    return "AUTO_BLOCK";
  }
  if (findings.some((f) => f.disposition === "HUMAN_REQUIRED")) {
    return "HUMAN_REQUIRED";
  }
  // All advisory or no findings
  return "ADVISORY";
}

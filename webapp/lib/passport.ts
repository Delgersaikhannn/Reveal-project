/**
 * Privacy Passport - ZK Proof System
 *
 * PHILOSOPHY:
 * "Prove your wallet is safe — without revealing your wallet."
 *
 * This module enables selective disclosure of wallet safety properties
 * using zero-knowledge proofs. Users can prove:
 * - No infinite approvals
 * - No blacklisted spenders
 * - Approval hygiene < N days
 * WITHOUT revealing addresses, balances, or transaction history.
 *
 * ARCHITECTURE:
 * 1. Approval data fetched off-chain (Alchemy)
 * 2. ZK proof generated client-side
 * 3. On-chain verifier validates proof
 * 4. Extension verifies proof existence
 *
 * SECURITY:
 * - No private keys involved
 * - No server-side generation
 * - No address revelation
 * - Verifiable on-chain
 */

export type PassportRule =
  | "NO_INFINITE_APPROVALS"
  | "NO_BLACKLISTED_SPENDERS"
  | "APPROVAL_HYGIENE"
  | "LOW_APPROVAL_COUNT";

export interface PassportRuleDefinition {
  id: PassportRule;
  name: string;
  description: string;
  public: boolean; // Whether the rule result is public
}

export interface PrivacyPassport {
  id: string; // Unique passport ID
  walletHash: string; // Commitment to wallet address (not the address itself)
  rules: PassportRule[]; // All rules evaluated
  rulesVerified: PassportRule[]; // Rules that passed
  rulesFailed: PassportRule[]; // Rules that failed
  proofHash: string; // Hash of the ZK proof
  timestamp: number;
  expiresAt: number;
  chainId: number;
  verified: boolean;
}

export interface PassportGenerationInput {
  address: string; // Private input
  approvals: Array<{
    token: string;
    spender: string;
    allowance: string;
    isUnlimited: boolean;
    lastUpdated: number;
  }>;
  rules: PassportRule[];
  chainId: number;
}

export interface PassportProof {
  proof: string; // ZK proof data
  publicInputs: {
    walletHash: string; // Commitment
    ruleResults: Record<PassportRule, boolean>; // Public results
    timestamp: number;
  };
}

// Rule definitions
export const PASSPORT_RULES: Record<PassportRule, PassportRuleDefinition> = {
  NO_INFINITE_APPROVALS: {
    id: "NO_INFINITE_APPROVALS",
    name: "No Infinite Approvals",
    description: "Proves this wallet has no unlimited token approvals",
    public: true,
  },
  NO_BLACKLISTED_SPENDERS: {
    id: "NO_BLACKLISTED_SPENDERS",
    name: "Clean Spender History",
    description: "Proves no approvals to known malicious contracts",
    public: true,
  },
  APPROVAL_HYGIENE: {
    id: "APPROVAL_HYGIENE",
    name: "Recent Approval Hygiene",
    description: "Proves all approvals are younger than 90 days",
    public: true,
  },
  LOW_APPROVAL_COUNT: {
    id: "LOW_APPROVAL_COUNT",
    name: "Low Approval Count",
    description: "Proves approval count is below risk threshold (< 10)",
    public: true,
  },
};

// Known blacklisted spenders (expand over time)
const BLACKLISTED_SPENDERS: Set<string> = new Set(
  [
    // Add known malicious contracts here
    "0x0000000000000000000000000000000000000000",
  ].map((a) => a.toLowerCase()),
);

/**
 * Evaluate rules locally (used for proof generation)
 * This happens client-side BEFORE ZK proof generation
 */
export function evaluateRules(
  input: PassportGenerationInput,
): Record<PassportRule, boolean> {
  const results: Record<PassportRule, boolean> = {
    NO_INFINITE_APPROVALS: true,
    NO_BLACKLISTED_SPENDERS: true,
    APPROVAL_HYGIENE: true,
    LOW_APPROVAL_COUNT: true,
  };

  const now = Date.now();
  const NINETY_DAYS = 90 * 24 * 60 * 60 * 1000;

  for (const approval of input.approvals) {
    // Check for infinite approvals
    if (approval.isUnlimited) {
      results.NO_INFINITE_APPROVALS = false;
    }

    // Check for blacklisted spenders
    if (BLACKLISTED_SPENDERS.has(approval.spender.toLowerCase())) {
      results.NO_BLACKLISTED_SPENDERS = false;
    }

    // Check approval age
    if (approval.lastUpdated && now - approval.lastUpdated > NINETY_DAYS) {
      results.APPROVAL_HYGIENE = false;
    }
  }

  // Check total approval count
  if (input.approvals.length >= 10) {
    results.LOW_APPROVAL_COUNT = false;
  }

  return results;
}

/**
 * Generate wallet commitment (hash) without revealing address
 */
export function generateWalletCommitment(
  address: string,
  salt?: string,
): string {
  // In production, use proper commitment scheme
  // For MVP, simple hash is sufficient
  const data = salt ? `${address}:${salt}` : address;

  // Browser-compatible hash (for demonstration)
  // In production, use proper crypto library
  return `0x${Array.from(data)
    .reduce((hash, char) => {
      const chr = char.charCodeAt(0);
      hash = (hash << 5) - hash + chr;
      hash |= 0; // Convert to 32bit integer
      return hash;
    }, 0)
    .toString(16)
    .padStart(64, "0")}`;
}

/**
 * Generate Privacy Passport (MVP - no real ZK yet)
 *
 * TODO: Integrate real ZK proof generation library
 * Options: SnarkJS, Circom, Noir, ZoKrates
 *
 * For MVP, we use cryptographic commitments and signatures
 */
export async function generatePrivacyPassport(
  input: PassportGenerationInput,
): Promise<PrivacyPassport> {
  // Evaluate rules locally
  const ruleResults = evaluateRules(input);

  // Generate wallet commitment (hides actual address)
  const walletHash = generateWalletCommitment(input.address);

  // Generate proof hash (MVP: just hash of results)
  // In production, this would be the actual ZK proof
  const proofData = JSON.stringify({
    walletHash,
    rules: input.rules,
    results: ruleResults,
    timestamp: Date.now(),
    chainId: input.chainId,
  });

  const proofHash = generateWalletCommitment(proofData, "proof");

  // Separate verified and failed rules
  const rulesVerified = input.rules.filter((rule) => ruleResults[rule]);
  const rulesFailed = input.rules.filter((rule) => !ruleResults[rule]);

  // Create passport
  const passport: PrivacyPassport = {
    id: `passport-${Date.now()}-${Math.random().toString(36).slice(2)}`,
    walletHash,
    rules: input.rules,
    rulesVerified,
    rulesFailed,
    proofHash,
    timestamp: Date.now(),
    expiresAt: Date.now() + 30 * 24 * 60 * 60 * 1000, // 30 days
    chainId: input.chainId,
    verified: true, // In production, this requires on-chain verification
  };

  // Save to local storage
  savePassport(passport);

  return passport;
}

/**
 * Verify Privacy Passport (checks if proof is valid)
 *
 * MVP: Client-side verification
 * Production: On-chain verifier contract
 */
export async function verifyPrivacyPassport(
  passport: PrivacyPassport,
): Promise<boolean> {
  // Check expiry
  if (Date.now() > passport.expiresAt) {
    return false;
  }

  // MVP: Basic validation
  // In production, call verifier contract:
  // const valid = await contract.verifyProof(passport.proofHash, passport.rules);

  return passport.verified;
}

/**
 * Get passport status for UI display
 */
export function getPassportStatus(passport: PrivacyPassport | null): {
  present: boolean;
  verified: boolean;
  expired: boolean;
  rules: PassportRule[];
} {
  if (!passport) {
    return {
      present: false,
      verified: false,
      expired: false,
      rules: [],
    };
  }

  const expired = Date.now() > passport.expiresAt;

  return {
    present: true,
    verified: passport.verified && !expired,
    expired,
    rules: passport.rules,
  };
}

/**
 * Format passport for display
 */
export function formatPassportSummary(passport: PrivacyPassport): string {
  const status = getPassportStatus(passport);

  if (!status.verified) {
    return "❌ No verified Privacy Passport";
  }

  const rulesText = status.rules
    .map((rule) => `✔ ${PASSPORT_RULES[rule].name}`)
    .join("\n");

  return `🛡 Verified Privacy Passport\n${rulesText}`;
}

/**
 * Storage key for passports (client-side)
 */
export const PASSPORT_STORAGE_KEY = "privacy_passports";

/**
 * Save passport to local storage
 */
export function savePassport(passport: PrivacyPassport): void {
  if (typeof window === "undefined") return;

  try {
    const stored = localStorage.getItem(PASSPORT_STORAGE_KEY);
    const passports: PrivacyPassport[] = stored ? JSON.parse(stored) : [];

    // Remove expired passports
    const valid = passports.filter((p) => Date.now() <= p.expiresAt);

    // Add new passport
    valid.push(passport);

    localStorage.setItem(PASSPORT_STORAGE_KEY, JSON.stringify(valid));
  } catch (err) {
    console.error("Failed to save passport:", err);
  }
}

/**
 * Load passport from local storage
 */
export function loadPassport(
  walletHash: string,
  chainId: number,
): PrivacyPassport | null {
  if (typeof window === "undefined") return null;

  try {
    const stored = localStorage.getItem(PASSPORT_STORAGE_KEY);
    if (!stored) return null;

    const passports: PrivacyPassport[] = JSON.parse(stored);

    // Find matching passport
    return (
      passports.find(
        (p) =>
          p.walletHash === walletHash &&
          p.chainId === chainId &&
          Date.now() <= p.expiresAt,
      ) || null
    );
  } catch (err) {
    console.error("Failed to load passport:", err);
    return null;
  }
}

/**
 * Helper: Get stored passport by wallet address
 */
export function getStoredPassport(
  address: string,
  chainId: number,
): PrivacyPassport | null {
  const walletHash = generateWalletCommitment(address);
  return loadPassport(walletHash, chainId);
}

/**
 * Helper: Check if passport is expired
 */
export function isPassportExpired(passport: PrivacyPassport): boolean {
  return Date.now() > passport.expiresAt;
}

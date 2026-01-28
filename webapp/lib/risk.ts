/**
 * Risk Scoring Engine for Token Approvals
 *
 * Privacy-first, rule-based risk assessment WITHOUT:
 * - External API calls
 * - Simulation engines
 * - Historical analytics
 * - User tracking
 */

export type RiskLevel = "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";

export interface RiskAssessment {
  level: RiskLevel;
  score: number; // 0-100
  reasons: string[];
  badges: string[];
}

export interface ApprovalContext {
  tokenType: "ERC20" | "ERC721" | "ERC1155";
  spender: string;
  allowance?: string;
  isUnlimited: boolean;
  tokenName?: string;
  spenderLabel?: string;
  lastUpdated?: number;
  chainId: number;
}

// Known safe protocols by chain (expandable)
const KNOWN_SAFE_PROTOCOLS: Record<number, Set<string>> = {
  // Ethereum Mainnet
  1: new Set(
    [
      "0x7a250d5630b4cf539739df2c5dacb4c659f2488d", // Uniswap V2 Router
      "0xe592427a0aece92de3edee1f18e0157c05861564", // Uniswap V3 Router
      "0x68b3465833fb72a70ecdf485e0e4c7bd8665fc45", // Uniswap Universal Router
      "0xef1c6e67703c7bd7107eed8303fbe6ec2554bf6b", // Uniswap Universal Router (v2)
      "0x1111111254fb6c44bac0bed2854e76f90643097d", // 1inch v5 Router
      "0x11111112542d85b3ef69ae05771c2dccff4faa26", // 1inch Limit Order Protocol
      "0xdef1c0ded9bec7f1a1670819833240f027b25eff", // 0x Exchange Proxy
      "0x00000000006c3852cbef3e08e8df289169ede581", // OpenSea Seaport 1.1
      "0x00000000000001ad428e4906ae43d8f9852d0dd6", // OpenSea Seaport 1.4
      "0x000000000000ad05ccc4f10045630fb830b95127", // Blur Exchange
    ].map((a) => a.toLowerCase()),
  ),

  // Arbitrum
  42161: new Set(
    [
      "0x68b3465833fb72a70ecdf485e0e4c7bd8665fc45", // Uniswap Universal Router
      "0x1111111254fb6c44bac0bed2854e76f90643097d", // 1inch Router
    ].map((a) => a.toLowerCase()),
  ),

  // Polygon
  137: new Set(
    [
      "0x68b3465833fb72a70ecdf485e0e4c7bd8665fc45", // Uniswap Universal Router
      "0x1111111254fb6c44bac0bed2854e76f90643097d", // 1inch Router
    ].map((a) => a.toLowerCase()),
  ),

  // ApeChain (placeholder)
  33139: new Set(),
};

/**
 * Calculate risk score for an approval
 */
export function calculateRiskScore(context: ApprovalContext): RiskAssessment {
  const reasons: string[] = [];
  const badges: string[] = [];
  let score = 0;

  // 1. Check if unlimited approval
  if (context.isUnlimited) {
    score += 40;
    reasons.push("Unlimited allowance granted");
    badges.push("UNLIMITED");
  } else {
    score += 10;
    reasons.push("Limited allowance");
  }

  // 2. Check if spender is a known safe protocol
  const spenderLower = context.spender.toLowerCase();
  const knownSafe = KNOWN_SAFE_PROTOCOLS[context.chainId]?.has(spenderLower);

  if (knownSafe) {
    score -= 20; // Reduce risk
    reasons.push(`Known protocol: ${context.spenderLabel || "verified"}`);
    badges.push("VERIFIED");
  } else if (!context.spenderLabel) {
    score += 25;
    reasons.push("Unverified contract address");
    badges.push("UNVERIFIED");
  }

  // 3. NFT approvals are inherently higher risk (operator can move all tokens)
  if (context.tokenType === "ERC721" || context.tokenType === "ERC1155") {
    score += 15;
    reasons.push("NFT approval (grants access to all tokens)");
    badges.push("NFT");
  }

  // 4. Check for dormant approvals (older than 90 days)
  if (context.lastUpdated) {
    const ageInDays =
      (Date.now() - context.lastUpdated) / (1000 * 60 * 60 * 24);
    if (ageInDays > 90) {
      score += 15;
      reasons.push(`Dormant approval (${Math.floor(ageInDays)} days old)`);
      badges.push("DORMANT");
    }
  }

  // 5. Determine final risk level
  let level: RiskLevel;
  if (score >= 70) {
    level = "CRITICAL";
  } else if (score >= 50) {
    level = "HIGH";
  } else if (score >= 30) {
    level = "MEDIUM";
  } else {
    level = "LOW";
  }

  return {
    level,
    score: Math.min(100, Math.max(0, score)),
    reasons,
    badges,
  };
}

/**
 * Get risk level color for UI
 */
export function getRiskColor(level: RiskLevel): string {
  switch (level) {
    case "CRITICAL":
      return "text-red-700 bg-red-100";
    case "HIGH":
      return "text-orange-700 bg-orange-100";
    case "MEDIUM":
      return "text-amber-700 bg-amber-100";
    case "LOW":
      return "text-green-700 bg-green-100";
  }
}

/**
 * Get risk level icon
 */
export function getRiskIcon(level: RiskLevel): string {
  switch (level) {
    case "CRITICAL":
      return "🚨";
    case "HIGH":
      return "⚠️";
    case "MEDIUM":
      return "⚡";
    case "LOW":
      return "✓";
  }
}

/**
 * Format risk explanation for user
 */
export function formatRiskExplanation(assessment: RiskAssessment): string {
  return `${getRiskIcon(assessment.level)} ${assessment.level} RISK\n\n${assessment.reasons.join("\n")}`;
}

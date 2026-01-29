export interface TokenApproval {
  tokenAddress: string;
  tokenName: string;
  tokenSymbol: string;
  tokenType: "ERC-20" | "ERC-721" | "ERC-1155";
  spenderAddress: string;
  spenderName: string;
  approvalAmount: string;
  isUnlimited: boolean;
  riskLevel: "low" | "medium" | "high" | "critical";
  lastUpdated?: string; // ISO timestamp
}

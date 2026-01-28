import { encodeFunctionData, parseAbi } from "viem";
import { writeContract } from "@wagmi/core";
import { config } from "./config";

// ERC20 ABI for approve function
const ERC20_ABI = parseAbi([
  "function approve(address spender, uint256 amount) returns (bool)",
  "function allowance(address owner, address spender) view returns (uint256)",
]);

// ERC721 ABI for approval functions
const ERC721_ABI = parseAbi([
  "function setApprovalForAll(address operator, bool approved)",
  "function isApprovedForAll(address owner, address operator) view returns (bool)",
]);

/**
 * Revoke ERC20 token approval
 */
export async function revokeERC20Approval(
  tokenAddress: string,
  spenderAddress: string,
  chainId: number,
): Promise<string> {
  try {
    const hash = await writeContract(config, {
      address: tokenAddress as `0x${string}`,
      abi: ERC20_ABI,
      functionName: "approve",
      args: [spenderAddress as `0x${string}`, BigInt(0)],
      chainId,
    });

    return hash;
  } catch (error) {
    console.error("Error revoking ERC20 approval:", error);
    throw error;
  }
}

/**
 * Revoke ERC721/ERC1155 approval
 */
export async function revokeNFTApproval(
  contractAddress: string,
  operatorAddress: string,
  chainId: number,
): Promise<string> {
  try {
    const hash = await writeContract(config, {
      address: contractAddress as `0x${string}`,
      abi: ERC721_ABI,
      functionName: "setApprovalForAll",
      args: [operatorAddress as `0x${string}`, false],
      chainId,
    });

    return hash;
  } catch (error) {
    console.error("Error revoking NFT approval:", error);
    throw error;
  }
}

/**
 * Batch revoke approvals (sequential for now)
 */
export async function batchRevokeApprovals(
  approvals: Array<{
    tokenAddress: string;
    spenderAddress: string;
    type: "ERC20" | "NFT";
  }>,
  chainId: number,
  onProgress?: (index: number, total: number) => void,
): Promise<string[]> {
  const hashes: string[] = [];

  for (let i = 0; i < approvals.length; i++) {
    const approval = approvals[i];

    try {
      const hash =
        approval.type === "ERC20"
          ? await revokeERC20Approval(
              approval.tokenAddress,
              approval.spenderAddress,
              chainId,
            )
          : await revokeNFTApproval(
              approval.tokenAddress,
              approval.spenderAddress,
              chainId,
            );

      hashes.push(hash);
      onProgress?.(i + 1, approvals.length);
    } catch (error) {
      console.error(`Failed to revoke approval ${i + 1}:`, error);
      // Continue with next approval
    }

    // Add small delay between transactions
    if (i < approvals.length - 1) {
      await new Promise((resolve) => setTimeout(resolve, 1000));
    }
  }

  return hashes;
}

/**
 * Estimate gas for revoke transaction
 */
export async function estimateRevokeGas(
  tokenAddress: string,
  spenderAddress: string,
  isNFT: boolean = false,
): Promise<bigint> {
  // This would use viem's estimateGas function
  // Simplified for now
  return BigInt(isNFT ? 50000 : 45000);
}

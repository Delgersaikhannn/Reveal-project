import { ethers } from "ethers";
import type { TokenApproval } from "@/types/approvals";

export class ApprovalScanner {
  private provider: ethers.JsonRpcProvider;
  private alchemyApiKey: string;
  private alchemyRpcUrl: string;

  constructor(chainId: number = 33139) {
    this.alchemyApiKey = process.env.NEXT_PUBLIC_ALCHEMY_API_KEY || "";

    // Map chain IDs to Alchemy RPC URLs
    const rpcUrls: Record<number, string> = {
      1: `https://eth-mainnet.g.alchemy.com/v2/${this.alchemyApiKey}`,
      137: `https://polygon-mainnet.g.alchemy.com/v2/${this.alchemyApiKey}`,
      42161: `https://arb-mainnet.g.alchemy.com/v2/${this.alchemyApiKey}`,
      33139: `https://apechain-mainnet.g.alchemy.com/v2/${this.alchemyApiKey}`, // ApeChain
    };

    this.alchemyRpcUrl = rpcUrls[chainId] || rpcUrls[33139];
    this.provider = new ethers.JsonRpcProvider(this.alchemyRpcUrl);
  }

  async scanWallet(walletAddress: string): Promise<TokenApproval[]> {
    try {
      console.log(`Scanning approvals for ${walletAddress}...`);

      // Fetch approval events using eth_getLogs
      const approvals = await this.fetchApprovalEvents(walletAddress);

      console.log(`Found ${approvals.length} active approvals`);
      return approvals;
    } catch (error) {
      console.error("Error scanning wallet:", error);
      throw error;
    }
  }

  private async fetchApprovalEvents(
    walletAddress: string,
  ): Promise<TokenApproval[]> {
    const approvals: TokenApproval[] = [];

    // ERC20 Approval event signature
    // event Approval(address indexed owner, address indexed spender, uint256 value)
    const ERC20_APPROVAL_TOPIC =
      "0x8c5be1e5ebec7d5bd14f71427d1e84f3dd0314c0f7b2291e5b200ac8c7c3b925";

    // ERC721 ApprovalForAll event signature
    // event ApprovalForAll(address indexed owner, address indexed operator, bool approved)
    const ERC721_APPROVAL_FOR_ALL_TOPIC =
      "0x17307eab39ab6107e8899845ad3d59bd9653f200f220920489ca2b5937696c31";

    // Convert address to topic format (pad to 32 bytes)
    const addressTopic = `0x${walletAddress.slice(2).padStart(64, "0")}`;

    try {
      // Fetch ERC20 Approval events
      const erc20Logs = await this.provider.send("eth_getLogs", [
        {
          fromBlock: "0x0", // From genesis
          toBlock: "latest",
          topics: [
            ERC20_APPROVAL_TOPIC, // event signature
            addressTopic, // owner (indexed parameter 1)
          ],
        },
      ]);

      console.log(`Found ${erc20Logs.length} ERC20 approval events`);

      // Fetch ERC721 ApprovalForAll events
      const erc721Logs = await this.provider.send("eth_getLogs", [
        {
          fromBlock: "0x0",
          toBlock: "latest",
          topics: [
            ERC721_APPROVAL_FOR_ALL_TOPIC,
            addressTopic, // owner
          ],
        },
      ]);

      console.log(`Found ${erc721Logs.length} ERC721 ApprovalForAll events`);

      // Process ERC20 approvals - check current allowance on-chain
      const uniqueApprovals = new Map<string, any>();

      for (const log of erc20Logs) {
        const tokenAddress = log.address;
        // Spender is the 2nd indexed parameter
        const spender = `0x${log.topics[2].slice(26)}`;

        const key = `${tokenAddress}-${spender}`;

        // Keep only the most recent approval per token-spender pair
        if (!uniqueApprovals.has(key)) {
          uniqueApprovals.set(key, { log, tokenAddress, spender });
        }
      }

      console.log(
        `Processing ${uniqueApprovals.size} unique token-spender pairs...`,
      );

      // Check current on-chain allowances
      for (const { tokenAddress, spender, log } of uniqueApprovals.values()) {
        try {
          // Query current allowance
          const allowance = await this.getCurrentAllowance(
            tokenAddress,
            walletAddress,
            spender,
          );

          // Skip if allowance is 0
          if (allowance === 0n) continue;

          const metadata = await this.getTokenMetadata(tokenAddress);
          const decimals = metadata.decimals || 18;
          const formattedAmount = ethers.formatUnits(allowance, decimals);

          const maxUint256 = BigInt(
            "115792089237316195423570985008687907853269984665640564039457584007913129639935",
          );
          const isUnlimited = allowance >= maxUint256 / 2n;

          approvals.push({
            tokenAddress,
            tokenName: metadata.name || "Unknown Token",
            tokenSymbol: metadata.symbol || "???",
            tokenType: "ERC-20",
            spenderAddress: spender,
            spenderName: this.getSpenderName(spender),
            approvalAmount: isUnlimited ? "Unlimited" : formattedAmount,
            isUnlimited,
            riskLevel: this.calculateRiskLevel(isUnlimited, spender),
            lastUpdated: new Date(
              Number(ethers.getBigInt(log.blockNumber) * 12n) * 1000,
            ).toISOString(), // Approximate timestamp
          });
        } catch (error) {
          console.error(`Error checking allowance for ${tokenAddress}:`, error);
          continue;
        }
      }

      // Process ERC721 ApprovalForAll
      const uniqueNftApprovals = new Map<string, any>();

      for (const log of erc721Logs) {
        const tokenAddress = log.address;
        const operator = `0x${log.topics[2].slice(26)}`;
        const key = `${tokenAddress}-${operator}`;

        if (!uniqueNftApprovals.has(key)) {
          uniqueNftApprovals.set(key, { log, tokenAddress, operator });
        }
      }

      for (const {
        tokenAddress,
        operator,
        log,
      } of uniqueNftApprovals.values()) {
        try {
          // Check if still approved
          const isApproved = await this.isApprovedForAll(
            tokenAddress,
            walletAddress,
            operator,
          );

          if (!isApproved) continue;

          const metadata = await this.getTokenMetadata(tokenAddress);

          approvals.push({
            tokenAddress,
            tokenName: metadata.name || "Unknown NFT",
            tokenSymbol: metadata.symbol || "NFT",
            tokenType: "ERC-721",
            spenderAddress: operator,
            spenderName: this.getSpenderName(operator),
            approvalAmount: "All NFTs",
            isUnlimited: true,
            riskLevel: this.calculateRiskLevel(true, operator),
            lastUpdated: new Date(
              Number(ethers.getBigInt(log.blockNumber) * 12n) * 1000,
            ).toISOString(),
          });
        } catch (error) {
          console.error(
            `Error checking NFT approval for ${tokenAddress}:`,
            error,
          );
          continue;
        }
      }
    } catch (error) {
      console.error("Error fetching approval events:", error);
    }

    return approvals;
  }

  // Query current ERC20 allowance
  private async getCurrentAllowance(
    tokenAddress: string,
    owner: string,
    spender: string,
  ): Promise<bigint> {
    const ERC20_ABI = [
      "function allowance(address,address) view returns (uint256)",
    ];
    const contract = new ethers.Contract(
      tokenAddress,
      ERC20_ABI,
      this.provider,
    );
    return await contract.allowance(owner, spender);
  }

  // Query ERC721 isApprovedForAll
  private async isApprovedForAll(
    tokenAddress: string,
    owner: string,
    operator: string,
  ): Promise<boolean> {
    const ERC721_ABI = [
      "function isApprovedForAll(address,address) view returns (bool)",
    ];
    const contract = new ethers.Contract(
      tokenAddress,
      ERC721_ABI,
      this.provider,
    );
    return await contract.isApprovedForAll(owner, operator);
  }

  private async getTokenMetadata(tokenAddress: string): Promise<{
    name: string | null;
    symbol: string | null;
    decimals: number | null;
  }> {
    try {
      const response = await fetch(this.alchemyRpcUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          jsonrpc: "2.0",
          id: 1,
          method: "alchemy_getTokenMetadata",
          params: [tokenAddress],
        }),
      });

      const data = await response.json();
      return {
        name: data.result?.name || null,
        symbol: data.result?.symbol || null,
        decimals: data.result?.decimals || null,
      };
    } catch (error) {
      return { name: null, symbol: null, decimals: null };
    }
  }

  private getKnownSpenders(): Record<string, string> {
    return {
      "0x68b3465833fb72a70ecdf485e0e4c7bd8665fc45": "Uniswap V3 Router 2",
      "0x7a250d5630b4cf539739df2c5dacb4c659f2488d": "Uniswap V2 Router",
      "0xdef1c0ded9bec7f1a1670819833240f027b25eff": "0x Exchange Proxy",
      "0x1111111254eeb25477b68fb85ed929f73a960582": "1inch V5 Router",
      "0x00000000006c3852cbef3e08e8df289169ede581": "OpenSea Seaport",
      "0x1e0049783f008a0085193e00003d00cd54003c71": "OpenSea Seaport 1.5",
      "0x00000000000000adc04c56bf30ac9d3c0aaf14dc": "OpenSea Seaport 1.4",
      "0xe592427a0aece92de3edee1f18e0157c05861564": "Uniswap V3 Router",
      "0x3fc91a3afd70395cd496c647d5a6cc9d4b2b7fad": "Uniswap Universal Router",
    };
  }

  private getSpenderName(spenderAddress: string): string {
    const knownSpenders = this.getKnownSpenders();
    return knownSpenders[spenderAddress.toLowerCase()] || spenderAddress;
  }

  private calculateRiskLevel(
    isUnlimited: boolean,
    spenderAddress: string,
  ): "low" | "medium" | "high" | "critical" {
    const spenderName = this.getSpenderName(spenderAddress);

    if (isUnlimited) {
      // Known reputable protocols
      const trustedProtocols = ["Uniswap", "1inch", "OpenSea"];
      const isTrusted = trustedProtocols.some((protocol) =>
        spenderName.includes(protocol),
      );

      return isTrusted ? "medium" : "high";
    }

    return "low";
  }

  async revokeApproval(
    tokenAddress: string,
    spenderAddress: string,
    signer: ethers.Signer,
  ): Promise<ethers.TransactionResponse> {
    const tokenContract = new ethers.Contract(
      tokenAddress,
      ["function approve(address spender, uint256 amount) returns (bool)"],
      signer,
    );

    return await tokenContract.approve(spenderAddress, 0);
  }
}

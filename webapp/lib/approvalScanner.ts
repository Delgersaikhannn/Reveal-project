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
      const approvals: TokenApproval[] = [];

      // Scan token/NFT approvals via Alchemy transfers API (supports approvals)
      const transferApprovals = await this.scanApprovals(walletAddress);
      approvals.push(...transferApprovals);

      console.log(`Found ${approvals.length} active approvals`);
      return approvals;
    } catch (error) {
      console.error("Error scanning wallet:", error);
      throw error;
    }
  }

  private async scanApprovals(walletAddress: string): Promise<TokenApproval[]> {
    const approvals: TokenApproval[] = [];

    // Alchemy supports approval events via getAssetTransfers with approval categories
    // Categories: erc20_approval, erc721_approval, erc1155_approval
    let pageKey: string | undefined;
    let pages = 0;
    const maxPages = 5; // safety cap

    do {
      const body = {
        jsonrpc: "2.0",
        id: 1,
        method: "alchemy_getAssetTransfers",
        params: [
          {
            fromAddress: walletAddress,
            category: ["erc20", "erc721", "erc1155"],
            withMetadata: false,
            maxCount: "0x64", // 100 per page
            pageKey,
          },
        ],
      };

      const response = await fetch(this.alchemyRpcUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      const data = await response.json();

      if (data.error) {
        console.error("Alchemy approvals API error:", data.error);
        break;
      }

      const transfers = data.result?.transfers || [];

      for (const tx of transfers) {
        const tokenAddress = tx.rawContract?.address;
        const spender = tx.to || tx.rawContract?.to || tx.toAddress;
        if (!tokenAddress || !spender) continue;

        const tokenType = this.getTokenTypeFromCategory(tx.category);

        try {
          const metadata = await this.getTokenMetadata(tokenAddress);

          let formattedAmount = "All";
          let isUnlimited = true;

          if (tokenType === "ERC-20" && tx.rawContract?.value) {
            const valueBN = BigInt(tx.rawContract.value);
            const decimals = metadata.decimals || 18;
            formattedAmount = ethers.formatUnits(valueBN, decimals);

            const maxUint256 = BigInt(
              "115792089237316195423570985008687907853269984665640564039457584007913129639935",
            );
            isUnlimited = valueBN >= maxUint256 / 2n;
          }

          approvals.push({
            tokenAddress,
            tokenName: metadata.name || "Unknown Token",
            tokenSymbol:
              metadata.symbol || (tokenType === "ERC-20" ? "???" : "NFT"),
            tokenType,
            spenderAddress: spender,
            spenderName: this.getSpenderName(spender),
            approvalAmount:
              tokenType === "ERC-20" ? formattedAmount : "All NFTs",
            isUnlimited,
            riskLevel: this.calculateRiskLevel(isUnlimited, spender),
          });
        } catch (error) {
          console.error("Error processing approval transfer:", error);
          continue;
        }
      }

      pageKey = data.result?.pageKey;
      pages += 1;
    } while (pageKey && pages < maxPages);

    return approvals;
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

  private getTokenTypeFromCategory(
    category: string,
  ): "ERC-20" | "ERC-721" | "ERC-1155" {
    if (category === "erc20" || category === "erc20_approval") return "ERC-20";
    if (category === "erc1155" || category === "erc1155_approval")
      return "ERC-1155";
    return "ERC-721";
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

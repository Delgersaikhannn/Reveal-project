import { Alchemy, Network } from "alchemy-sdk";
import { createPublicClient, http, erc20Abi } from "viem";
import { erc721Abi, erc1155Abi } from "viem";
import { mainnet, arbitrum, polygon } from "wagmi/chains";
import { ALCHEMY_NETWORKS, apechain } from "./config";
import type { Chain } from "viem";

const API_KEY = process.env.NEXT_PUBLIC_ALCHEMY_API_KEY || "";

// Cache Alchemy instances per network
const alchemyInstances = new Map<number, Alchemy>();
const publicClients = new Map<number, ReturnType<typeof createPublicClient>>();

const CHAIN_BY_ID: Record<number, Chain> = {
  [mainnet.id]: mainnet,
  [arbitrum.id]: arbitrum,
  [polygon.id]: polygon,
  [apechain.id]: apechain,
};

// Known spender contracts to scan initially (expand over time)
const KNOWN_SPENDERS: Record<
  number,
  Array<{ address: string; label: string }>
> = {
  [mainnet.id]: [
    {
      address: "0x7a250d5630b4cf539739df2c5dacb4c659f2488d",
      label: "Uniswap V2",
    },
    {
      address: "0xe592427a0aece92de3edee1f18e0157c05861564",
      label: "Uniswap V3",
    },
    {
      address: "0x1111111254fb6c44bac0bed2854e76f90643097d",
      label: "1inch Router",
    },
    {
      address: "0xdef1c0ded9bec7f1a1670819833240f027b25eff",
      label: "0x Exchange",
    },
    {
      address: "0x68b3465833fb72a70ecdf485e0e4c7bd8665fc45",
      label: "Uniswap Universal",
    },
    {
      address: "0x11111112542d85b3ef69ae05771c2dccff4faa26",
      label: "1inch Limit",
    },
  ],
  [arbitrum.id]: [
    {
      address: "0x68b3465833fb72a70ecdf485e0e4c7bd8665fc45",
      label: "Uniswap Universal",
    },
    {
      address: "0x1111111254fb6c44bac0bed2854e76f90643097d",
      label: "1inch Router",
    },
  ],
  [polygon.id]: [
    {
      address: "0x68b3465833fb72a70ecdf485e0e4c7bd8665fc45",
      label: "Uniswap Universal",
    },
    {
      address: "0x1111111254fb6c44bac0bed2854e76f90643097d",
      label: "1inch Router",
    },
  ],
  [apechain.id]: [],
};

// Known NFT operators (marketplaces, aggregators)
const KNOWN_NFT_OPERATORS: Record<
  number,
  Array<{ address: string; label: string }>
> = {
  [mainnet.id]: [
    {
      address: "0x00000000006c3852cbEf3e08E8dF289169EdE581",
      label: "OpenSea Seaport",
    },
    {
      address: "0x000000000000ad05ccc4f10045630fb830b95127",
      label: "Blur Exchange",
    },
  ],
  [arbitrum.id]: [
    {
      address: "0x000000000000ad05ccc4f10045630fb830b95127",
      label: "Blur Exchange",
    },
  ],
  [polygon.id]: [
    {
      address: "0x00000000006c3852cbEf3e08E8dF289169EdE581",
      label: "OpenSea Seaport",
    },
  ],
  [apechain.id]: [],
};

// Simple concurrency limiter
async function mapWithConcurrency<T, R>(
  items: T[],
  limit: number,
  fn: (item: T, index: number) => Promise<R>,
): Promise<R[]> {
  const results: R[] = [];
  let i = 0;

  async function worker() {
    while (i < items.length) {
      const current = i++;
      results[current] = await fn(items[current], current);
    }
  }

  const workers = Array.from({ length: Math.min(limit, items.length) }, () =>
    worker(),
  );
  await Promise.all(workers);
  return results;
}

export function getRpcUrl(chainId: number): string {
  const network = ALCHEMY_NETWORKS[chainId];
  if (network) {
    return `https://${network}.g.alchemy.com/v2/${API_KEY}`;
  }

  // Fallback for custom chains (e.g., ApeChain)
  if (chainId === apechain.id) {
    const rpc = process.env.NEXT_PUBLIC_APECHAIN_RPC_URL;
    if (!rpc) {
      throw new Error("Missing NEXT_PUBLIC_APECHAIN_RPC_URL for ApeChain");
    }
    return rpc;
  }

  throw new Error(`Unsupported chain ID: ${chainId}`);
}

function getPublicClient(chainId: number) {
  if (publicClients.has(chainId)) {
    return publicClients.get(chainId)!;
  }

  const chain = CHAIN_BY_ID[chainId];
  if (!chain) throw new Error(`Unsupported chain ID: ${chainId}`);

  const client = createPublicClient({
    chain,
    transport: http(getRpcUrl(chainId)),
  });

  publicClients.set(chainId, client);
  return client;
}

export function getAlchemyInstance(chainId: number): Alchemy {
  if (alchemyInstances.has(chainId)) {
    return alchemyInstances.get(chainId)!;
  }

  const networkName = ALCHEMY_NETWORKS[chainId];
  if (!networkName) {
    throw new Error(`Alchemy not configured for chain ID: ${chainId}`);
  }

  // Map network name to Alchemy Network enum
  const networkMap: Record<string, Network> = {
    "eth-mainnet": Network.ETH_MAINNET,
    "arb-mainnet": Network.ARB_MAINNET,
    "apechain-mainnet": Network.ETH_MAINNET, // ApeChain not supported by Alchemy; placeholder to avoid crashes
  };

  const alchemy = new Alchemy({
    apiKey: API_KEY,
    network: networkMap[networkName],
  });

  alchemyInstances.set(chainId, alchemy);
  return alchemy;
}

export interface TokenApproval {
  token: string;
  tokenName?: string;
  tokenSymbol?: string;
  decimals?: number;
  logo?: string | null;
  spender: string;
  spenderLabel?: string;
  allowance: string;
  isUnlimited: boolean;
  lastUpdated?: number;
}

export interface NFTApproval {
  contract: string;
  tokenType: "ERC721" | "ERC1155";
  operator: string;
  approved: boolean;
  tokenId?: string;
  operatorLabel?: string;
}

// Alchemy getAssetTransfers allowed categories (no dedicated approval category)
// We use standard transfer categories to avoid RPC errors. Note: this will NOT return approvals; keep allowance/isApproved checks as primary signal.
const APPROVAL_CATEGORIES = ["erc20", "erc721", "erc1155"] as const;

/**
 * Fetch ERC20 token approvals for an address
 */
export async function fetchTokenApprovals(
  address: string,
  chainId: number,
): Promise<TokenApproval[]> {
  try {
    const alchemy = getAlchemyInstance(chainId);
    const publicClient = getPublicClient(chainId);
    const knownSpenders = KNOWN_SPENDERS[chainId] || [];

    // Get token balances
    const balances = await alchemy.core.getTokenBalances(address);
    const approvals: TokenApproval[] = [];

    // Only consider tokens with a balance entry
    const tokenEntries = balances.tokenBalances.filter(
      (t) => t.tokenBalance && t.contractAddress,
    );

    await mapWithConcurrency(tokenEntries, 5, async (tokenEntry) => {
      const tokenAddress = tokenEntry.contractAddress as `0x${string}`;
      const tokenBalance = tokenEntry.tokenBalance || "0";

      if (tokenBalance === "0") return;

      const metadata = await alchemy.core.getTokenMetadata(tokenAddress);

      await mapWithConcurrency(knownSpenders, 5, async (spender) => {
        try {
          const allowance = await publicClient.readContract({
            address: tokenAddress,
            abi: erc20Abi,
            functionName: "allowance",
            args: [address as `0x${string}`, spender.address as `0x${string}`],
          });

          if (allowance > BigInt(0)) {
            const allowanceStr = allowance.toString();
            approvals.push({
              token: tokenAddress,
              tokenName: metadata.name || undefined,
              tokenSymbol: metadata.symbol || undefined,
              decimals: metadata.decimals ?? undefined,
              logo: metadata.logo || null,
              spender: spender.address,
              spenderLabel: spender.label,
              allowance: allowanceStr,
              isUnlimited: isUnlimitedAllowance(allowanceStr),
              lastUpdated: Date.now(),
            });
          }
        } catch (err) {
          console.warn(`Allowance read failed for ${tokenAddress}`, err);
        }
      });
    });

    return approvals;
  } catch (error) {
    console.error("Error fetching token approvals:", error);
    throw error;
  }
}

/**
 * Fetch NFT approvals (setApprovalForAll) for known operators
 */
export async function fetchNFTApprovals(
  address: string,
  chainId: number,
): Promise<NFTApproval[]> {
  const alchemy = getAlchemyInstance(chainId);
  const publicClient = getPublicClient(chainId);
  const operators = KNOWN_NFT_OPERATORS[chainId] || [];

  const nftResponse = await alchemy.nft.getNftsForOwner(address, {
    pageSize: 50,
  });

  const contracts = Array.from(
    new Set(nftResponse.ownedNfts.map((nft) => nft.contract.address)),
  ) as `0x${string}`[];

  const results: NFTApproval[] = [];

  await mapWithConcurrency(contracts, 5, async (contract) => {
    const contractNfts = nftResponse.ownedNfts.filter(
      (nft) => nft.contract.address === contract,
    );
    const sample = contractNfts[0];
    const tokenType = sample.contract.tokenType;
    const isErc721 = tokenType === "ERC721";
    const isErc1155 = tokenType === "ERC1155";
    if (!isErc721 && !isErc1155) return;

    const abi = isErc721 ? erc721Abi : erc1155Abi;

    await mapWithConcurrency(operators, 5, async (op) => {
      try {
        const approved = (await publicClient.readContract({
          address: contract,
          abi,
          functionName: "isApprovedForAll",
          args: [address as `0x${string}`, op.address as `0x${string}`],
        })) as boolean;

        if (approved) {
          results.push({
            contract,
            tokenType: isErc721 ? "ERC721" : "ERC1155",
            operator: op.address,
            operatorLabel: op.label,
            approved: true,
          });
        }
      } catch (err) {
        console.warn(`NFT approval read failed for ${contract}`, err);
      }
    });
  });

  return results;
}

/**
 * Fetch events via Alchemy getAssetTransfers (transfer categories only).
 * Note: This endpoint does not expose approval-only categories; use allowance/isApprovedForAll for true approval detection.
 */
export async function fetchApprovalsViaTransfers(
  address: string,
  chainId: number,
  maxPages: number = 5,
): Promise<{ erc20: TokenApproval[]; nft: NFTApproval[] }> {
  if (!API_KEY) {
    throw new Error("Missing NEXT_PUBLIC_ALCHEMY_API_KEY env value");
  }

  const rpcUrl = getRpcUrl(chainId);
  const alchemy = getAlchemyInstance(chainId);

  let pageKey: string | undefined;
  let pages = 0;
  const erc20: TokenApproval[] = [];
  const nft: NFTApproval[] = [];

  // Dedup maps
  const erc20Seen = new Set<string>();
  const nftSeen = new Set<string>();

  do {
    const body = {
      jsonrpc: "2.0",
      id: 1,
      method: "alchemy_getAssetTransfers",
      params: [
        {
          fromAddress: address,
          category: APPROVAL_CATEGORIES,
          withMetadata: false,
          maxCount: "0x64", // 100 per page
          pageKey,
        },
      ],
    };

    const resp = await fetch(rpcUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify(body),
    });

    const text = await resp.text();
    if (!resp.ok) {
      throw new Error(
        `Alchemy RPC error ${resp.status}: ${text.slice(0, 200)}`,
      );
    }

    let data: any;
    try {
      data = JSON.parse(text);
    } catch (parseErr) {
      throw new Error(
        `Failed to parse Alchemy response: ${text.slice(0, 200)}`,
      );
    }

    if (data.error) {
      console.error("Alchemy approvals API error:", data.error);
      break;
    }

    const transfers = data.result?.transfers || [];

    for (const tx of transfers) {
      const tokenAddress = tx.rawContract?.address as string | undefined;
      const spender =
        tx.to || tx.toAddress || (tx.rawContract && tx.rawContract.to);
      if (!tokenAddress || !spender) continue;

      const category = tx.category as (typeof APPROVAL_CATEGORIES)[number];

      if (category === "erc20") {
        const key = `${tokenAddress.toLowerCase()}-${spender.toLowerCase()}`;
        if (erc20Seen.has(key)) continue;

        const metadata = await alchemy.core.getTokenMetadata(
          tokenAddress as `0x${string}`,
        );
        const valueHex = tx.rawContract?.value as string | undefined;
        const value = valueHex ? BigInt(valueHex) : BigInt(0);
        const decimals = metadata.decimals ?? 18;
        const allowanceStr = value.toString();
        erc20Seen.add(key);

        erc20.push({
          token: tokenAddress,
          tokenName: metadata.name || undefined,
          tokenSymbol: metadata.symbol || undefined,
          decimals,
          logo: metadata.logo || null,
          spender,
          spenderLabel: getKnownSpenderLabel(spender),
          allowance: allowanceStr,
          isUnlimited: isUnlimitedAllowance(allowanceStr),
          lastUpdated: Date.now(),
        });
      } else {
        const key = `${tokenAddress.toLowerCase()}-${spender.toLowerCase()}`;
        if (nftSeen.has(key)) continue;
        nftSeen.add(key);

        const tokenType = category === "erc1155" ? "ERC1155" : "ERC721";
        nft.push({
          contract: tokenAddress,
          tokenType,
          operator: spender,
          operatorLabel: getKnownNftOperatorLabel(chainId, spender),
          approved: true,
        });
      }
    }

    pageKey = data.result?.pageKey;
    pages += 1;
  } while (pageKey && pages < maxPages);

  return { erc20, nft };
}

function getKnownSpenderLabel(address: string): string | undefined {
  const lower = address.toLowerCase();
  const all = Object.values(KNOWN_SPENDERS).flat();
  const match = all.find((s) => s.address.toLowerCase() === lower);
  return match?.label;
}

function getKnownNftOperatorLabel(
  chainId: number,
  address: string,
): string | undefined {
  const lower = address.toLowerCase();
  const ops = KNOWN_NFT_OPERATORS[chainId] || [];
  const match = ops.find((o) => o.address.toLowerCase() === lower);
  return match?.label;
}

/**
 * Check if an allowance is considered "unlimited"
 */
export function isUnlimitedAllowance(allowance: string): boolean {
  const threshold = BigInt("0xffffffffffffffffffffffffffffffff"); // 2^128 - 1
  try {
    return BigInt(allowance) >= threshold;
  } catch {
    return false;
  }
}

/**
 * Format allowance for display
 */
export function formatAllowance(
  allowance: string,
  decimals: number = 18,
): string {
  try {
    const value = BigInt(allowance);
    if (isUnlimitedAllowance(allowance)) {
      return "Unlimited";
    }

    // Convert to decimal
    const divisor = BigInt(10 ** decimals);
    const formatted = Number(value) / Number(divisor);

    if (formatted > 1e6) {
      return `${(formatted / 1e6).toFixed(2)}M`;
    }
    if (formatted > 1e3) {
      return `${(formatted / 1e3).toFixed(2)}K`;
    }
    return formatted.toFixed(4);
  } catch {
    return "Unknown";
  }
}

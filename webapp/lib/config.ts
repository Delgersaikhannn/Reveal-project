import { http, createConfig } from "wagmi";
import { mainnet, arbitrum, polygon } from "wagmi/chains";
import { injected, walletConnect } from "wagmi/connectors";
import type { Chain } from "wagmi";

const projectId = process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID || "";

// ApeChain (custom) - update RPC via env
export const apechain: Chain = {
  id: 33111,
  name: "ApeChain",
  nativeCurrency: { name: "ApeCoin", symbol: "APE", decimals: 18 },
  rpcUrls: {
    default: {
      http: [process.env.NEXT_PUBLIC_APECHAIN_RPC_URL || ""],
    },
    public: {
      http: [process.env.NEXT_PUBLIC_APECHAIN_RPC_URL || ""],
    },
  },
  blockExplorers: {
    default: {
      name: "ApeChain Explorer",
      url: "https://apescan.xyz/",
    },
  },
};

export const config = createConfig({
  chains: [mainnet, arbitrum, polygon, apechain],
  connectors: [
    injected(),
    walletConnect({
      projectId,
      showQrModal: true,
    }),
  ],
  transports: {
    [mainnet.id]: http(),
    [arbitrum.id]: http(),
    [polygon.id]: http(),
    [apechain.id]: http(process.env.NEXT_PUBLIC_APECHAIN_RPC_URL || ""),
  },
});

// Chain display names
export const CHAIN_NAMES: Record<number, string> = {
  [mainnet.id]: "Ethereum",
  [arbitrum.id]: "Arbitrum",
  [polygon.id]: "Polygon",
  [apechain.id]: "ApeChain",
};

// Alchemy network mapping
export const ALCHEMY_NETWORKS: Record<number, string> = {
  [mainnet.id]: "eth-mainnet",
  [arbitrum.id]: "arb-mainnet",
  [apechain.id]: "apechain-mainnet",
};

declare module "wagmi" {
  interface Register {
    config: typeof config;
  }
}

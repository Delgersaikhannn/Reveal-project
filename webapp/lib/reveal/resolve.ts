import { ethers } from "ethers";
import type { ResolvedIdentity } from "@/types/reveal";
import { getRpcUrl } from "../alchemy";

// ENS text record keys we care about
const ENS_TEXT_RECORDS = [
  "email",
  "url",
  "avatar",
  "description",
  "com.twitter",
  "com.github",
  "com.telegram",
  "org.telegram",
  "com.discord",
  "com.reddit",
  "com.lens",
  "com.farcaster",
  "eth.ens.delegate",
] as const;

/**
 * Resolve ENS name or address to normalized identity
 */
export async function getResolvedIdentity(input: {
  ens?: string | null;
  address?: string | null;
}): Promise<ResolvedIdentity> {
  const { ens, address } = input;

  if (!ens && !address) {
    throw new Error("Either ENS name or address must be provided");
  }

  // Use Ethereum mainnet for ENS resolution
  const mainnetRpcUrl = getRpcUrl(1);
  const provider = new ethers.JsonRpcProvider(mainnetRpcUrl);

  let resolvedAddress: string | null = null;
  let resolvedEns: string | null = null;
  let displayName: string = "";

  // If ENS provided, resolve to address
  if (ens) {
    try {
      resolvedAddress = await provider.resolveName(ens);
      resolvedEns = ens;
      displayName = ens;
    } catch (error) {
      console.warn(`Failed to resolve ENS ${ens}:`, error);
      // Fall back to address if provided
      if (address) {
        resolvedAddress = address.toLowerCase();
        displayName = address;
      } else {
        throw new Error(`Failed to resolve ENS ${ens} and no address provided`);
      }
    }
  }

  // If address provided but no ENS, try reverse lookup
  if (!resolvedEns && address) {
    resolvedAddress = address.toLowerCase();
    try {
      resolvedEns = await provider.lookupAddress(address);
      displayName = resolvedEns || address;
    } catch (error) {
      console.warn(`Failed to reverse lookup address ${address}:`, error);
      displayName = address;
    }
  }

  if (!resolvedAddress) {
    throw new Error("Could not resolve address");
  }

  // Fetch ENS text records if we have an ENS name
  const textRecords: Record<string, string | null> = {};
  if (resolvedEns) {
    try {
      const resolver = await provider.getResolver(resolvedEns);
      if (resolver) {
        // Fetch all text records in parallel
        const recordPromises = ENS_TEXT_RECORDS.map(async (key) => {
          try {
            const value = await resolver.getText(key);
            return { key, value };
          } catch (error) {
            console.warn(`Failed to fetch ENS text record ${key}:`, error);
            return { key, value: null };
          }
        });

        const records = await Promise.all(recordPromises);
        records.forEach(({ key, value }) => {
          textRecords[key] = value;
        });
      }
    } catch (error) {
      console.warn(`Failed to get resolver for ${resolvedEns}:`, error);
    }
  }

  return {
    address: resolvedAddress,
    ens: resolvedEns,
    displayName,
    textRecords,
  };
}

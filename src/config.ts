import { parseUnits, zeroAddress } from "viem";
import type { ChainMetadata, PluginConfig, SupportedToken } from "./types.js";
import { DEFAULT_CONFIG } from "./constants.js";

export const getSupportedChains = async (): Promise<Array<ChainMetadata>> => {
  try {
    const { chains } = await fetch(`${DEFAULT_CONFIG.lifiBaseUrl}/chains`).then((res) => res.json()) as { chains: ChainMetadata[] };
    const evmChains = chains.filter((chain) => chain.chainType === "EVM");
    return evmChains; 
  } catch (error) {
    console.error("Error fetching supported chains:", error);
    throw new Error("Unable to load supported chains from LI.FI");
  }
};

export const getSupportedTokens = async (chain: number): Promise<SupportedToken[]> => {
  try {
    const { tokens } = await fetch(`${DEFAULT_CONFIG.lifiBaseUrl}/tokens`).then((res) => res.json());
    return (tokens[chain] ?? []) as SupportedToken[];
  } catch (error) {
    console.error("Error fetching supported tokens:", error);
    throw new Error("Unable to load supported tokens from LI.FI");
  }
};

// export const pluginConfigSchema = {
//   type: "object",
//   properties: {
//     lifiApiKey: { type: "string" },
//     lifiBaseUrl: { type: "string", default: "https://li.quest/v1" },
//     integrator: { type: "string", default: "openclaw-intent-transfer" },
//     defaultSlippageBps: { type: "integer", default: 100 },
//     rpcUrls: {
//       type: "object",
//       properties: {
//         ethereum: { type: "string", default: "https://cloudflare-eth.com/v1/mainnet" },
//         base: { type: "string", default: "https://mainnet.base.org" },
//         arbitrum: { type: "string", default: "https://arb1.arbitrum.io/rpc" },
//         optimism: { type: "string", default: "https://mainnet.optimism.io" },
//         polygon: { type: "string", default: "https://polygon.drpc.org" }
//       }
//     },
//     minNativeReserve: {
//       type: "object",
//       properties: {
//         ethereum: { type: "string", default: "0.003" },
//         base: { type: "string", default: "0.002" },
//         arbitrum: { type: "string", default: "0.002" },
//         optimism: { type: "string", default: "0.002" },
//         polygon: { type: "string", default: "1" }
//       }
//     }
//   }
// } as const;

export function loadConfig(

): PluginConfig {
  return DEFAULT_CONFIG
}

export async function getChainByAlias(input: string): Promise<ChainMetadata | undefined> {
  const normalized = input.trim().toLowerCase();
  const chains = await getSupportedChains();
  if (!chains) {
    throw new Error("Unable to load supported chains from LI.FI");
  }

  return Object.values(chains).find((chain) => chain.key === normalized || chain.name.toLowerCase() === normalized);
}

// export function getChainById(chainId: number): ChainMetadata {
//   const found = Object.values(SUPPORTED_CHAINS).find((chain) => chain.id === chainId);
//   if (!found) {
//     throw new Error(`Unsupported chain id ${chainId}`);
//   }

//   return found;
// }

// export function reserveRawForChain(chainKey: ChainKey, config: PluginConfig): bigint {
//   const reserve = config.minNativeReserve[chainKey] ?? "0";
//   const decimals = chainKey === "polygon" ? 18 : 18;
//   return parseUnits(reserve, decimals);
// }

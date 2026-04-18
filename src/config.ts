import { ChainType, config as lifiSdkConfig, createConfig, getChains, getTokens } from "@lifi/sdk";
import type { ChainMetadata, PluginConfig, SupportedToken } from "./types.js";
import { DEFAULT_CONFIG } from "./constants.js";

let sdkInitialized = false;


export function ensureLifiSdkConfigured(config?: Partial<PluginConfig>): void {
  const resolvedConfig = loadConfig(config);
  const sdkConfig = {
    apiUrl: resolvedConfig.lifiBaseUrl,
    integrator: resolvedConfig.integrator,
  };

  if (!sdkInitialized) {
    createConfig(sdkConfig);
    sdkInitialized = true;
    return;
  }

  lifiSdkConfig.set(sdkConfig);
}

export const getSupportedChains = async (): Promise<Array<ChainMetadata>> => {
  try {
    ensureLifiSdkConfigured();
    const chains = (await getChains({ chainTypes: [ChainType.EVM] })) as ChainMetadata[];
    return chains;
  } catch (error) {
    console.error("Error fetching supported chains:", error);
    throw new Error("Unable to load supported chains from LI.FI");
  }
};

export const getSupportedTokens = async (chain: number): Promise<SupportedToken[]> => {
  try {
    ensureLifiSdkConfigured();
    const { tokens } = await getTokens({ chains: [chain] });
    return (tokens[chain] ?? []) as SupportedToken[];
  } catch (error) {
    console.error("Error fetching supported tokens:", error);
    throw new Error("Unable to load supported tokens from LI.FI");
  }
};

export const pluginConfigSchema = {
  type: "object",
  properties: {
  }
} as const;

export function loadConfig(config?: Partial<PluginConfig>): PluginConfig {
  return {
    ...DEFAULT_CONFIG,
    ...config,
  };
}

export async function getChainByAlias(input: string): Promise<ChainMetadata | undefined> {
  const normalized = input.trim().toLowerCase();
  const chains = await getSupportedChains();
  if (!chains) {
    throw new Error("Unable to load supported chains from LI.FI");
  }

  return Object.values(chains).find((chain) => chain.key === normalized || chain.name.toLowerCase() === normalized || normalized.includes(chain.key) || normalized.includes(chain.name.toLowerCase()));
}

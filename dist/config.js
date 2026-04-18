import { ChainType, config as lifiSdkConfig, createConfig, getChains, getTokens } from "@lifi/sdk";
import { DEFAULT_CONFIG } from "./constants.js";
let sdkInitialized = false;
// function buildSdkRpcUrls(config: PluginConfig): Partial<Record<number, string[]>> {
//   const chainIdToRpcUrls: Partial<Record<number, string[]>> = {};
//   for (const [chainKey, rpcUrl] of Object.entries(config.rpcUrls)) {
//     if (!rpcUrl) {
//       continue;
//     }
//     const matchingChain = DEFAULT_CHAIN_KEY_TO_ID[chainKey];
//     if (matchingChain) {
//       chainIdToRpcUrls[matchingChain] = [rpcUrl];
//     }
//   }
//   return chainIdToRpcUrls;
// }
export function ensureLifiSdkConfigured(config) {
    const resolvedConfig = loadConfig(config);
    const sdkConfig = {
        apiKey: resolvedConfig.lifiApiKey,
        apiUrl: resolvedConfig.lifiBaseUrl,
        integrator: resolvedConfig.integrator,
        //rpcUrls: buildSdkRpcUrls(resolvedConfig),
    };
    if (!sdkInitialized) {
        createConfig(sdkConfig);
        sdkInitialized = true;
        return;
    }
    lifiSdkConfig.set(sdkConfig);
}
export const getSupportedChains = async () => {
    try {
        ensureLifiSdkConfigured();
        const chains = (await getChains({ chainTypes: [ChainType.EVM] }));
        return chains;
    }
    catch (error) {
        console.error("Error fetching supported chains:", error);
        throw new Error("Unable to load supported chains from LI.FI");
    }
};
export const getSupportedTokens = async (chain) => {
    try {
        ensureLifiSdkConfigured();
        const { tokens } = await getTokens({ chains: [chain] });
        return (tokens[chain] ?? []);
    }
    catch (error) {
        console.error("Error fetching supported tokens:", error);
        throw new Error("Unable to load supported tokens from LI.FI");
    }
};
export const pluginConfigSchema = {
    type: "object",
    properties: {}
};
export function loadConfig(config) {
    return {
        ...DEFAULT_CONFIG,
        ...config,
        // rpcUrls: {
        //   ...DEFAULT_CONFIG.rpcUrls,
        //   ...config?.rpcUrls
        // },
    };
}
const DEFAULT_CHAIN_KEY_TO_ID = {
    ethereum: 1,
    optimism: 10,
    bsc: 56,
    polygon: 137,
    arbitrum: 42161,
    base: 8453,
};
export async function getChainByAlias(input) {
    const normalized = input.trim().toLowerCase();
    const chains = await getSupportedChains();
    if (!chains) {
        throw new Error("Unable to load supported chains from LI.FI");
    }
    return Object.values(chains).find((chain) => chain.key === normalized || chain.name.toLowerCase() === normalized || normalized.includes(chain.key) || normalized.includes(chain.name.toLowerCase()));
}
//# sourceMappingURL=config.js.map
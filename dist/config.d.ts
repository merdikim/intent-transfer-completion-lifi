import type { Address } from "viem";
import type { ChainKey, ChainMetadata, PluginConfig, TokenRegistryEntry } from "./types.js";
export declare const NATIVE_TOKEN_ADDRESS: Address;
export declare const SUPPORTED_CHAINS: Record<ChainKey, ChainMetadata>;
export declare const DEFAULT_TOKEN_REGISTRY: Record<string, TokenRegistryEntry>;
export declare const pluginConfigSchema: {
    readonly type: "object";
    readonly properties: {
        readonly lifiApiKey: {
            readonly type: "string";
        };
        readonly lifiBaseUrl: {
            readonly type: "string";
            readonly default: "https://li.quest/v1";
        };
        readonly integrator: {
            readonly type: "string";
            readonly default: "openclaw-intent-transfer";
        };
        readonly defaultSlippageBps: {
            readonly type: "integer";
            readonly default: 100;
        };
        readonly rpcUrls: {
            readonly type: "object";
            readonly properties: {
                readonly ethereum: {
                    readonly type: "string";
                    readonly default: "https://cloudflare-eth.com/v1/mainnet";
                };
                readonly base: {
                    readonly type: "string";
                    readonly default: "https://mainnet.base.org";
                };
                readonly arbitrum: {
                    readonly type: "string";
                    readonly default: "https://arb1.arbitrum.io/rpc";
                };
                readonly optimism: {
                    readonly type: "string";
                    readonly default: "https://mainnet.optimism.io";
                };
                readonly polygon: {
                    readonly type: "string";
                    readonly default: "https://polygon.drpc.org";
                };
            };
        };
        readonly minNativeReserve: {
            readonly type: "object";
            readonly properties: {
                readonly ethereum: {
                    readonly type: "string";
                    readonly default: "0.003";
                };
                readonly base: {
                    readonly type: "string";
                    readonly default: "0.002";
                };
                readonly arbitrum: {
                    readonly type: "string";
                    readonly default: "0.002";
                };
                readonly optimism: {
                    readonly type: "string";
                    readonly default: "0.002";
                };
                readonly polygon: {
                    readonly type: "string";
                    readonly default: "1";
                };
            };
        };
    };
};
export declare function loadConfig(overrides?: Partial<PluginConfig>): PluginConfig;
export declare function getChainByAlias(input: string): ChainMetadata | undefined;
export declare function getChainById(chainId: number): ChainMetadata;
export declare function reserveRawForChain(chainKey: ChainKey, config: PluginConfig): bigint;

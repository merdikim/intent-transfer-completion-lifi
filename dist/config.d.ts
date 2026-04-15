import type { ChainKey, ChainMetadata, PluginConfig } from "./types.js";
export declare const SUPPORTED_CHAINS: () => Promise<Record<ChainKey, ChainMetadata> | undefined>;
export declare function loadConfig(): PluginConfig;
export declare function getChainByAlias(input: string): ChainMetadata | undefined;
export declare function getChainById(chainId: number): ChainMetadata;
export declare function reserveRawForChain(chainKey: ChainKey, config: PluginConfig): bigint;

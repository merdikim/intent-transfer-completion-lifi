import type { ChainMetadata, PluginConfig, SupportedToken } from "./types.js";
export declare const getSupportedChains: () => Promise<Array<ChainMetadata>>;
export declare const getSupportedTokens: (chain: number) => Promise<SupportedToken[]>;
export declare function loadConfig(): PluginConfig;
export declare function getChainByAlias(input: string): Promise<ChainMetadata | undefined>;

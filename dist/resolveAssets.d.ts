import { SUPPORTED_CHAINS } from "./config.js";
import type { AssetRef, ParsedIntent, PluginConfig, ResolvedIntent, ResolvedRecipient } from "./types.js";
import type { LifiClient } from "./lifiClient.js";
export declare function resolveIntent(parsed: ParsedIntent, config: PluginConfig, lifiClient: LifiClient): Promise<ResolvedIntent>;
export declare function resolveRecipient(recipient: string, config: PluginConfig): Promise<ResolvedRecipient>;
export declare function resolveAsset(tokenSymbol: string, chainKey: keyof typeof SUPPORTED_CHAINS, lifiClient: LifiClient): Promise<AssetRef>;

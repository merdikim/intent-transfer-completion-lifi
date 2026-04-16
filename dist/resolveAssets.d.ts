import type { AssetRef, ParsedIntent, ResolvedIntent, ResolvedRecipient } from "./types.js";
export declare function resolveIntent(parsed: ParsedIntent): Promise<ResolvedIntent>;
export declare function resolveRecipient(recipient: string): Promise<ResolvedRecipient>;
export declare function resolveAsset(tokenSymbol: string, chainId: number, chainKey: string): Promise<AssetRef>;

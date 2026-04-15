import type { ParsedIntent, PluginConfig, ResolvedIntent } from "./types.js";
import type { LifiClient } from "./lifiClient.js";
export declare function resolveIntent(parsed: ParsedIntent, config: PluginConfig, lifiClient: LifiClient): Promise<ResolvedIntent>;

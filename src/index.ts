import { privateKeyToAccount } from "viem/accounts";

import { getWalletBalances } from "./balances.js";
import { loadConfig, pluginConfigSchema } from "./config.js";
import { executeTransferPlan } from "./executePlan.js";
import { HttpLifiClient } from "./lifiClient.js";
import { parseIntent } from "./parseIntent.js";
import { resolveIntent } from "./resolveAssets.js";
import { planTransfer } from "./routePlanner.js";
import type { ExecutionResult, NativeToolContext, OpenClawPlugin, ToolInput } from "./types.js";

export async function completeTransferIntent(
  input: ToolInput,
  context?: NativeToolContext
): Promise<ExecutionResult> {
  const config = loadConfig(context?.config);
  const simulateOnly = input.simulateOnly ?? config.simulateOnly;
  const effectiveConfig = { ...config, simulateOnly };
  const lifiClient = new HttpLifiClient(effectiveConfig);
  const parsed = parseIntent(input.intent);
  const resolvedIntent = await resolveIntent(parsed, effectiveConfig, lifiClient);

  const ownerAddress = input.fromAddress ?? (effectiveConfig.privateKey ? privateKeyToAccount(effectiveConfig.privateKey).address : undefined);
  if (!ownerAddress) {
    throw new Error("A wallet address is required. Provide fromAddress for simulations or configure OPENCLAW_PRIVATE_KEY.");
  }

  const balances = await getWalletBalances(ownerAddress, effectiveConfig);
  const plan = await planTransfer(resolvedIntent, ownerAddress, balances, lifiClient, effectiveConfig);
  return executeTransferPlan(plan, effectiveConfig);
}

export const plugin: OpenClawPlugin = {
  id: "intent-transfer-completion-lifi",
  name: "Intent Transfer Completion via LI.FI",
  version: "1.0.0",
  entry: "./dist/index.js",
  bundledSkills: ["./skills/intent_transfer_completion_lifi"],
  configSchema: pluginConfigSchema,
  tools: [
    {
      name: "complete_transfer_intent",
      description:
        "Complete natural-language token transfer intents by sourcing missing funds through LI.FI and then sending the final transfer.",
      inputSchema: {
        type: "object",
        properties: {
          intent: { type: "string" },
          simulateOnly: { type: "boolean" },
          fromAddress: { type: "string" }
        },
        required: ["intent"]
      },
      execute: completeTransferIntent
    }
  ]
};

export default plugin;

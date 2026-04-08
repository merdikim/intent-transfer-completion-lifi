import { getWalletBalances } from "./balances.js";
import { loadConfig, pluginConfigSchema } from "./config.js";
import { executeTransferPlan } from "./executePlan.js";
import { HttpLifiClient } from "./lifiClient.js";
import { parseIntent } from "./parseIntent.js";
import { resolveIntent } from "./resolveAssets.js";
import { planTransfer } from "./routePlanner.js";
import { resolveLocalWallet } from "./wallet.js";
import type { ExecutionResult, LocalWalletBinding, NativeToolContext, OpenClawPlugin, ToolInput } from "./types.js";

export async function completeTransferIntent(
  input: ToolInput,
  context?: NativeToolContext
): Promise<ExecutionResult> {
  const config = loadConfig(context?.config);
  const lifiClient = new HttpLifiClient(config);
  const parsed = parseIntent(input.intent);
  const resolvedIntent = await resolveIntent(parsed, config, lifiClient);
  let ownerAddress = input.fromAddress;
  let localWallet: LocalWalletBinding | undefined;

  if (!ownerAddress) {
    localWallet = await resolveLocalWallet(context);
    ownerAddress = localWallet.address;
  }

  const balances = await getWalletBalances(ownerAddress, config);
  const plan = await planTransfer(resolvedIntent, ownerAddress, balances, lifiClient, config);
  return executeTransferPlan(plan, config, localWallet);
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
          fromAddress: { type: "string" }
        },
        required: ["intent"]
      },
      execute: completeTransferIntent
    }
  ]
};

export default plugin;

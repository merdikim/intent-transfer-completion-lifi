import { getAssetBalance, getWalletBalances } from "./balances.js";
import { executeTransferPlan } from "./executePlan.js";
import { parseIntent } from "./parseIntent.js";
import { resolveIntent } from "./resolveAssets.js";
import { planTransfer } from "./routePlanner.js";
import { resolveLocalWallet } from "./wallet.js";
import type { ExecutionResult, OpenClawPlugin, ToolInput, TransferPlan } from "./types.js";
import { pluginConfigSchema } from "./config.js";

export async function completeTransferIntent(
  input: ToolInput
): Promise<ExecutionResult> {
  const parsed = parseIntent(input.intent);
  const resolvedIntent = await resolveIntent(parsed);
  const localWallet = await resolveLocalWallet(input.walletPath || "./wallet.txt");
  const ownerAddress = localWallet.address

  const assetBalance = await getAssetBalance(ownerAddress, resolvedIntent.asset)
  if (assetBalance > resolvedIntent.amountRaw) {
    console.log("just transfer")
    return true as unknown as ExecutionResult; // Placeholder until executeTransferPlan is implemented
  }

  const balances = await getWalletBalances(ownerAddress);
  const plan = await planTransfer(resolvedIntent, ownerAddress, balances.filtered, assetBalance);
  return executeTransferPlan(plan, localWallet);
}

completeTransferIntent({
  intent: "transfer 0.1 eth to merkim.eth on Base"
}).then(result => console.log(result)).catch(err => console.error(err));

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
          walletPath: { type: "string" }
        },
        required: ["intent"]
      },
      execute: completeTransferIntent
    }
  ]
};

export default plugin;

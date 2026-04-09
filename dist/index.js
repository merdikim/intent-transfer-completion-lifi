import { getWalletBalances } from "./balances.js";
import { loadConfig, pluginConfigSchema } from "./config.js";
import { executeTransferPlan } from "./executePlan.js";
import { HttpLifiClient } from "./lifiClient.js";
import { parseIntent } from "./parseIntent.js";
import { resolveIntent } from "./resolveAssets.js";
import { planTransfer } from "./routePlanner.js";
import { resolveLocalWallet } from "./wallet.js";
export async function completeTransferIntent(input, context) {
    const config = loadConfig(context?.config);
    const lifiClient = new HttpLifiClient(config);
    const parsed = parseIntent(input.intent);
    const resolvedIntent = await resolveIntent(parsed, config, lifiClient);
    let localWallet = await resolveLocalWallet(context);
    if (!localWallet)
        throw new Error("No wallet found!");
    const ownerAddress = localWallet.address;
    const balances = await getWalletBalances(ownerAddress, config);
    const plan = await planTransfer(resolvedIntent, ownerAddress, balances, lifiClient, config);
    return executeTransferPlan(plan, config, localWallet);
}
export const plugin = {
    id: "intent-transfer-completion-lifi",
    name: "Intent Transfer Completion via LI.FI",
    version: "1.0.0",
    entry: "./dist/index.js",
    bundledSkills: ["./skills/intent_transfer_completion_lifi"],
    configSchema: pluginConfigSchema,
    tools: [
        {
            name: "complete_transfer_intent",
            description: "Complete natural-language token transfer intents by sourcing missing funds through LI.FI and then sending the final transfer.",
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
//# sourceMappingURL=index.js.map
import { getAssetBalance, getWalletBalances } from "./balances.js";
import { executeTransferPlan } from "./executePlan.js";
import { parseIntent } from "./parseIntent.js";
import { resolveIntent } from "./resolveAssets.js";
import { planTransfer } from "./routePlanner.js";
import { resolveLocalWallet } from "./wallet.js";
import { pluginConfigSchema } from "./config.js";
export async function completeTransferIntent(input) {
    const parsed = parseIntent(input.intent);
    const resolvedIntent = await resolveIntent(parsed);
    const localWallet = await resolveLocalWallet(input.walletPath || "./wallet.txt");
    const ownerAddress = localWallet.address;
    const assetBalance = await getAssetBalance(ownerAddress, resolvedIntent.asset);
    if (assetBalance > resolvedIntent.amountRaw) {
        const plan = {
            ownerAddress,
            recipient: resolvedIntent.recipient,
            targetChain: resolvedIntent.chain,
            targetAsset: resolvedIntent.asset,
            requestedAmountRaw: resolvedIntent.amountRaw,
            currentTargetBalanceRaw: assetBalance,
            shortfallRaw: 0n
        };
        return executeTransferPlan(plan, localWallet);
    }
    const balances = await getWalletBalances(ownerAddress);
    const plan = await planTransfer(resolvedIntent, ownerAddress, balances, assetBalance);
    return executeTransferPlan(plan, localWallet);
}
const transferTool = {
    name: "complete_transfer_intent",
    description: "Complete natural-language token transfer intents by sourcing missing funds through LI.FI and then sending the final transfer.",
    inputSchema: {
        type: "object",
        properties: {
            intent: { type: "string" },
            walletPath: { type: "string" }
        },
        required: ["intent"]
    }
};
export function register(api) {
    api.registerTool({
        name: transferTool.name,
        description: transferTool.description,
        parameters: transferTool.inputSchema,
        async execute(_toolCallId, params) {
            const result = await completeTransferIntent(params);
            return {
                content: [{ type: "text", text: JSON.stringify(result, null, 2) }],
                details: result
            };
        }
    });
}
export const plugin = {
    id: "intent-transfer-completion-lifi",
    name: "Intent Transfer Completion via LI.FI",
    version: "1.0.4",
    entry: "./dist/index.js",
    bundledSkills: ["./skills/intent_transfer_completion_lifi"],
    configSchema: pluginConfigSchema,
    tools: [
        {
            name: transferTool.name,
            description: transferTool.description,
            inputSchema: transferTool.inputSchema,
            execute: completeTransferIntent
        }
    ],
    register
};
export default plugin;
//# sourceMappingURL=index.js.map
import { getAssetBalance } from "./balances.js";
import { ExecutionError } from "./errors.js";
function sleep(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
}
export async function waitForBalanceIncrease(params) {
    const deadline = Date.now() + params.config.routeStatusTimeoutMs;
    while (Date.now() < deadline) {
        const balance = await getAssetBalance(params.ownerAddress, params.asset, params.config);
        if (balance >= params.minimumBalance) {
            return;
        }
        await sleep(params.config.routeStatusPollIntervalMs);
    }
    throw new ExecutionError(`Timed out while waiting for ${params.asset.symbol} balance on ${params.asset.chainKey} to reach the expected amount.`);
}
//# sourceMappingURL=statusTracker.js.map
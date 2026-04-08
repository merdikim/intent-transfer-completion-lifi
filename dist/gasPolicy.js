import { reserveRawForChain } from "./config.js";
export function evaluateGasPolicyForSpend(position, config) {
    if (!position.token.isNative) {
        return { minimumReserveRaw: 0n, warnings: [] };
    }
    const minimumReserveRaw = reserveRawForChain(position.chainKey, config);
    const warnings = position.rawAmount <= minimumReserveRaw
        ? [`Native balance on ${position.chainKey} is already at or below the configured gas reserve.`]
        : [];
    return { minimumReserveRaw, warnings };
}
export function validateTargetGas(targetAsset, targetNativeBalanceRaw, config) {
    if (targetAsset.isNative) {
        return [];
    }
    const reserve = reserveRawForChain(targetAsset.chainKey, config);
    if (targetNativeBalanceRaw >= reserve / 5n) {
        return [];
    }
    return [
        `Low native gas balance on ${targetAsset.chainKey}; final ERC-20 transfer may fail unless the wallet already has gas on the destination chain.`
    ];
}
export function spendableAmount(position, config) {
    const gasPolicy = evaluateGasPolicyForSpend(position, config);
    if (!position.token.isNative) {
        return position.rawAmount;
    }
    return position.rawAmount > gasPolicy.minimumReserveRaw
        ? position.rawAmount - gasPolicy.minimumReserveRaw
        : 0n;
}
//# sourceMappingURL=gasPolicy.js.map
import { formatUnits } from "viem";
import type { Address } from "viem";

import { getAssetBalance } from "./balances.js";
import { InsufficientFundsError } from "./errors.js";
import { spendableAmount, validateTargetGas } from "./gasPolicy.js";
import type { LifiClient } from "./lifiClient.js";
import type {
  AssetRef,
  BalancePosition,
  PluginConfig,
  ResolvedIntent,
  RouteCandidate,
  TransferPlan
} from "./types.js";

export async function planTransfer(
  intent: ResolvedIntent,
  ownerAddress: Address,
  balances: BalancePosition[],
  lifiClient: LifiClient,
  config: PluginConfig,
  balanceReader: typeof getAssetBalance = getAssetBalance
): Promise<TransferPlan> {
  const targetBalanceRaw = await balanceReader(ownerAddress, intent.asset, config);
  const shortfallRaw = intent.amountRaw > targetBalanceRaw ? intent.amountRaw - targetBalanceRaw : 0n;
  const targetNativeSymbol = intent.chain.nativeSymbol;
  const targetNativeAsset: AssetRef = {
    symbol: targetNativeSymbol,
    address: "0x0000000000000000000000000000000000000000",
    decimals: 18,
    chainId: intent.chain.id,
    chainKey: intent.chain.key,
    isNative: true
  };
  const targetNativeBalance = await balanceReader(ownerAddress, targetNativeAsset, config);
  const warnings = validateTargetGas(intent.asset, targetNativeBalance, config);

  if (shortfallRaw === 0n) {
    return {
      ownerAddress,
      recipient: intent.recipient,
      targetChain: intent.chain,
      targetAsset: intent.asset,
      requestedAmountRaw: intent.amountRaw,
      currentTargetBalanceRaw: targetBalanceRaw,
      shortfallRaw,
      warnings
    };
  }

  const candidate = await selectBestRouteCandidate(intent, ownerAddress, balances, shortfallRaw, lifiClient, config);
  const route = await lifiClient.getRoutes({
    fromChain: candidate.sourceBalance.chainId,
    toChain: intent.chain.id,
    fromToken: candidate.sourceBalance.token.address,
    toToken: intent.asset.address,
    fromAddress: ownerAddress,
    toAddress: ownerAddress,
    fromAmount: spendableAmount(candidate.sourceBalance, config),
    slippageBps: config.defaultSlippageBps
  });

  return {
    ownerAddress,
    recipient: intent.recipient,
    targetChain: intent.chain,
    targetAsset: intent.asset,
    requestedAmountRaw: intent.amountRaw,
    currentTargetBalanceRaw: targetBalanceRaw,
    shortfallRaw,
    route,
    warnings
  };
}

async function selectBestRouteCandidate(
  intent: ResolvedIntent,
  ownerAddress: Address,
  balances: BalancePosition[],
  shortfallRaw: bigint,
  lifiClient: LifiClient,
  config: PluginConfig
): Promise<RouteCandidate> {
  const candidates = balances.filter((position) => spendableAmount(position, config) > 0n);
  if (candidates.length === 0) {
    throw new InsufficientFundsError("No spendable balances were found across configured chains.");
  }

  let bestCandidate: RouteCandidate | undefined;
  let bestAmount = 0n;

  for (const position of candidates) {
    const fromAmount = spendableAmount(position, config);
    const quote = await lifiClient.getQuote({
      fromChain: position.chainId,
      toChain: intent.chain.id,
      fromToken: position.token.address,
      toToken: intent.asset.address,
      fromAddress: ownerAddress,
      toAddress: ownerAddress,
      fromAmount,
      slippageBps: config.defaultSlippageBps
    });

    const toAmount = BigInt(quote.toAmount);
    if (toAmount > bestAmount) {
      bestAmount = toAmount;
      bestCandidate = { sourceBalance: position, quote };
    }

    if (toAmount >= shortfallRaw) {
      return { sourceBalance: position, quote };
    }
  }

  if (!bestCandidate) {
    throw new InsufficientFundsError("Unable to obtain any viable LI.FI quote.");
  }

  throw new InsufficientFundsError(
    `Portfolio value is insufficient. Best route would yield ${formatUnits(bestAmount, intent.asset.decimals)} ${
      intent.asset.symbol
    }, but ${formatUnits(shortfallRaw, intent.asset.decimals)} ${intent.asset.symbol} is required on ${
      intent.chain.name
    }.`
  );
}

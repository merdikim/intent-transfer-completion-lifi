import { formatUnits, zeroAddress } from "viem";
import type { Address } from "viem";
import { getAssetBalance } from "./balances.js";
import { InsufficientFundsError } from "./errors.js";
import type {
  AssetRef,
  BalancePosition,
  PluginConfig,
  ResolvedIntent,
  TransferPlan,
  LifiClient,
  RouteCandidate
} from "./types.js";
import { loadConfig } from "./config.js";
import { HttpLifiClient } from "./lifiClient.js";

export async function planTransfer(
  intent: ResolvedIntent,
  ownerAddress: Address,
  balances: BalancePosition[],
  assetBalance: bigint
): Promise<TransferPlan> {
  const shortfallRaw = intent.amountRaw > assetBalance ? intent.amountRaw - assetBalance : 0n;

  if (shortfallRaw === 0n) {
    return {
      ownerAddress,
      recipient: intent.recipient,
      targetChain: intent.chain,
      targetAsset: intent.asset,
      requestedAmountRaw: intent.amountRaw,
      currentTargetBalanceRaw: assetBalance,
      shortfallRaw
    };
  }

  const lifiClient = new HttpLifiClient(loadConfig());

  const candidate = await selectBestRouteCandidate(intent, ownerAddress, balances, shortfallRaw, lifiClient);
  return {
    ownerAddress,
    recipient: intent.recipient,
    targetChain: intent.chain,
    targetAsset: intent.asset,
    requestedAmountRaw: intent.amountRaw,
    currentTargetBalanceRaw: assetBalance,
    shortfallRaw,
    route: candidate.route
  };
}

async function selectBestRouteCandidate(
  intent: ResolvedIntent,
  ownerAddress: Address,
  balances: BalancePosition[],
  shortfallRaw: bigint,
  lifiClient: LifiClient
): Promise<RouteCandidate> {
  const candidates = balances.filter((position) => position.rawAmount > 0n);
  if (candidates.length === 0) {
    throw new InsufficientFundsError("No spendable balances were found across configured chains.");
  }

  let bestCandidate: RouteCandidate | undefined;
  let bestAmount = 0n;

  for (const position of candidates) {
    const fromAmount = position.rawAmount > shortfallRaw ? shortfallRaw : position.rawAmount;
    const routes = await lifiClient.getRoutes({
      fromChain: position.chainId,
      toChain: intent.chain.id,
      fromToken: position.token.address,
      toToken: intent.asset.address,
      fromAddress: ownerAddress,
      toAddress: ownerAddress,
      fromAmount
    });

    console.log("routes", routes)
    return 
    //Testing here //

    if (routes.routes.length === 0) {
      throw new Error(`No LI.FI routes found to bridge ${formatUnits(fromAmount, position.token.decimals)} ${
        position.token.symbol
      } on ${position.token.chainKey} to ${intent.asset.symbol} on ${intent.chain.name}.`
      );
    }

    const route = routes.routes[0];

    const toAmount = BigInt(route.toAmount);
    if (toAmount > bestAmount) {
      bestAmount = toAmount;
      bestCandidate = { sourceBalance: position, route };
    }

    if (toAmount >= shortfallRaw) {
      return { sourceBalance: position, route };
    }
  }

  if (!bestCandidate) {
    throw new InsufficientFundsError("Unable to obtain any viable LI.FI routes.");
  }

  throw new InsufficientFundsError(
    `Portfolio value is insufficient. Best route would yield ${formatUnits(bestAmount, intent.asset.decimals)} ${
      intent.asset.symbol
    }, but ${formatUnits(shortfallRaw, intent.asset.decimals)} ${intent.asset.symbol} is required on ${
      intent.chain.name
    }.`
  );
}

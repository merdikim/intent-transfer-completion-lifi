import type { Address, Chain, Hex, PublicClient, WalletClient } from "viem";

export type ChainKey = "ethereum" | "base" | "arbitrum" | "optimism" | "polygon";

export interface OpenClawWalletProvider {
  walletClient?: WalletClient;
  getWalletClient?: () => Promise<WalletClient> | WalletClient;
}

export interface NativeToolContext {
  config?: Partial<PluginConfig>;
  walletClient?: WalletClient;
  getWalletClient?: () => Promise<WalletClient> | WalletClient;
  wallet?: OpenClawWalletProvider;
  openclaw?: OpenClawWalletProvider;
}

export interface ToolInput {
  intent: string;
  walletPath?: string;
}

export interface ParsedIntent {
  rawIntent: string;
  action: "send" | "transfer";
  amount: string;
  tokenSymbol: string;
  recipient: string;
  requestedChain: string;
}

export interface ResolvedRecipient {
  raw: string;
  resolvedAddress: Address;
  ensName?: string;
}

export interface ChainMetadata {
  key: ChainKey;
  id: number;
  name: string;
  chain: Chain;
  nativeSymbol: string;
  aliases: string[];
}

export interface AssetRef {
  symbol: string;
  address: Address;
  decimals: number;
  chainId: number;
  // chainKey: ChainKey;
  // isNative: boolean;
}

export interface ResolvedIntent {
  parsed: ParsedIntent;
  recipient: ResolvedRecipient;
  chain: ChainMetadata;
  asset: AssetRef;
  amountRaw: bigint;
}

export interface BalancePosition {
  chainId: number;
  chainKey: ChainKey;
  token: AssetRef;
  rawAmount: bigint;
  formattedAmount: string;
}

export interface GasPolicyResult {
  minimumReserveRaw: bigint;
  warnings: string[];
}

export interface RouteQuote {
  tool?: string;
  toAmount: string;
  toAmountMin?: string;
  approvalAddress?: Address;
  gasCosts?: Array<{ amount: string; token: { symbol: string } }>;
}

export interface RouteTransactionRequest {
  to: Address;
  data?: Hex;
  value?: string;
  gasLimit?: string;
  gasPrice?: string;
}

export interface RouteStepEstimate {
  toAmount?: string;
  toAmountMin?: string;
  approvalAddress?: Address;
}

export interface RouteStepAction {
  fromChainId: number;
  toChainId: number;
  fromToken: { address: Address; symbol: string; decimals: number };
  toToken: { address: Address; symbol: string; decimals: number };
  fromAmount: string;
  toAddress?: Address;
  fromAddress?: Address;
}

export interface RouteStep {
  id?: string;
  type?: string;
  tool?: string;
  toolDetails?: { key?: string; name?: string };
  action: RouteStepAction;
  estimate?: RouteStepEstimate;
  transactionRequest?: RouteTransactionRequest;
}

export interface RoutePlan {
  id?: string;
  fromChainId: number;
  toChainId: number;
  fromTokenAddress: Address;
  toTokenAddress: Address;
  fromAmount: string;
  toAmount: string;
  steps: RouteStep[];
}

export interface RouteCandidate {
  sourceBalance: BalancePosition;
  quote: RouteQuote;
}

export interface TransferPlan {
  ownerAddress: Address;
  recipient: ResolvedRecipient;
  targetChain: ChainMetadata;
  targetAsset: AssetRef;
  requestedAmountRaw: bigint;
  currentTargetBalanceRaw: bigint;
  shortfallRaw: bigint;
  route?: RoutePlan;
  warnings: string[];
}

export interface ExecutedTransaction {
  chainId: number;
  hash: Hex;
  kind: "approval" | "route-step" | "final-transfer";
}

export interface ExecutionResult {
  executed: boolean;
  plan: TransferPlan;
  transactions: ExecutedTransaction[];
  finalTransferHash?: Hex;
  summary: string;
}

export interface PluginConfig {
  lifiBaseUrl: string;
  lifiApiKey?: string;
  integrator: string;
  defaultSlippageBps: number;
  rpcUrls: Partial<Record<ChainKey, string>>;
  minNativeReserve: Partial<Record<ChainKey, string>>;
  routeStatusPollIntervalMs: number;
  routeStatusTimeoutMs: number;
}

export interface LocalWalletBinding {
  address: Address;
  walletClient: WalletClient;
}

export interface ClientBundle {
  publicClient: PublicClient;
  walletClient?: WalletClient;
}

export interface TokenRegistryEntry {
  symbol: string;
  decimals: number;
  addresses: Partial<Record<ChainKey, Address>>;
  nativeOn?: ChainKey[];
}

export interface LifiToken {
  chainId: number;
  address: Address;
  symbol: string;
  decimals: number;
  name?: string;
}

export interface CompleteTransferTool {
  name: "complete_transfer_intent";
  description: string;
  inputSchema: Record<string, unknown>;
  execute: (input: ToolInput, context?: NativeToolContext) => Promise<ExecutionResult>;
}

export interface OpenClawPlugin {
  id: string;
  name: string;
  version: string;
  entry: string;
  bundledSkills: string[];
  configSchema: Record<string, unknown>;
  tools: CompleteTransferTool[];
}

export interface RequestOptions {
  method?: "GET" | "POST";
  body?: unknown;
  query?: Record<string, string | number | undefined>;
}

export interface LifiClient {
  getTokens(chainId: number): Promise<LifiToken[]>;
  getQuote(params: {
    fromChain: number;
    toChain: number;
    fromToken: Address;
    toToken: Address;
    fromAddress: Address;
    fromAmount: bigint;
    toAddress?: Address;
    slippageBps?: number;
  }): Promise<RouteQuote>;
  getRoutes(params: {
    fromChain: number;
    toChain: number;
    fromToken: Address;
    toToken: Address;
    fromAddress: Address;
    fromAmount: bigint;
    toAddress?: Address;
    slippageBps?: number;
  }): Promise<RoutePlan>;
  getStatus(params: Record<string, string>): Promise<unknown>;
}

export interface SupportedToken {
  chainId: number,
  address:Address,
  symbol: string,
  name: string,
  decimals: number,
  priceUSD: number,
  logoURI: string,
  verificationStatus: string,
  verificationStatusBreakdown: []  
}

import {
  arbitrum,
  avalanche,
  base, 
  codex, 
  celo, 
  mainnet, 
  hyperEvm, 
  ink, 
  linea, 
  monad, 
  morph, 
  near, 
  optimism, 
  plume, 
  polygon, 
  sei, 
  sonic, 
  unichain, 
  worldchain, 
  xdc, zksync,
  berachain, katana, gnosis, scroll, megaeth, bsc
} from "viem/chains";
import type { Chain } from "viem";
import { PluginConfig } from "./types.js";

export const COINS: string[] = ["USDC", "USDT", "DAI"];

export const BPS_DENOMINATOR = 10_000n;

export const DEFAULT_CONFIG: PluginConfig = {
  lifiBaseUrl: "https://li.quest/v1",
  integrator: "intent-completion",
};

export const LIFI_CHAIN_NAME_TO_VIEM_CHAIN: Record<string, Chain> = {
  eth: mainnet,
  arb: arbitrum,
  ava: avalanche,
  bas: base,
  ber: berachain,
  bsc: bsc,
  cel: celo,
  codex: codex,
  dai: gnosis,
  ink: ink,
  kat: katana,
  lna: linea,
  hyp: hyperEvm,
  plu: plume,
  meg: megaeth,
  mon: monad,
  mop: morph,
  near: near,
  opt: optimism,
  pol: polygon,
  scl: scroll,
  sei: sei,
  son: sonic,
  uni: unichain,
  wcc: worldchain,
  xdc: xdc,
  zksync: zksync,
};

export const ORCH_URL =
  process.env.NEXT_PUBLIC_ORCHESTRATOR_URL || "http://localhost:8080";

export const CHAIN_WS = process.env.NEXT_PUBLIC_CHAIN_WS || "ws://127.0.0.1:9944";

export const TOKEN_DECIMALS = Number(process.env.NEXT_PUBLIC_TOKEN_DECIMALS || 12);
export const TOKEN_SYMBOL = process.env.NEXT_PUBLIC_TOKEN_SYMBOL || "AINU";

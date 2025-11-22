"use client";

import { useEffect, useMemo, useState } from "react";
import { ApiPromise, WsProvider } from "@polkadot/api";
import { CHAIN_WS, TOKEN_DECIMALS, TOKEN_SYMBOL } from "@/lib/config";

type ChainState = {
  chain?: string;
  blockNumber?: number;
  balance?: string;
  error?: string;
};

export function useChain(address?: string) {
  const [state, setState] = useState<ChainState>({});

  useEffect(() => {
    let mounted = true;
    let unsubscribeHeads: (() => void) | undefined;
    let api: ApiPromise | undefined;

    async function connect() {
      try {
        const provider = new WsProvider(CHAIN_WS);
        api = await ApiPromise.create({ provider });
        if (!mounted) return;

        const chain = (await api.rpc.system.chain()).toString();
        setState((s) => ({ ...s, chain }));

        unsubscribeHeads = await api.rpc.chain.subscribeNewHeads((header) => {
          if (!mounted) return;
          setState((s) => ({ ...s, blockNumber: header.number.toNumber() }));
        });

        if (address) {
          const accountInfo: any = await api.query.system.account(address);
          const free = accountInfo.data.free.toBigInt();
          const denom = BigInt(10) ** BigInt(TOKEN_DECIMALS);
          const whole = free / denom;
          const frac = free % denom;
          const fracStr = frac.toString().padStart(TOKEN_DECIMALS, "0").slice(0, 3);
          setState((s) => ({ ...s, balance: `${whole}.${fracStr} ${TOKEN_SYMBOL}` }));
        }
      } catch (err) {
        if (mounted)
          setState((s) => ({ ...s, error: err instanceof Error ? err.message : "chain connect failed" }));
      }
    }

    connect();

    return () => {
      mounted = false;
      if (unsubscribeHeads) unsubscribeHeads();
      api?.disconnect().catch(() => undefined);
    };
  }, [address]);

  return useMemo(() => state, [state]);
}

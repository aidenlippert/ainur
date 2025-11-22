"use client";

import { useState, useCallback } from "react";
import { useWallet } from "@/lib/wallet-context";
import type { SubmittableExtrinsic } from "@polkadot/api";

type ExtrinsicStatus = "idle" | "signing" | "submitting" | "finalized" | "error";

export function useExtrinsic() {
  const { api, selected, signAndSend } = useWallet();
  const [status, setStatus] = useState<ExtrinsicStatus>("idle");
  const [txHash, setTxHash] = useState<string | undefined>();
  const [error, setError] = useState<string | undefined>();

  const submit = useCallback(
    async (build: (api: unknown, address: string) => SubmittableExtrinsic<"promise">) => {
      if (!api || !selected) throw new Error("Wallet not connected");
      setStatus("signing");
      setError(undefined);
      setTxHash(undefined);
      try {
        const extrinsic = build(api, selected);
        setStatus("submitting");
        const { blockHash } = await signAndSend(extrinsic);
        setTxHash(blockHash);
        setStatus("finalized");
        return blockHash;
      } catch (err) {
        setError(err instanceof Error ? err.message : "extrinsic failed");
        setStatus("error");
        throw err;
      }
    },
    [api, selected, signAndSend]
  );

  return { status, txHash, error, submit };
}

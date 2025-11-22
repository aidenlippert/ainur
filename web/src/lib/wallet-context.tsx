"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  ReactNode,
} from "react";
import { web3Accounts, web3Enable, web3FromAddress } from "@polkadot/extension-dapp";
import { ApiPromise, WsProvider } from "@polkadot/api";
import type { SubmittableExtrinsic } from "@polkadot/api/types";

type WalletStatus = "disconnected" | "connecting" | "connected" | "error";

type WalletCtx = {
  status: WalletStatus;
  addresses: string[];
  selected?: string;
  error?: string;
  connect: () => Promise<void>;
  select: (addr: string) => void;
  signAndSend: (extrinsic: SubmittableExtrinsic<"promise">) => Promise<{ blockHash: string }>;
  api?: ApiPromise;
};

const WalletContext = createContext<WalletCtx | undefined>(undefined);

export function WalletProvider({ children, chainWs }: { children: ReactNode; chainWs: string }) {
  const [status, setStatus] = useState<WalletStatus>("disconnected");
  const [addresses, setAddresses] = useState<string[]>([]);
  const [selected, setSelected] = useState<string | undefined>();
  const [error, setError] = useState<string | undefined>();
  const [api, setApi] = useState<ApiPromise | undefined>();

  const connect = useCallback(async () => {
    setStatus("connecting");
    setError(undefined);
    try {
      const extensions = await web3Enable("Ainur Console");
      if (!extensions || extensions.length === 0) {
        throw new Error("No wallet extension found. Install Polkadot.js or Talisman.");
      }
      const accounts = await web3Accounts();
      const addrs = accounts.map((a) => a.address);
      if (addrs.length === 0) {
        throw new Error("No accounts in extension.");
      }
      const provider = new WsProvider(chainWs);
      const apiInstance = await ApiPromise.create({ provider });
      setAddresses(addrs);
      setSelected(addrs[0]);
      setApi(apiInstance);
      setStatus("connected");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Wallet connection failed");
      setStatus("error");
    }
  }, [chainWs]);

  const select = useCallback((addr: string) => {
    setSelected(addr);
  }, []);

  const signAndSend = useCallback(
    async (extrinsic: SubmittableExtrinsic<"promise">) => {
      if (!api) throw new Error("API not ready");
      if (!selected) throw new Error("No account selected");
      const injector = await web3FromAddress(selected);
      return new Promise<{ blockHash: string }>((resolve, reject) => {
        extrinsic
          .signAndSend(selected, { signer: injector.signer }, ({ status }) => {
            if (status.isInBlock) {
              resolve({ blockHash: status.asInBlock.toHex() });
            }
          })
          .catch(reject);
      });
    },
    [api, selected]
  );

  const value = useMemo(
    () => ({ status, addresses, selected, connect, select, error, signAndSend, api }),
    [status, addresses, selected, connect, select, error, signAndSend, api]
  );

  return <WalletContext.Provider value={value}>{children}</WalletContext.Provider>;
}

export function useWallet() {
  const ctx = useContext(WalletContext);
  if (!ctx) throw new Error("useWallet must be used within WalletProvider");
  return ctx;
}

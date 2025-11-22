"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  ReactNode,
} from "react";

type WalletStatus = "disconnected" | "connecting" | "connected" | "error";

type WalletCtx = {
  status: WalletStatus;
  addresses: string[];
  selected?: string;
  error?: string;
  connect: () => Promise<void>;
};

const WalletContext = createContext<WalletCtx | undefined>(undefined);

export function WalletProvider({ children }: { children: ReactNode }) {
  const [status, setStatus] = useState<WalletStatus>("disconnected");
  const [addresses, setAddresses] = useState<string[]>([]);
  const [selected, setSelected] = useState<string | undefined>();
  const [error, setError] = useState<string | undefined>();

  const connect = useCallback(async () => {
    setStatus("connecting");
    setError(undefined);
    try {
      const { web3Enable, web3Accounts } = await import("@polkadot/extension-dapp");
      const extensions = await web3Enable("Ainur Console");
      if (!extensions || extensions.length === 0) {
        throw new Error("No wallet extension found. Install Polkadot.js or Talisman.");
      }
      const accounts = await web3Accounts();
      const addrs = accounts.map((a) => a.address);
      if (addrs.length === 0) {
        throw new Error("No accounts in extension.");
      }
      setAddresses(addrs);
      setSelected(addrs[0]);
      setStatus("connected");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Wallet connection failed");
      setStatus("error");
    }
  }, []);

  const value = useMemo(
    () => ({ status, addresses, selected, connect, error }),
    [status, addresses, selected, connect, error]
  );

  return <WalletContext.Provider value={value}>{children}</WalletContext.Provider>;
}

export function useWallet() {
  const ctx = useContext(WalletContext);
  if (!ctx) throw new Error("useWallet must be used within WalletProvider");
  return ctx;
}

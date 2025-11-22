"use client";

import { ReactNode, useState } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { WalletProvider } from "@/lib/wallet-context";

export function Providers({ children }: { children: ReactNode }) {
  const [client] = useState(() => new QueryClient());

  return (
    <QueryClientProvider client={client}>
      <WalletProvider>{children}</WalletProvider>
    </QueryClientProvider>
  );
}

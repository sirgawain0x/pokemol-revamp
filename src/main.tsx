import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import { ThirdwebProvider } from "thirdweb/react";
import { createConfig, http, WagmiProvider } from "wagmi";
import { sepolia } from "viem/chains";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

const config = createConfig({
  chains: [sepolia],
  transports: {
    [sepolia.id]: http(),
  },
});

const queryClient = new QueryClient();

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <ThirdwebProvider>
      <WagmiProvider config={config}>
        <QueryClientProvider client={queryClient}>
          <App />
        </QueryClientProvider>
      </WagmiProvider>
    </ThirdwebProvider>
  </React.StrictMode>
);

import { createPublicClient, http } from "viem";
import { lineaSepolia } from "viem/chains";

// Create a public client for querying blockchain data
export const publicClient = createPublicClient({
  chain: lineaSepolia,
  transport: http()
});

// Mock bundler client for development purposes
// In a real app, this would be a proper bundler client
export const bundlerClient = {
  sendUserOperation: async ({ account, calls, maxFeePerGas, maxPriorityFeePerGas }: any) => {
    console.log("Simulating user operation:", { account, calls });
    // Simulate delay and return mock hash
    await new Promise(resolve => setTimeout(resolve, 1000));
    return "0x" + Math.random().toString(16).substring(2) as `0x${string}`;
  }
};

import { HardhatUserConfig } from "hardhat/config";
import "@nomicfoundation/hardhat-toolbox";
import * as dotenv from "dotenv";
dotenv.config();

const HYPEREVM_RPC = process.env.HYPER_EVM_RPC || "https://rpc.hyperliquid.xyz/evm";
const PRIVATE_KEY = process.env.PRIVATE_KEY || "";

const config: HardhatUserConfig = {
  solidity: "0.8.24",
  networks: {
     hyperevmTest: {                     
      url: process.env.HYPER_EVM_RPC || "https://rpc.hyperliquid-testnet.xyz/evm",
      chainId: 998,
      accounts: PRIVATE_KEY ? [PRIVATE_KEY] : [],
    },
    // hyperevm: {
    //   url: HYPEREVM_RPC,
    //   chainId: 999,
    //   accounts: PRIVATE_KEY ? [PRIVATE_KEY] : [],
    // },
  },
};

export default config;

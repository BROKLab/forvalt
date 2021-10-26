import { ethers } from "ethers";

export type ProviderTypes = "hardhat" | "walletConnect" | "web3modal";
export const PROVIDERS = ["hardhat", "walletConnectV2", "web3modal"];
export const DEFAULT_PROVIDER = "walletConnect";

export type SignerTypes = "walletConnect" | "mnemonic" | "prompt" | "web3modal";
export const SIGNERS = ["walletConnect", "mnemonic", "prompt", "web3modal"];
export const DEFAULT_SIGNER = "walletConnect";

export const DEFAULT_WALLETCONNECT_METHODS = [
    //   "eth_sendTransaction",
    //   "personal_sign",
    //   "eth_signTypedData",
    //   "eth_signTransaction",
    "symfoniID_createCapTableVP",
];

export const CHAIN_ID = 421611;
export const WALLETCONNECT_METADATA = {
    icons: ["https://pbs.twimg.com/profile_images/1201845955215147012/mRA_Whgj_400x400.jpg"],
    description: "Åpen, tillitsfull og integrert aksjeeierbok.",
    name: "Brønnøysundregistrene Forvalt",
    url: "https://www.brreg.no",
};

export const DEFAULT_CAPTABLE_PARTITION = ethers.utils.formatBytes32String("ordinære");

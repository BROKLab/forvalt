import { providers, Signer } from "ethers";
import { AuthProvider__factory, Deployments } from "@brok/captable-contracts";

export type SymfoniAuthProvider = ReturnType<typeof getAuthProvider>;

export function getAuthProvider(provider: providers.Provider, chainId: number, signer?: Signer, address?: string) {
    const addresses: { [chainId: number]: string } = {
        7766: "0xDc64a140Aa3E981100a9becA4E685f962f0cF6C9",
    };
    const BROK_ENVIROMENT = process.env.REACT_APP_BROK_ENVIROMENT;
    if (BROK_ENVIROMENT === "brokStage" || BROK_ENVIROMENT === "brokDev") {
        addresses[parseInt(Deployments[BROK_ENVIROMENT].chainId)] = Deployments[BROK_ENVIROMENT].contracts.AuthProvider.address;
    }
    if (address) {
        addresses[chainId] = address;
    }
    const instance = () => {
        if (chainId in addresses) {
            return signer ? AuthProvider__factory.connect(addresses[chainId], signer) : AuthProvider__factory.connect(addresses[chainId], provider);
        }
        return undefined;
    };
    const factory = () => {
        return signer ? new AuthProvider__factory(signer) : undefined;
    };
    const connect = (address: string) => {
        return signer ? AuthProvider__factory.connect(address, signer) : AuthProvider__factory.connect(address, provider);
    };
    return {
        instance: instance(),
        factory: factory(),
        connect: connect,
    };
}

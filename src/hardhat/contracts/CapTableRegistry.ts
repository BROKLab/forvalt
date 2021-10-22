import { providers, Signer } from "ethers";
import { SymfoniCapTableRegistry } from "../ForvaltContext";
import { CapTableRegistry__factory, Deployments } from "@brok/captable-contracts";

export function getCapTableRegistry(provider: providers.Provider, chainId: number, signer?: Signer, address?: string): SymfoniCapTableRegistry {
    const addresses: { [chainId: number]: string } = {
        2018: "0x7904564de273FB207d6D3525620eCa390E93bE1B",
        31337: "0x9fE46736679d2D9a65F0992F2272dE9f3c7fa6e0",
    };
    const BROK_ENVIROMENT = process.env.REACT_APP_BROK_ENVIROMENT;
    if (BROK_ENVIROMENT === "brokStage" || BROK_ENVIROMENT === "brokDev") {
        addresses[parseInt(Deployments[BROK_ENVIROMENT].chainId)] = Deployments[BROK_ENVIROMENT].contracts.CapTableRegistry.address;
    }
    if (address) {
        addresses[chainId] = address;
    }
    const instance = () => {
        if (chainId in addresses) {
            return signer
                ? CapTableRegistry__factory.connect(addresses[chainId], signer)
                : CapTableRegistry__factory.connect(addresses[chainId], provider);
        }
        return undefined;
    };
    const factory = () => {
        return signer ? new CapTableRegistry__factory(signer) : undefined;
    };
    const connect = (address: string) => {
        return signer ? CapTableRegistry__factory.connect(address, signer) : CapTableRegistry__factory.connect(address, provider);
    };
    return {
        instance: instance(),
        factory: factory(),
        connect: connect,
    };
}

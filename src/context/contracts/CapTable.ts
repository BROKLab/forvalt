import { providers, Signer } from "ethers";
import { CapTable__factory } from "@brok/captable-contracts";

export type SymfoniCapTable = ReturnType<typeof getCapTable>;

export function getCapTable(provider: providers.Provider, chainId: number, signer?: Signer, address?: string) {
    let addresses: { [chainId: number]: string } = {};
    if (address) {
        addresses[chainId] = address;
    }
    const instance = () => {
        if (addresses[chainId]) {
            return signer ? CapTable__factory.connect(addresses[chainId], signer) : CapTable__factory.connect(addresses[chainId], provider);
        }
        return undefined;
    };
    const factory = () => {
        return signer ? new CapTable__factory(signer) : undefined;
    };

    const connect = (address: string) => {
        return signer ? CapTable__factory.connect(address, signer) : CapTable__factory.connect(address, provider);
    };

    return {
        instance: instance(),
        factory: factory(),
        connect: connect,
    };
}

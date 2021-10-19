import { providers, Signer } from "ethers";
import { ERC1400__factory } from "@brok/captable-contracts";

export function getCapTable(provider: providers.Provider, chainId: number, signer?: Signer, address?: string) {
    let addresses: { [chainId: number]: string } = {};
    if (address) {
        addresses[chainId] = address;
    }
    const instance = () => {
        if (addresses[chainId]) {
            return signer ? ERC1400__factory.connect(addresses[chainId], signer) : ERC1400__factory.connect(addresses[chainId], provider);
        }
        return undefined;
    };
    const factory = () => {
        return signer ? new ERC1400__factory(signer) : undefined;
    };

    const connect = (address: string) => {
        return signer ? ERC1400__factory.connect(address, signer) : ERC1400__factory.connect(address, provider);
    };

    return {
        instance: instance(),
        factory: factory(),
        connect: connect,
    };
}

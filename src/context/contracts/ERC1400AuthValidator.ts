import { providers, Signer } from "ethers";
import { ERC1400AuthValidator__factory } from "@brok/captable-contracts";

export type SymfoniERC1400AuthValidator = ReturnType<typeof getERC1400AuthValidator>;

export function getERC1400AuthValidator(provider: providers.Provider, chainId: number, signer?: Signer, address?: string) {
    const addresses: { [chainId: number]: string } = {};
    if (address) {
        addresses[chainId] = address;
    }
    const instance = () => {
        if (chainId in addresses) {
            return signer
                ? ERC1400AuthValidator__factory.connect(addresses[chainId], signer)
                : ERC1400AuthValidator__factory.connect(addresses[chainId], provider);
        }
        return undefined;
    };
    const factory = () => {
        return signer ? new ERC1400AuthValidator__factory(signer) : undefined;
    };
    const connect = (address: string) => {
        return signer ? ERC1400AuthValidator__factory.connect(address, signer) : ERC1400AuthValidator__factory.connect(address, provider);
    };
    return {
        instance: instance(),
        factory: factory(),
        connect: connect,
    };
}

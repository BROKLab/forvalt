import { providers, Signer } from "ethers";
import { SymfoniERC1400AuthValidator } from "../ForvaltContext";
import { ERC1400AuthValidator__factory } from "../typechain/factories/ERC1400AuthValidator__factory";

export function getERC1400AuthValidator(
  provider: providers.Provider,
  chainId: number,
  signer?: Signer,
  address?: string
): SymfoniERC1400AuthValidator {
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
    return signer
      ? ERC1400AuthValidator__factory.connect(address, signer)
      : ERC1400AuthValidator__factory.connect(address, provider);
  };
  return {
    instance: instance(),
    factory: factory(),
    connect: connect,
  };
}

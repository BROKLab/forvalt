import { providers, Signer } from "ethers";
import { SymfoniERC1820Registry } from "../ForvaltContext";
import { ERC1820Registry__factory } from "../typechain/factories/ERC1820Registry__factory";

export function getERC1820Registry(
  provider: providers.Provider,
  chainId: number,
  signer?: Signer,
  address?: string
): SymfoniERC1820Registry {
  const addresses: { [chainId: number]: string } = {
    31337: "0x1820a4B7618BdE71Dce8cdc73aAB6C95905faD24",
    2018: "0x1820a4B7618BdE71Dce8cdc73aAB6C95905faD24",
    7766: "0x1820a4B7618BdE71Dce8cdc73aAB6C95905faD24",
  };
  if (address) {
    addresses[chainId] = address;
  }
  const instance = () => {
    if (chainId in addresses) {
      return signer
        ? ERC1820Registry__factory.connect(addresses[chainId], signer)
        : ERC1820Registry__factory.connect(addresses[chainId], provider);
    }
    return undefined;
  };
  const factory = () => {
    return signer ? new ERC1820Registry__factory(signer) : undefined;
  };
  const connect = (address: string) => {
    return signer
      ? ERC1820Registry__factory.connect(address, signer)
      : ERC1820Registry__factory.connect(address, provider);
  };
  return {
    instance: instance(),
    factory: factory(),
    connect: connect,
  };
}

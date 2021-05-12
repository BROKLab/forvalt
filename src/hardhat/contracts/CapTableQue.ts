import { providers, Signer } from "ethers";
import { SymfoniCapTableQue } from "../ForvaltContext";
import { CapTableQue__factory } from "../typechain/factories/CapTableQue__factory";

export function getCapTableQue(
  provider: providers.Provider,
  chainId: number,
  signer?: Signer,
  address?: string
): SymfoniCapTableQue {
  const addresses: { [chainId: number]: string } = {
    31337: "0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512",
    2018: "0xDDBe41f46E7eBb86d9Ac7053cde4b41E5b30aF93",
    7766: "0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512",
  };
  if (address) {
    addresses[chainId] = address;
  }
  const instance = () => {
    if (chainId in addresses) {
      return signer
        ? CapTableQue__factory.connect(addresses[chainId], signer)
        : CapTableQue__factory.connect(addresses[chainId], provider);
    }
    return undefined;
  };
  const factory = () => {
    return signer ? new CapTableQue__factory(signer) : undefined;
  };
  const connect = (address: string) => {
    return signer
      ? CapTableQue__factory.connect(address, signer)
      : CapTableQue__factory.connect(address, provider);
  };
  return {
    instance: instance(),
    factory: factory(),
    connect: connect,
  };
}

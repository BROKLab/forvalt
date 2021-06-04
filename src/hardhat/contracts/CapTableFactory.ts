import { providers, Signer } from "ethers";
import { SymfoniCapTableFactory } from "../ForvaltContext";
import {
  CapTableFactory__factory,
  Deployments,
} from "@brok/captable-contracts";

export function getCapTableFactory(
  provider: providers.Provider,
  chainId: number,
  signer?: Signer,
  address?: string
): SymfoniCapTableFactory {
  const addresses: { [chainId: number]: string } = {
    [Deployments.BrokStage.chainId]:
      Deployments.BrokStage.contracts.CapTableFactory.address,
    2018: "0xDDBe41f46E7eBb86d9Ac7053cde4b41E5b30aF93",
    7766: "0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512",
  };
  if (address) {
    addresses[chainId] = address;
  }
  const instance = () => {
    if (chainId in addresses) {
      return signer
        ? CapTableFactory__factory.connect(addresses[chainId], signer)
        : CapTableFactory__factory.connect(addresses[chainId], provider);
    }
    return undefined;
  };
  const factory = () => {
    return signer ? new CapTableFactory__factory(signer) : undefined;
  };
  const connect = (address: string) => {
    return signer
      ? CapTableFactory__factory.connect(address, signer)
      : CapTableFactory__factory.connect(address, provider);
  };
  return {
    instance: instance(),
    factory: factory(),
    connect: connect,
  };
}

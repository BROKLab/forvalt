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
    31337: "0xCf7Ed3AccA5a467e9e704C703E8D87F634fB0Fc9",
    2018: "0xDDBe41f46E7eBb86d9Ac7053cde4b41E5b30aF93",
  };
  const BROK_ENVIROMENT = process.env.REACT_APP_BROK_ENVIROMENT;
  if (BROK_ENVIROMENT === "brokStage" || BROK_ENVIROMENT === "brokTest") {
    addresses[parseInt(Deployments[BROK_ENVIROMENT].chainId)] =
      Deployments[BROK_ENVIROMENT].contracts.CapTableFactory.address;
  }
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

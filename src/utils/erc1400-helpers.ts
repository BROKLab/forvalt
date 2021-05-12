import { BigNumber, BytesLike } from "ethers";
import { ERC1400 } from "../hardhat/typechain/ERC1400";

export interface CollateralDetail {
  cToken: {
    balance: BigNumber;
    holder: string;
  }[];
  pToken: {
    balance: BigNumber;
    holder: string;
  }[];
  closed: boolean;
  cdpAddress: string;
}
export interface CollateralDetails {
  [tokenHolder: string]: CollateralDetail;
}

// export const getERC20Addresses = async (address: string) => {
//   const signer = await getWeb3();
//   const token = await getERC20MintableBurnable(address);
//   const logs = await signer.provider
//     .getLogs({
//       fromBlock: 0,
//       address: address,
//       toBlock: "latest",
//       topics: [ethers.utils.id(`Transfer(address,address,uint256)`)],
//     })
//     .finally(() => []);

//   // console.log("logs => ", logs);
//   const events = logs.map((log) => {
//     return { ...token.interface.parseLog(log) };
//   });
//   // console.log("events => ", events);

//   const addresses = events
//     .map((event) => {
//       return event.values.to;
//     })
//     .reduce(
//       (prev, cur) => (prev.indexOf(cur) === -1 ? [...prev, cur] : prev),
//       []
//     ) as string[];
//   return addresses;
// };

export const getERC1400Addresses = async (
  capTable: ERC1400,
  partitionFilter?: BytesLike,
  fromBlock?: number,
  skipZeroBalances = true
) => {
  const _partitionFilter = partitionFilter ? partitionFilter : null;
  const _fromBlock = fromBlock ? fromBlock : 0;
  const issueByPartition = await capTable.queryFilter(
    capTable.filters.IssuedByPartition(
      _partitionFilter,
      null,
      null,
      null,
      null,
      null
    ),
    _fromBlock,
    "latest"
  );
  const transferByPartition = await capTable.queryFilter(
    capTable.filters.TransferByPartition(
      _partitionFilter,
      null,
      null,
      null,
      null,
      null,
      null
    ),
    _fromBlock,
    "latest"
  );
  const redeemByPartition = await capTable.queryFilter(
    capTable.filters.RedeemedByPartition(
      _partitionFilter,
      null,
      null,
      null,
      null
    ),
    _fromBlock,
    "latest"
  );

  const logs = [
    ...redeemByPartition,
    ...transferByPartition,
    ...issueByPartition,
  ];

  const results = logs
    .filter((event) => {
      if (event.args) {
        if (
          "to" in event.args &&
          ("partition" in event.args || "fromPartition" in event.args)
        ) {
          return true;
        }
      }
      return false;
    })
    .map((event) => {
      if (event.args) {
        if (
          "to" in event.args &&
          ("partition" in event.args || "fromPartition" in event.args)
        ) {
          const parition =
            "partition" in event.args
              ? event.args.partition
              : event.args.fromPartition;
          return {
            address: event.args.to as string,
            partition: parition as BytesLike,
          };
        }
      }
      return undefined;
    })
    .reduce((prev: { address: string; partition: BytesLike }[], cur) => {
      if (!cur) return prev;
      const exist =
        prev.findIndex((event) => {
          return event.address === cur.address &&
            event.partition === cur.partition
            ? true
            : false;
        }) !== -1;
      return exist ? prev : [...prev, cur];
    }, [])
    .map(async (event) => {
      const balance = await capTable.balanceOfByPartition(
        event.partition,
        event.address
      );
      return {
        ...event,
        balance: balance,
      };
    });

  const addresses = await Promise.all(results);
  if (skipZeroBalances) {
    return addresses.filter((a) => {
      return !a.balance.isZero();
    });
  }
  return addresses;
};

// export const filterCDPHolders = async (
//   addresses: string[]
// ): Promise<string[]> => {
//   const ERC1400_TOKENS_RECIPIENT = ethers.utils.solidityKeccak256(
//     ["string"],
//     ["ERC1400TokensRecipient"]
//   );
//   const ERC1820_ACCEPT_MAGIC = ethers.utils.solidityKeccak256(
//     ["string"],
//     ["ERC1820_ACCEPT_MAGIC"]
//   );
//   const holderPromises = addresses.map(async (address) => {
//     try {
//       const maybePropertyCDP = await getPropertyCDP(address);
//       const bytesAcceptMagicMaybe = await maybePropertyCDP.canImplementInterfaceForAddress(
//         ERC1400_TOKENS_RECIPIENT,
//         address
//       );
//       if (bytesAcceptMagicMaybe === ERC1820_ACCEPT_MAGIC) return address;
//       else return "";
//     } catch (error) {
//       return "";
//     }
//   });
//   const holdersWithEmpty = await Promise.all(holderPromises);
//   const holders = holdersWithEmpty.filter((maybeString) => maybeString);
//   console.log("filterCDPHolders", holders);

//   return holders;
// };

// export const getColleralDetails = async (
//   addresses: string[]
// ): Promise<CollateralDetails> => {
//   // let collateralDetailsObjectArray = [];
//   // for (const address of addresses) {
//   const promises = addresses.map(async (address) => {
//     console.log("Getting collateral details for ", address);

//     const propertyCDP = await getPropertyCDP(address);
//     const cTokenAddress = await propertyCDP.getCToken();
//     const pTokenAddress = await propertyCDP.getPToken();

//     const cToken = await getERC20MintableBurnable(cTokenAddress);
//     const pToken = await getERC20MintableBurnable(pTokenAddress);

//     const cTokenAddresses = await getERC20Addresses(cTokenAddress);
//     const pTokenAddresses = await getERC20Addresses(pTokenAddress);

//     const cTokenBalances = cTokenAddresses.map(async (address) => {
//       return {
//         holder: address,
//         balance: await cToken.balanceOf(address),
//       };
//     });
//     const cTokenDetails = await Promise.all(cTokenBalances);
//     const cTokenDetailsFiltered = cTokenDetails.filter((tokenDetail) => {
//       if (tokenDetail.balance.isZero()) {
//         return false;
//       }
//       return true;
//     });
//     const pTokenBalances = pTokenAddresses.map(async (address) => {
//       return {
//         holder: address,
//         balance: await pToken.balanceOf(address),
//       };
//     });
//     const pTokenDetails = await Promise.all(pTokenBalances);
//     const pTokenDetailsFiltered = pTokenDetails.filter((tokenDetail) => {
//       if (tokenDetail.balance.isZero()) {
//         return false;
//       }
//       return true;
//     });
//     const collateralDetail: CollateralDetail = {
//       closed: await propertyCDP.closed(),
//       cToken: cTokenDetailsFiltered,
//       pToken: pTokenDetailsFiltered,
//       cdpAddress: address,
//     };
//     // collateralDetailsObjectArray.push({ [address]: collateralDetail });
//     return { [address]: collateralDetail };
//   });
//   const collateralDetailsObjectArray = await Promise.all(promises);
//   const collateralDetails = collateralDetailsObjectArray.reduce(
//     (prev, curr) => {
//       return { ...prev, ...curr };
//     },
//     {}
//   );
//   return collateralDetails;
// };

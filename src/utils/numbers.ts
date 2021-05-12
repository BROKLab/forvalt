import { BigNumber } from "ethers";
import { ethers } from "ethers";

export const formatBN = (bigNumber: BigNumber) => {
  const asInteger = parseInt(ethers.utils.formatEther(bigNumber));
  if (asInteger < 0) {
    return asInteger;
  } else {
    return Math.round(asInteger);
  }
};

export const formatCurrency = (amount: number) => {
  const moneyFormatter = () => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "NOK",
    });
  };
  return moneyFormatter().format(amount);
};

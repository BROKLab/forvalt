import { ethers } from "ethers";

export type Transaction =
  | ethers.providers.TransactionRequest
  | ethers.PopulatedTransaction;

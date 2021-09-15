import axios from "axios";
import { Address2Name } from "../utils/ContactContext";

const BROK_HELPERS_VERIFIER = process.env.REACT_APP_BROK_HELPERS_VERIFIER;
const BROK_HELPERS_URL = process.env.REACT_APP_BROK_HELPERS_URL;

export type Options = {
  test?: boolean;
};

export type Unclaimed = {
  id: string;
  capTableAddress: string;
  balances: { balance: string; partition: string }[];
  name: string;
};

export function captableApprove(jwt: string, capTableAddress: string) {
  return axios.post<string>(
    `${
      process.env.REACT_APP_USE_LOCAL_ENVIROMENT
        ? "http://localhost:3004"
        : BROK_HELPERS_URL
    }/brreg/captable/approve`,
    {
      jwt: jwt,
      capTableAddress,
      test: process.env.REACT_APP_USE_TEST_DATA ? true : false,
    }
  );
}

export function unclaimedCreate(jwt: string) {
  return axios.post<{ blockchainAccount: string }>(
    `${
      process.env.REACT_APP_USE_LOCAL_ENVIROMENT
        ? "http://localhost:3004"
        : BROK_HELPERS_URL
    }/brreg/unclaimed/create`,
    {
      jwt,
    }
  );
}
export function fetchAddress2Name(contractAddress: string) {
  return axios.post<Address2Name>(
    `${
      process.env.REACT_APP_USE_LOCAL_ENVIROMENT
        ? "http://localhost:3004"
        : BROK_HELPERS_URL
    }/brreg/contract/erc1400/names`,
    {
      capTableAddress: contractAddress,
    }
  );
}

export function fetchUnclaimedList(jwt: string) {
  return axios.post<{
    object: string;
    url: string;
    has_more: boolean;
    data: [];
  }>(
    `${
      process.env.REACT_APP_USE_LOCAL_ENVIROMENT
        ? "http://localhost:3004"
        : BROK_HELPERS_URL
    }/brreg/unclaimed/list`,
    {
      jwt: jwt,
    }
  );
}
export function claimUnclaimed(jwt: string, options: Options = {}) {
  return axios.post<boolean>(
    `${
      process.env.REACT_APP_USE_LOCAL_ENVIROMENT
        ? "http://localhost:3004"
        : BROK_HELPERS_URL
    }/brreg/unclaimed/claim`,
    {
      jwt: jwt,
    }
  );
}

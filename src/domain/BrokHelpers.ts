import axios from "axios";

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

export function fetchUnclaimedList(jwt: string, options: Options = {}) {
  return axios.post<{
    object: string;
    url: string;
    has_more: boolean;
    data: [];
  }>(
    `${
      options.test ? "http://localhost:3004" : BROK_HELPERS_URL
    }/brreg/unclaimed/list`,
    {
      jwt: jwt,
    }
  );
}
export function claimUnclaimed(jwt: string, options: Options = {}) {
  return axios.post<boolean>(
    `${
      options.test ? "http://localhost:3004" : BROK_HELPERS_URL
    }/brreg/unclaimed/claim`,
    {
      jwt: jwt,
    }
  );
}

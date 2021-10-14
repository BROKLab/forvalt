import axios from "axios";
import { Address2Info } from "../utils/ContactContext";

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

export function captableApprove(jwt: string, capTableAddress: string, test: boolean = false) {
    const url = !process.env.REACT_APP_USE_LOCAL_ENVIROMENT ? "http://localhost:3004" : BROK_HELPERS_URL;
    return axios.post<string>(`${url}/brreg/captable/approve`, {
        jwt: jwt,
        capTableAddress,
        test: test,
    });
}

export function digitalEntityUpdate(jwt: string) {
    const url = !process.env.REACT_APP_USE_LOCAL_ENVIROMENT ? "http://localhost:3004" : BROK_HELPERS_URL;
    return axios.post<{ success: boolean }>(`${url}/brreg/digital-entity/update`, {
        jwt,
    });
}

export function unclaimedCreate(jwt: string) {
    const url = !process.env.REACT_APP_USE_LOCAL_ENVIROMENT ? "http://localhost:3004" : BROK_HELPERS_URL;
    return axios.post<{ blockchainAccount: string }>(`${url}/brreg/unclaimed/create`, {
        jwt,
    });
}
export function fetchAddress2Name(contractAddress: string) {
    const url = !process.env.REACT_APP_USE_LOCAL_ENVIROMENT ? "http://localhost:3004" : BROK_HELPERS_URL;
    console.log("url", url);
    return axios.post<Address2Info>(`${url}/brreg/contract/erc1400/names`, {
        capTableAddress: contractAddress,
    });
}

export function fetchUnclaimedList(jwt: string) {
    const url = !process.env.REACT_APP_USE_LOCAL_ENVIROMENT ? "http://localhost:3004" : BROK_HELPERS_URL;
    return axios.post<{
        object: string;
        url: string;
        has_more: boolean;
        data: [];
    }>(`${url}/brreg/unclaimed/list`, {
        jwt: jwt,
    });
}
export function claimUnclaimed(jwt: string, options: Options = {}) {
    const url = !process.env.REACT_APP_USE_LOCAL_ENVIROMENT ? "http://localhost:3004" : BROK_HELPERS_URL;
    return axios.post<boolean>(`${url}/brreg/unclaimed/claim`, {
        jwt: jwt,
    });
}

export function entityGet(jwt: string) {
    return axios.post<boolean>(`${!process.env.REACT_APP_USE_LOCAL_ENVIROMENT ? "http://localhost:3004" : BROK_HELPERS_URL}/brreg/entity/get`, {
        jwt: jwt,
    });
}

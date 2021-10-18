import axios, { AxiosResponse } from "axios";
import React, { useContext } from "react";
import { SymfoniContext } from "../hardhat/ForvaltContext";
import { SignatureRequest } from "./SignerRequestHandler";
import { useLocalStorage } from "./useLocalstorage";

interface Props {}

const BROK_HELPERS_VERIFIER = process.env.REACT_APP_BROK_HELPERS_VERIFIER;
const BROK_HELPERS_URL = process.env.REACT_APP_BROK_HELPERS_URL;

export interface Unclaimed {
    capTableName: string;
    address: string;
    name: string;
    balances: { amount: string; partition: string }[];
    captableAddress: string;
}

export type Options = {
    test?: boolean;
};

export interface ERC1400TokenTransfer {
    amount: string;
    partition: string;
}
export interface PrivateERC1400TokenTransfer extends ERC1400TokenTransfer {
    identifier: string;
    isBoardDirector: boolean;
    email: string;
    name: string;
    postalcode: string;
    streetAddress: string;
}

export interface Shareholder {
    name: string;
    city: string;
    birthdate: string;
    id: string;
    postcode?: number;
    email?: string;
    identifier?: string;
}

export interface OrgData {
    aksjer: number;
    kapital: number;
    navn: string;
    orgnr: number;
    vedtektsdato: string;
}
export type CapTableLegacyRespons = OrgData[];

export interface BrokContext {
    createCaptable: (jwt: string) => Promise<AxiosResponse<{ captableAddress: string }>>;
    getCaptableShareholders: (captableAddress: string) => Promise<AxiosResponse<Shareholder[]>>;
    getCaptableShareholder: (captableAddress: string, shareholdeId: string) => Promise<AxiosResponse<Shareholder>>;
    listUnclaimed: () => Promise<AxiosResponse<Unclaimed[]>>;
    createUnclaimed: (jwt: string) => Promise<AxiosResponse<{ transfers: { amount: string; partition: string; address: string }[] }>>;
    claim: (jwt: string) => Promise<AxiosResponse<{ claimed: boolean }>>;
    getCaptableLegacy: (search: string) => Promise<AxiosResponse<CapTableLegacyRespons>>
}


export const BrokContext = React.createContext<BrokContext>(undefined!);

export const Brok: React.FC<Props> = ({ ...props }) => {
    const [token, setToken] = useLocalStorage<string>("permissionBrokToken", "");
    const { init, signer, signatureRequestHandler } = useContext(SymfoniContext);

    const requestPermissionTokenFromSigner = async () => {
        // TODO fix real valid check of token
        if (token != "") {
            return token;
        }

        console.log("in requestPermissionToken...", "before check signer");

        if (!signer) {
            console.log("doesnt have signer");
            init({ forceSigner: true });
        }

        if (!signer || !("request" in signer)) {
            throw Error("Has no signer");
        }

        const request: SignatureRequest = {
            message: "For å bruke Forvalt må du godkjenne .....",
            fn: async () => {
                await signer.request("did_createVerifiableCredential", [
                    {
                        verifier: BROK_HELPERS_VERIFIER,
                        payload: {
                            domain: "localhost:3000",
                            cacheable: true,
                            paths: ["/entities/*", "/captable/*", "/unclaimed/*"],
                        },
                    },
                ]);
            },
        };
        if (!signatureRequestHandler) throw Error("TODO: Create error");
        signatureRequestHandler.add([request]);
        let userTokenJwt;
        try {
            const results = (await signatureRequestHandler.results()) as string[];
            userTokenJwt = results[0];
            console.log("userTokenJwt from Symfoni ID", userTokenJwt);
            setToken(userTokenJwt);
        } catch (e: any) {
            console.log("[ERROR] requestPermissionTokenFromSigner", e);
            throw e;
        }
        return userTokenJwt;
    };

    // returns captableAddress or need to catch some error
    // jwt requiredCredential: ['orgnr', 'unclaimed', 'acceptedBoardDirectorTOADate', 'acceptedBoardDirectorTOAVersion'],
    const createCaptable = async (jwt: string) => {
        console.log("in createCaptable");
        const url = !!process.env.REACT_APP_USE_LOCAL_ENVIROMENT ? "http://localhost:3004" : BROK_HELPERS_URL;
        return axios.post<{ captableAddress: string }>(`${url}/captable`, {
            jwt,
            skipAmountControl: process.env.REACT_APP_IS_TEST ? true : false,
            skipBoardDirector: process.env.REACT_APP_IS_TEST ? true : false,
            skipDirectTransferIdentityCheck: process.env.REACT_APP_IS_TEST ? true : false,
        });
    };

    const getCaptableLegacy = async (search: string) => {
        const url = !!process.env.REACT_APP_USE_LOCAL_ENVIROMENT ? "http://localhost:3004" : BROK_HELPERS_URL;
        return await axios.get<CapTableLegacyRespons>(`${url}/captable/legacy`, {
            params: {
                query: search,
            },
        });
    };

    const getCaptableShareholders = async (captableAddress: string) => {
        const bearerToken = await requestPermissionTokenFromSigner();
        const url = !!process.env.REACT_APP_USE_LOCAL_ENVIROMENT ? "http://localhost:3004" : BROK_HELPERS_URL;
        return await axios.get<Shareholder[]>(`${url}/captable/${captableAddress}/shareholder/list`, {
            headers: {
                Authorization: `Bearer ${bearerToken}`,
            },
        });
    };

    const getCaptableShareholder = async (captableAddress: string, shareholderId: string) => {
        const bearerToken = await requestPermissionTokenFromSigner();
        const url = !!process.env.REACT_APP_USE_LOCAL_ENVIROMENT ? "http://localhost:3004" : BROK_HELPERS_URL;
        return await axios.get<Shareholder>(`${url}/captable/${captableAddress}/shareholder/${shareholderId}`, {
            headers: {
                Authorization: `Bearer ${bearerToken}`,
            },
        });
    };

    // UNCLAIMED

    // requires in jwt ['cacheable', 'domain', 'paths']; and user need to have entity in brok helpers
    const listUnclaimed = async () => {
        const bearerToken = await requestPermissionTokenFromSigner();
        const url = !!process.env.REACT_APP_USE_LOCAL_ENVIROMENT ? "http://localhost:3004" : BROK_HELPERS_URL;
        return await axios.get<Unclaimed[]>(`${url}/unclaimed/list`, {
            headers: {
                Authorization: `Bearer ${bearerToken}`,
            },
        });
    };

    // TODO operatorTransfer needs to be discussed. If true, brreg handles transfer for us
    // jwt requires = ["unclaimed"]
    const createUnclaimed = async (jwt: string) => {
        const url = !!process.env.REACT_APP_USE_LOCAL_ENVIROMENT ? "http://localhost:3004" : BROK_HELPERS_URL;
        return await axios.post<{ transfers: { amount: string; partition: string; address: string }[] }>(`${url}/unclaimed/`, {
            jwt: jwt,
            operatorTransfer: true,
        });
    };

    // TODO operatorTransfer needs to be discussed. If true, brreg handles transfer for us
    // jwt requires = ["unclaimedAddress"]
    const claim = async (jwt: string) => {
        const url = !!process.env.REACT_APP_USE_LOCAL_ENVIROMENT ? "http://localhost:3004" : BROK_HELPERS_URL;
        return await axios.post<{ claimed: boolean }>(`${url}/claim`, {
            jwt: jwt,
            operatorTransfer: true,
        });
    };

    const context: BrokContext = {
        createCaptable,
        getCaptableShareholders,
        getCaptableShareholder,
        listUnclaimed,
        createUnclaimed,
        claim,
        getCaptableLegacy
    };

    return <BrokContext.Provider value={context}>{props.children}</BrokContext.Provider>;
};

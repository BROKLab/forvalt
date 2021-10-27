import axios from "axios";
import React, { useContext } from "react";
import { SymfoniContext } from "./SymfoniContext";
import { useLocalStorage } from "./../utils/useLocalstorage";
import { toast } from "react-toastify";
import { SignatureRequest } from "../utils/SignerRequestHandler";

var debug = require("debug")("context:brok:");

interface Props {}

const BROK_HELPERS_VERIFIER = process.env.REACT_APP_BROK_HELPERS_VERIFIER;
const REACT_APP_BROK_HELPERS_URL = process.env.REACT_APP_BROK_HELPERS_URL;
const REACT_APP_USE_LOCAL_ENVIROMENT = process.env.REACT_APP_USE_LOCAL_ENVIROMENT;

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

export type BrokHelpersPresentResponse = {
    success: boolean;
    messages: string[];
    capTableAddress?: string;
    entityUpdated?: boolean;
    tokensUnclaimed?: {
        amount: string;
        partition: string;
        address: string;
    }[];
    tokensClaimed?: {
        partition: string;
        from: string;
        to: string;
        amount: string;
        capTableAddress: string;
        claimed: boolean;
        message: string
    }[];
};

export type BrokContextInterface = ReturnType<typeof useBrok>

export const BrokContext = React.createContext<BrokContextInterface>(undefined!);

export const useBrok = () => {
    const [token, setToken] = useLocalStorage<string>("permissionBrokToken", "");
    const { signer, initSigner, signatureRequestHandler } = useContext(SymfoniContext);

    const requestPermissionTokenFromSigner = async () => {
        // TODO fix real valid check of token
        if (token !== "") {
            return token;
        }

        debug("requestPermissionTokenFromSigner start checking for signer");

        if (!signer) {
            debug("doesnt have signer");
            initSigner();
            toast("Koble til med lommebok for å se all informasjon på denne siden.")
            return
        }

        if (!("request" in signer)) {
            toast("Klarer ikke å koble til din lommebok.")
            return
        }

        const request: SignatureRequest = {
            message: "Godkjenn Brønnøysundregistrene Forvalt å gjøre spørringer på dine vegne",
            fn: async () => {
                const url = REACT_APP_USE_LOCAL_ENVIROMENT === "true" ? "http://localhost:3004" : REACT_APP_BROK_HELPERS_URL;
                const paths = ["/captable/*", "/unclaimed/*"].map(path => `${url}${path}`)
                await signer.request("symfoniID_accessVP", [
                    {
                        verifier: BROK_HELPERS_VERIFIER,
                        payload: {
                            accessTo: "localhost:3000",
                            cacheable: true,
                            paths: paths,
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
            debug("userTokenJwt from Symfoni ID", userTokenJwt);
            setToken(userTokenJwt);
        } catch (e: any) {
            debug("[ERROR] requestPermissionTokenFromSigner", e);
            throw e;
        }
        return userTokenJwt;
    };

    // returns captableAddress or need to catch some error
    // jwt requiredCredential: ['orgnr', 'unclaimed', 'acceptedBoardDirectorTOADate', 'acceptedBoardDirectorTOAVersion'],
    const createCaptable = async (jwt: string) => {
        const url = REACT_APP_USE_LOCAL_ENVIROMENT === "true" ? "http://localhost:3004" : REACT_APP_BROK_HELPERS_URL;
        debug(`REACT_APP_USE_LOCAL_ENVIROMENT ${REACT_APP_USE_LOCAL_ENVIROMENT === "true"} - ${REACT_APP_USE_LOCAL_ENVIROMENT}`)
        debug(`url ${url}`)
        return axios.post<BrokHelpersPresentResponse>(`${url}/vcs/present`, {
            jwt,
            skipAmountControl: process.env.REACT_APP_IS_TEST ? true : false,
            skipBoardDirector: process.env.REACT_APP_IS_TEST ? true : false,
            skipDigitalEntityCheck: process.env.REACT_APP_IS_TEST ? true : false,
            skipVerifyCapTableAmount: process.env.REACT_APP_IS_TEST ? true : false,
        });
    };

    const getCaptableLegacy = async (search: string) => {
        const url = REACT_APP_USE_LOCAL_ENVIROMENT === "true" ? "http://localhost:3004" : REACT_APP_BROK_HELPERS_URL;
        debug(`REACT_APP_USE_LOCAL_ENVIROMENT ${REACT_APP_USE_LOCAL_ENVIROMENT === "true"} - ${REACT_APP_USE_LOCAL_ENVIROMENT}`)
        debug(`url ${url}`)
        return await axios.get<CapTableLegacyRespons>(`${url}/captable/legacy`, {
            headers: {
                Accept: "application/json",
            },
            params: {
                query: search,
            },
        });
    };

    const getCaptableShareholders = async (captableAddress: string) => {
        const bearerToken = await requestPermissionTokenFromSigner();
        const url = REACT_APP_USE_LOCAL_ENVIROMENT === "true" ? "http://localhost:3004" : REACT_APP_BROK_HELPERS_URL;
        return await axios.get<Shareholder[]>(`${url}/captable/${captableAddress}/shareholder/list`, {
            headers: {
                Authorization: `Bearer ${bearerToken}`,
            },
        });
    };

    const getCaptableShareholder = async (captableAddress: string, shareholderId: string) => {
        const bearerToken = await requestPermissionTokenFromSigner();
        const url = REACT_APP_USE_LOCAL_ENVIROMENT === "true" ? "http://localhost:3004" : REACT_APP_BROK_HELPERS_URL;
        return await axios.get<Shareholder>(`${url}/captable/${captableAddress}/shareholder/${shareholderId}`, {
            headers: {
                Authorization: `Bearer ${bearerToken}`,
            },
        });
    };

    // UNCLAIMED

    // requires in jwt ['cacheable', 'domain', 'paths']; and user need to have entity in brok helpers
    const getUnclaimedShares = async () => {
        const bearerToken = await requestPermissionTokenFromSigner();
        const url = REACT_APP_USE_LOCAL_ENVIROMENT === "true" ? "http://localhost:3004" : REACT_APP_BROK_HELPERS_URL;
        return await axios.get<Unclaimed[]>(`${url}/unclaimed/list`, {
            headers: {
                Authorization: `Bearer ${bearerToken}`,
            },
        });
    };

    // TODO operatorTransfer needs to be discussed. If true, brreg handles transfer for us
    // jwt requires = ["unclaimed"]
    const createUnclaimed = async (jwt: string) => {
        const url = REACT_APP_USE_LOCAL_ENVIROMENT === "true" ? "http://localhost:3004" : REACT_APP_BROK_HELPERS_URL;
        return await axios.post<BrokHelpersPresentResponse>(`${url}/vcs/present`, {
            jwt: jwt,
            operatorTransfer: true,
        });
    };

    // TODO operatorTransfer needs to be discussed. If true, brreg handles transfer for us
    // jwt requires = ["unclaimedAddress"]
    const claim = async (jwt: string) => {
        const url = REACT_APP_USE_LOCAL_ENVIROMENT === "true" ? "http://localhost:3004" : REACT_APP_BROK_HELPERS_URL;
        return await axios.post<BrokHelpersPresentResponse>(`${url}/vcs/present`, {
            jwt: jwt,
        });
    };

    return {
        createCaptable,
        getCaptableShareholders,
        getCaptableShareholder,
        getUnclaimedShares,
        createUnclaimed,
        claim,
        getCaptableLegacy
    };

}

export const BrokProvider: React.FC<Props> = ({ ...props }) => {
    const brok = useBrok()

    const context: BrokContextInterface = {
        ...brok
    }
    return <BrokContext.Provider value={context}>{props.children}</BrokContext.Provider>;
};

import axios from "axios";
import { Box, Button, Text } from "grommet";
import React, { useCallback, useContext, useState } from "react";
import { toast } from "react-toastify";
import { CapTableGraphQLTypes } from "../utils/CapTableGraphQL.utils";
import { SignatureRequest } from "../utils/SignerRequestHandler";
import { useLocalStorage } from "./../utils/useLocalstorage";
import { SymfoniContext } from "./SymfoniContext";
import { STATE } from "./useSymfoni";

var debug = require("debug")("context:brok");

interface Props {}

const BROK_HELPERS_VERIFIER = process.env.REACT_APP_BROK_HELPERS_VERIFIER;
const REACT_APP_BROK_HELPERS_URL = process.env.REACT_APP_BROK_HELPERS_URL;
const REACT_APP_USE_LOCAL_ENVIROMENT = process.env.REACT_APP_USE_LOCAL_ENVIROMENT;

export type BalanceAndMaybePrivateData = Partial<Shareholder> & CapTableGraphQLTypes.BalancesQuery.Balance;
export type ROLE = "BOARD_DIRECTOR" | "PUBLIC" | "SHAREHOLDER";

export const getRoleName = (role: ROLE) => {
    switch (role) {
        case "BOARD_DIRECTOR": {
            return "Styreleder";
        }
        case "PUBLIC": {
            return "Offentlig";
        }
        case "SHAREHOLDER": {
            return "Aksjeeier";
        }
    }
};

export interface Unclaimed {
    capTableName: string;
    address: string;
    name: string;
    balances: { amount: string; partition: string }[];
    capTableAddress: string;
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
    address: string;
    id: string;
    postcode?: string;
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
        message: string;
    }[];
};

export type BrokContextInterface = ReturnType<typeof useBrok>;

export const BrokContext = React.createContext<BrokContextInterface>(undefined!);

export const useBrok = () => {
    const [token, setToken] = useLocalStorage<string>("permissionBrokToken", "");
    const { signer, initSigner, signatureRequestHandler, state } = useContext(SymfoniContext);
    const [hasPromptedSigner, setHasPromptedSigner] = useState(false);
    const [hasPromptedToken, setHasPromptedToken] = useState(false);

    const fetchToken = useCallback(async () => {
        if (!signer) {
            debug("requestPermissionTokenFromSigner do NOT have signer");
            return undefined;
        }

        if (!("request" in signer)) {
            debug("Klarer ikke å koble til din lommebok.");
            return undefined;
        }
        debug("delegating to ", process.env.REACT_APP_PUBLIC_URL);
        const request: SignatureRequest = {
            message: "Gi Brønnøysundregistrene Forvalt applikasjonen tilgang til å gjøre spørringer på dine vegne",
            fn: async () => {
                const url = REACT_APP_USE_LOCAL_ENVIROMENT === "true" ? "http://localhost:3004" : REACT_APP_BROK_HELPERS_URL;
                return await signer.request("symfoniID_accessVP", [
                    {
                        verifier: BROK_HELPERS_VERIFIER,
                        access: {
                            delegatedTo: {
                                id: process.env.REACT_APP_PUBLIC_URL,
                            },
                            scopes: [
                                {
                                    id: `${url}/captable/:captableAddress/shareholder/list`,
                                    name: "All shareholders for all captables",
                                },
                                {
                                    id: `${url}/captable/:captableAddress/shareholder/:shareholderId`,
                                    name: "One shareholder for all captables",
                                },
                                {
                                    id: `${url}/unclaimed/list`,
                                    name: "All unclaimed tokens for your identifier ",
                                },
                            ],
                        },
                    },
                ]);
            },
        };
        if (!signatureRequestHandler) throw Error("TODO: Create error");
        signatureRequestHandler.add([request]);
        let userTokenJwt;
        try {
            const results = (await signatureRequestHandler.results()) as {
                jwt: string;
            }[];
            debug("Acceess VP results", results);
            userTokenJwt = results[0].jwt;
            if (userTokenJwt) {
                debug("Access VC fra Wallet", userTokenJwt);
                setToken(userTokenJwt);
            }
        } catch (e) {
            debug("requestPermissionTokenFromSigner hadde signer feil", e);
            return undefined;
        }
    }, [setToken, signatureRequestHandler, signer]);

    const tryFetchPermissionTokenFromSigner = useCallback(async () => {
        // TODO - fix real valid check of token
        // TODO - There is probably a signer race condition here

        debug("has Access token", token !== "" && token !== "undefined");
        if (token !== "" && token !== "undefined") {
            return token;
        }
        debug("requestPermissionTokenFromSigner start checking for signer");
        if (!signer && !hasPromptedSigner && state === STATE.READY) {
            setHasPromptedSigner(true);
            debug("Prompting for signer");
            toast(
                <Box gap="small">
                    <Text size="xsmall">Se mer informasjon ved å koble til en lommebok.</Text>
                    <Button size="small" label="Koble til lommebok" onClick={() => initSigner()}></Button>
                </Box>,
                { autoClose: 10000, onClose: () => setHasPromptedSigner(false) }
            );
            return undefined;
        }
        if (signer && !hasPromptedToken) {
            // only missing token
            debug("Prompting for token");
            setHasPromptedToken(true);
            toast(
                <Box gap="small">
                    <Text size="xsmall">Se mer informasjon ved å gi Forvalt tilgang til å hente data på dine vegne.</Text>
                    <Button size="small" label="Gi tilgang" onClick={() => fetchToken()}></Button>
                </Box>,
                { autoClose: 10000, onClose: () => setHasPromptedToken(false) }
            );
        }
    }, [fetchToken, hasPromptedSigner, hasPromptedToken, initSigner, signer, state, token]);

    // returns captableAddress or need to catch some error
    // jwt requiredCredential: ['orgnr', 'unclaimed', 'acceptedBoardDirectorTOADate', 'acceptedBoardDirectorTOAVersion'],
    const createCaptable = async (jwt: string) => {
        const url = REACT_APP_USE_LOCAL_ENVIROMENT === "true" ? "http://localhost:3004" : REACT_APP_BROK_HELPERS_URL;
        debug(`REACT_APP_USE_LOCAL_ENVIROMENT ${REACT_APP_USE_LOCAL_ENVIROMENT === "true"} - ${REACT_APP_USE_LOCAL_ENVIROMENT}`);
        debug(`url ${url}`);
        return axios.post<BrokHelpersPresentResponse>(`${url}/vcs/present`, {
            jwt,
            skipVerifyCapTableAmount: process.env.REACT_APP_IS_TEST === "true" ? true : false,
            skipVerifyNationalIdentityVC: process.env.REACT_APP_IS_TEST === "true" ? true : false,
            skipVerifyBoardDirector: process.env.REACT_APP_IS_TEST === "true" ? true : false,
            skipVerifyDirectTransfers: process.env.REACT_APP_IS_TEST === "true" ? true : false,
            skipDigitalEntityCheck: process.env.REACT_APP_IS_TEST === "true" ? true : false,
        });
    };

    const getCaptableLegacy = async (search: string) => {
        const url = REACT_APP_USE_LOCAL_ENVIROMENT === "true" ? "http://localhost:3004" : REACT_APP_BROK_HELPERS_URL;
        debug(`REACT_APP_USE_LOCAL_ENVIROMENT ${REACT_APP_USE_LOCAL_ENVIROMENT === "true"} - ${REACT_APP_USE_LOCAL_ENVIROMENT}`);
        debug(`url ${url}`);
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
        const bearerToken = await tryFetchPermissionTokenFromSigner().catch((err) => undefined);
        const url = REACT_APP_USE_LOCAL_ENVIROMENT === "true" ? "http://localhost:3004" : REACT_APP_BROK_HELPERS_URL;

        return await axios.get<{ yourRole: string; shareholders: Shareholder[] }>(`${url}/captable/${captableAddress}/shareholder/list`, {
            headers: bearerToken ? { Authorization: `Bearer ${bearerToken}` } : {},
        });
    };

    const getCaptableShareholder = async (captableAddress: string, shareholderId: string) => {
        const bearerToken = await tryFetchPermissionTokenFromSigner().catch((err) => undefined);
        const url = REACT_APP_USE_LOCAL_ENVIROMENT === "true" ? "http://localhost:3004" : REACT_APP_BROK_HELPERS_URL;
        return await axios.get<Shareholder>(`${url}/captable/${captableAddress}/shareholder/${shareholderId}`, {
            headers: bearerToken ? { Authorization: `Bearer ${bearerToken}` } : {},
        });
    };

    // UNCLAIMED

    // requires in jwt ['cacheable', 'domain', 'paths']; and user need to have entity in brok helpers
    const getUnclaimedShares = async () => {
        const url = REACT_APP_USE_LOCAL_ENVIROMENT === "true" ? "http://localhost:3004" : REACT_APP_BROK_HELPERS_URL;
        return await axios.get<Unclaimed[]>(`${url}/unclaimed/list`, {
            headers: {
                Authorization: `Bearer ${token}`,
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

    const updateShareholder = async (jwt: string) => {
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
        getCaptableLegacy,
        updateShareholder,
        token,
        setToken,
    };
};

export const BrokProvider: React.FC<Props> = ({ ...props }) => {
    const brok = useBrok();

    const context: BrokContextInterface = {
        ...brok,
    };
    return <BrokContext.Provider value={context}>{props.children}</BrokContext.Provider>;
};

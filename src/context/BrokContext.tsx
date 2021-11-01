import axios from "axios";
import { Box, Button, Text } from "grommet";
import React, { useContext } from "react";
import { toast } from "react-toastify";
import { CapTableGraphQLTypes } from "../utils/CapTableGraphQL.utils";
import { SignatureRequest } from "../utils/SignerRequestHandler";
import { useLocalStorage } from "./../utils/useLocalstorage";
import { SymfoniContext } from "./SymfoniContext";

var debug = require("debug")("context:brok:");

interface Props {}

const BROK_HELPERS_VERIFIER = process.env.REACT_APP_BROK_HELPERS_VERIFIER;
const REACT_APP_BROK_HELPERS_URL = process.env.REACT_APP_BROK_HELPERS_URL;
const REACT_APP_USE_LOCAL_ENVIROMENT = process.env.REACT_APP_USE_LOCAL_ENVIROMENT;

export type CapTableBalance = Shareholder & CapTableGraphQLTypes.BalancesQuery.Balance ;
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
    address: string;
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
        message: string;
    }[];
};

export type BrokContextInterface = ReturnType<typeof useBrok>;

export const BrokContext = React.createContext<BrokContextInterface>(undefined!);

export const useBrok = () => {
    const [token, setToken] = useLocalStorage<string>("permissionBrokToken", "");
    const { signer, initSigner, signatureRequestHandler } = useContext(SymfoniContext);

    const tryFetchPermissionTokenFromSigner = async () => {
        // TODO fix real valid check of token
        if (token !== "") {
            return token;
        }
        debug("requestPermissionTokenFromSigner start checking for signer");

        if (!signer) {
            debug("requestPermissionTokenFromSigner do NOT have signer");
            toast(
                <Box gap="small">
                    <Text size="xsmall">Se mer informasjon på denne siden ved å koble til en lommebok.</Text>
                    <Button size="small" label="Koble til lommebok" onClick={() => initSigner()}></Button>
                </Box>
            );
            throw Error("Trenger tilgang for å se all informasjon på denne siden.");
        }

        if (!("request" in signer)) {
            toast("Klarer ikke å koble til din lommebok.");
            throw Error("Klarer ikke å koble til din lommebok.");
        }

        const request: SignatureRequest = {
            message: "Gi Brønnøysundregistrene Forvalt applikasjonen tilgang til å gjøre spørringer på dine vegne",
            fn: async () => {
                const url = REACT_APP_USE_LOCAL_ENVIROMENT === "true" ? "http://localhost:3004" : REACT_APP_BROK_HELPERS_URL;
                await signer.request("symfoniID_accessVP", [
                    {
                        verifier: BROK_HELPERS_VERIFIER,
                        payload: {
                            access: {
                                delegatedTo: {
                                  id: process.env.PUBLIC_URL,
                                },
                                scopes: [
                                    {
                                        id: `${url}/captable/:captableAddress/shareholder/list`,
                                        name: 'Fetch list of shareholders for all captables',
                                      },
                                      {
                                        id: `${url}/captable/:captableAddress/shareholder/:shareholderId`,
                                        name: 'Fetch shareholder for captable',
                                      },
                                      {
                                        id: `${url}/unclaimed/list`,
                                        name: 'Fetch all unclaimed captable transfers.',
                                      },
                                ],
                              },
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
            debug("requestPermissionTokenFromSigner hadde signer feil", e);
            throw Error("Feil ved signering av tilgangsforespørsel");
        }
        return userTokenJwt;
    };

    // returns captableAddress or need to catch some error
    // jwt requiredCredential: ['orgnr', 'unclaimed', 'acceptedBoardDirectorTOADate', 'acceptedBoardDirectorTOAVersion'],
    const createCaptable = async (jwt: string) => {
        const url = REACT_APP_USE_LOCAL_ENVIROMENT === "true" ? "http://localhost:3004" : REACT_APP_BROK_HELPERS_URL;
        debug(`REACT_APP_USE_LOCAL_ENVIROMENT ${REACT_APP_USE_LOCAL_ENVIROMENT === "true"} - ${REACT_APP_USE_LOCAL_ENVIROMENT}`);
        debug(`url ${url}`);
        return axios.post<BrokHelpersPresentResponse>(`${url}/vcs/present`, {
            jwt,
            skipAmountControl: process.env.REACT_APP_IS_TEST === "true" ? true : false,
            skipBoardDirector: process.env.REACT_APP_IS_TEST  === "true"? true : false,
            skipDigitalEntityCheck: process.env.REACT_APP_IS_TEST  === "true" ? true : false,
            skipVerifyCapTableAmount: process.env.REACT_APP_IS_TEST   === "true"? true : false,
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
        // const bearerToken = await tryFetchPermissionTokenFromSigner();
        // const url = REACT_APP_USE_LOCAL_ENVIROMENT === "true" ? "http://localhost:3004" : REACT_APP_BROK_HELPERS_URL;

        // return {
        //     status: 200,
        //     statusText: "Alt i orden",
        //     config: {},
        //     headers: {},
        //     data: {
        //         yourRole: "PUBLIC",
        //         shareholders: [
        //             {
        //                 address: "0x2114d77a3d3376149db0435991c8dbd62d48413e",
        //                 identifier: undefined,
        //                 name: "Asgeir Ågård",
        //                 city: "Nordfjordeid",
        //                 postcode: undefined,
        //                 email: undefined,
        //                 birthdate: "12.10.1984",
        //                 id: "1",
        //             },
        //             {
        //                 address: "0x4e9ea31029f8c01a8f1c5326a5348f8fb5ceb616",
        //                 identifier: undefined,
        //                 name: "Fredrik Tangen",
        //                 city: "Oslo",
        //                 postcode: undefined,
        //                 email: undefined,
        //                 birthdate: "03.05.1971",
        //                 id: "1",
        //             },
        //             {
        //                 address: "0x64832336798d9816ad42a023958df48104fb5650",
        //                 identifier: undefined,
        //                 name: "Ola Jensen",
        //                 city: "Oslo",
        //                 postcode: undefined,
        //                 email: undefined,
        //                 birthdate: "28.09.1993",
        //                 id: "1",
        //             },
        //         ] as Shareholder[],
        //     },
        // };

        return {
            status: 200,
            statusText: "Alt i orden",
            config: {},
            headers: {},
            data: {
                yourRole: "BOARD_DIRECTOR",
                shareholders: [
                    {
                        address: "0x2114d77a3d3376149db0435991c8dbd62d48413e",
                        identifier: "0x2114d77a3d3376149db0435991c8dbd62d48413e",
                        email: "test0211@test.no",
                        name: "Asgeir Ågård",
                        city: "Nordfjordeid",
                        postcode: 1234,
                        birthdate: "01.12.2000",
                        id: "1",
                    },
                    {
                        address: "0x4e9ea31029f8c01a8f1c5326a5348f8fb5ceb616",
                        identifier: "0x4e9ea31029f8c01a8f1c5326a5348f8fb5ceb616",
                        email: "test49e@test.no",
                        name: "Fredrik Tangen",
                        city: "Oslo",
                        postcode: 6551,
                        birthdate: "01.12.1980",
                        id: "1",
                    },
                    {
                        address: "0x64832336798d9816ad42a023958df48104fb5650",
                        identifier: "0x64832336798d9816ad42a023958df48104fb5650",
                        email: "test6483@test.no",
                        name: "Ola Jensen",
                        city: "Oslo",
                        postcode: 1557,
                        birthdate: "01.10.1945",
                        id: "1",
                    },
                ],
            },
        };

        // return await axios.get<Shareholder[]>(`${url}/captable/${captableAddress}/shareholder/list`, {
        //     headers: {
        //         Authorization: `Bearer ${bearerToken}`,
        //     },
        // });
    };

    const getCaptableShareholder = async (captableAddress: string, shareholderId: string) => {
        const bearerToken = await tryFetchPermissionTokenFromSigner();
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
        const bearerToken = await tryFetchPermissionTokenFromSigner();
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
        getCaptableLegacy,
    };
};

export const BrokProvider: React.FC<Props> = ({ ...props }) => {
    const brok = useBrok();

    const context: BrokContextInterface = {
        ...brok,
    };
    return <BrokContext.Provider value={context}>{props.children}</BrokContext.Provider>;
};

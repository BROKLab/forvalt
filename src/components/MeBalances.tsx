import { ethers } from "ethers";
import { useQuery } from "graphql-hooks";
import { Box, Button, DataTable, Heading, Spinner, Text } from "grommet";
import { Add } from "grommet-icons";
import React, { useContext, useEffect, useState } from "react";
import { useHistory } from "react-router";
import { toast } from "react-toastify";
import useAsyncEffect from "use-async-effect";
import { BrokContext, Unclaimed } from "../context/BrokContext";
import { SymfoniContext } from "../context/SymfoniContext";
import { SignatureRequest } from "../utils/SignerRequestHandler";
import { TokenHolderGraphQL, TokenHoldersGraphQLTypes } from "../utils/TokenHoldersGraphQL.utils";
var debug = require("debug")("component:MeBalances");

interface Balance {
    capTableName: string;
    partition: string;
    capTableAddress: string;
    amount: string;
    claimed: boolean;
}

interface Props {
    address: string;
}

export const MeBalances: React.FC<Props> = ({ ...props }) => {
    debug("Render");
    const { getUnclaimedShares, claim } = useContext(BrokContext);
    const { signatureRequestHandler, signer, initSigner } = useContext(SymfoniContext);
    // const requireSigner = !signer || !("request" in signer);

    const { loading, data } = useQuery<TokenHoldersGraphQLTypes.TokenHolderQuery.Response>(TokenHolderGraphQL.TOKEN_HOLDER_QUERY(props.address));
    const [unclaimedLoading, setUnclaimedLoading] = useState<boolean>(false);
    const [unclaimed, setUnclaimed] = useState<Unclaimed[]>([]);
    const [balances, setBalances] = useState<Balance[]>([]);
    const [toBeClaimed, setToBeClaimed] = useState<string[]>([]);
    const history = useHistory();

    useEffect(() => {
        if (loading || unclaimedLoading) return;
        if (!data) return;

        const _unclm = unclaimed.flatMap((unclm) => {
            return unclm.balances.map((bl) => {
                return {
                    capTableAddress: unclm.capTableAddress,
                    capTableName: unclm.capTableName,
                    partition: ethers.utils.parseBytes32String(bl.partition),
                    amount: bl.amount,
                    claimed: false,
                } as Balance;
            });
        });

        const _clm = data.tokenHolders.flatMap((clm) => {
            return clm.balances.map((bl) => {
                return {
                    capTableAddress: bl.capTable.id,
                    capTableName: bl.capTable.name,
                    partition: bl.partition,
                    amount: bl.amount,
                    claimed: true,
                } as Balance;
            });
        });

        setBalances([..._clm, ..._unclm]);
    }, [loading, data, unclaimed, unclaimedLoading]);

    // TODO almost as useAsyncEffect as under... :()
    const fetchUnclaimed = async () => {
        try {
            setUnclaimedLoading(true);
            const response = await getUnclaimedShares();
            if (response.status === 200) {
                debug("getUnclaimed response:");
                debug(response);
                setUnclaimed(response.data);
                setUnclaimedLoading(false);
            }
        } catch (error) {
            debug("error in getUnclaimedShares", error);
            setUnclaimedLoading(false);
        }
    };

    useAsyncEffect(async (isMounted) => {
        try {
            setUnclaimedLoading(true);
            debug("inAsync before getUnclaimed");
            const response = await getUnclaimedShares();
            if (response.status === 200) {
                debug("getUnclaimed response:");
                debug(response);
                if (isMounted()) {
                    setUnclaimed(response.data);
                    setUnclaimedLoading(false);
                }
            }
        } catch (error) {
            debug("error in getUnclaimedShares", error);
            setUnclaimedLoading(false);
        }
    }, []);

    const toggleToBeClaim = (address: string) => {
        if (toBeClaimed.includes(address)) {
            const t = toBeClaimed.filter((toB) => toB !== address);
            setToBeClaimed(t);
        } else {
            setToBeClaimed([...toBeClaimed, address]);
        }
    };

    const claimAllUnclaimed = async () => {
        const BROK_HELPERS_VERIFIER = process.env.REACT_APP_BROK_HELPERS_VERIFIER;
        if (!signer || !("request" in signer)) {
            debug(`No signer or request in signer found, running initSigner`);
            return initSigner();
        }
        const request: SignatureRequest = {
            message: "Signer på at du ønsker å gjøre krav på aksjene",
            fn: async () =>
                await signer.request("symfoniID_capTableClaimToken", [
                    {
                        verifier: BROK_HELPERS_VERIFIER,
                        claimTokens: toBeClaimed,
                    },
                ]),
        };

        debug(`Created request in signatureRequestHandler`);
        signatureRequestHandler.add([request]);
        let response = (await signatureRequestHandler.results().catch((error) => {
            debug(error);
            return undefined;
        })) as { jwt: string }[] | undefined;
        if (!response) {
            toast(`Signering ble avbrutt.`);
            return;
        }
        if (!Array.isArray(response) || !response[0]) {
            toast(`Feil i respons fra Lommebok.`)!;
            return;
        }
        const claimVp = response[0].jwt;
        const claimUnclaimedResponse = await claim(claimVp).catch((error) => {
            toast(error.message);
            return undefined;
        });
        debug("claimed result", claimUnclaimedResponse);
        await fetchUnclaimed();
        setToBeClaimed([]);
    };

    return (
        <Box gap="small">
            {!signer || (balances.length === 0 && !loading && !unclaimedLoading && <Heading level={2}>Du har ingen aksjer</Heading>)}
            <Box margin="small" align="center" height="small">
                {(loading || unclaimedLoading) && <Spinner size="large"></Spinner>}
            </Box>
            {balances.length > 0 && (
                <DataTable
                    data={balances ? balances : []}
                    primaryKey={false}
                    columns={[
                        {
                            property: "Navn",
                            header: <Text>Navn</Text>,
                            render: (data: Balance) => data.capTableName,
                        },
                        {
                            property: "amount",
                            header: <Text>Antall</Text>,
                            render: (data: Balance) => parseInt(ethers.utils.formatEther(data.amount)),
                        },
                        {
                            property: "balanceByPartition",
                            header: <Text>Aksjeklasse</Text>,
                            render: (data: Balance) => data.partition,
                        },
                        {
                            property: "virtual",
                            header: "",
                            render: (data: Balance) => {
                                return (
                                    <Box direction="row">
                                        {!data.claimed && (
                                            <Button
                                                color={toBeClaimed.includes(data.capTableAddress) ? "blue" : "green"}
                                                icon={<Add />}
                                                size="small"
                                                label={toBeClaimed.includes(data.capTableAddress) ? "Angre" : "Gjør krav"}
                                                title="Gjør krav på aksjene som er tildelt deg ved å trykke her"
                                                onClick={() => toggleToBeClaim(data.capTableAddress)}
                                                // disabled={}
                                            ></Button>
                                        )}
                                        <Button
                                            size="small"
                                            label={"Gå til aksjeeierbok"}
                                            onClick={() => history.push(`/captable/${data.capTableAddress}`)}></Button>
                                    </Box>
                                );
                            },
                        },
                    ]}></DataTable>
            )}
            {toBeClaimed.length > 0 && (
                <Box>
                    <Text>Trykk her for gå gjøre krav på aksjer for {toBeClaimed} selskap(er)</Text>
                    <Button
                        size="small"
                        label="Gjør krav på aksjer"
                        title="Trykk her for å gjøre krav på aksjene"
                        onClick={() => claimAllUnclaimed()}></Button>
                </Box>
            )}
        </Box>
    );
};

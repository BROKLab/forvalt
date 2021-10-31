import { ethers } from "ethers";
import { useQuery } from "graphql-hooks";
import { Add } from "grommet-icons";
import { Box, DataTable, Heading, Text, Button, Spinner } from "grommet";
import React, { useContext, useEffect, useState } from "react";
import useAsyncEffect from "use-async-effect";
import { BrokContext, Unclaimed } from "../context/BrokContext";
import { TokenHolderGraphQL, TokenHoldersGraphQLTypes } from "../utils/TokenHoldersGraphQL.utils";
import { SymfoniContext } from "../context/SymfoniContext";
import { ExportExcel } from "../utils/ExportExcel";
import useInterval from "../utils/useInterval";
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
    const { getUnclaimedShares } = useContext(BrokContext);
    const { signatureRequestHandler, CapTable, CapTableRegistry, signer, initSigner } = useContext(SymfoniContext);
    const requireSigner = !signer || !("request" in signer);

    const { loading, error, data, refetch } = useQuery<TokenHoldersGraphQLTypes.TokenHolderQuery.Response>(
        TokenHolderGraphQL.TOKEN_HOLDER_QUERY(props.address)
    );
    const [unclaimedLoading, setUnclaimedLoading] = useState<boolean>(false);
    const [unclaimed, setUnclaimed] = useState<Unclaimed[]>([]);
    const [balances, setBalances] = useState<Balance[]>();

    useEffect(() => {
        if (loading || unclaimedLoading) return;
        if (!data) return;

        const _unclm = unclaimed.flatMap((unclm) => {
            return unclm.balances.map((bl) => {
                return {
                    capTableAddress: unclm.address,
                    capTableName: unclm.capTableName,
                    partition: bl.partition,
                    amount: bl.amount,
                    claimed: false,
                } as Balance;
            });
        });

        const _clm = data.tokenHolders.flatMap((clm) => {
            return clm.balances.map((bl) => {
                return {
                    capTableAddress: clm.address,
                    capTableName: bl.capTable.name,
                    partition: bl.partition,
                    amount: bl.amount,
                    claimed: true,
                } as Balance;
            });
        });

        setBalances([..._clm, ..._unclm]);
    }, [loading, data, unclaimed, unclaimedLoading]);

    useAsyncEffect(async (isMounted) => {
        try {
            setUnclaimedLoading(true);
            const response = await getUnclaimedShares();
            if (response.status === 200) {
                debug("getUnclaimed response:");
                debug(response);
                if (isMounted()) {
                    setUnclaimed(response.data);
                    setUnclaimedLoading(false);
                }
            }
        } catch (error: any) {
            if ("message" in error) {
                debug(error.message);
            } else {
                debug("error in getUnclaimedShares", error);
            }
            setUnclaimedLoading(false);
        }
    }, []);
    debug("balances", balances);

    return (
        <Box gap="small">
            <Heading level={3}>Mine aksjer</Heading>
            {balances && (
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
                            render: (data: Balance) => ethers.utils.formatEther(data.amount),
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
                                return data.claimed ? null : (
                                    <Box direction="row">
                                        <Button
                                            icon={<Add />}
                                            size="small"
                                            label="Gjør krav"
                                            title="Gjør krav på aksjene som er tildelt deg ved å trykke her"
                                            // onClick={() => claimUnclaimed()}
                                            // disabled={}
                                        ></Button>
                                    </Box>
                                );
                            },
                        },
                    ]}></DataTable>
            )}
            <Box margin="small" align="center" height="small">
                {(loading || unclaimedLoading) && <Spinner></Spinner>}
            </Box>
        </Box>
    );
};

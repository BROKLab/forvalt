import { ethers } from "ethers";
import { useQuery } from "graphql-hooks";
import { Box, Button, DataTable, Paragraph, Spinner, Text } from "grommet";
import { Edit } from "grommet-icons";
import React, { useContext, useEffect, useState } from "react";
import { useAsyncEffect } from "use-async-effect";
import { BrokContext, CapTableBalance, getRoleName, ROLE, Shareholder } from "../context/BrokContext";
import { CapTableGraphQL, CapTableGraphQLTypes } from "../utils/CapTableGraphQL.utils";
import { ExportExcel } from "../utils/ExportExcel";
import useInterval from "../utils/useInterval";
var debug = require("debug")("component:CapTableBalances");

interface Props {
    capTableAddress: string;
    name: string;
}

export const CapTableBalances: React.FC<Props> = ({ ...props }) => {
    const { loading, error, data, refetch } = useQuery<CapTableGraphQLTypes.BalancesQuery.Response>(
        CapTableGraphQL.BALANCES_QUERY(props.capTableAddress)
    );
    const [shareholdersLoading, getShareholdersLoading] = useState(false);
    const [role, setRole] = useState<ROLE>("PUBLIC");
    const [shareholders, setShareholders] = useState<Shareholder[]>([]);
    const [capTableBalance, setCapTableBalance] = useState<CapTableBalance[]>([]);

    const { getCaptableShareholders } = useContext(BrokContext);

    useEffect(() => {
        if (shareholdersLoading || loading) return;
        if (!data) return;

        const _capTableBalance = mergeBalancesWithShareholderDate(data.balances, shareholders);
        setCapTableBalance(_capTableBalance);
    }, [shareholdersLoading, loading, data, shareholders]);

    useInterval(() => {
        refetch();
    }, 4000);

    const mergeBalancesWithShareholderDate = (balances: CapTableGraphQLTypes.BalancesQuery.Balance[], shareholders: Shareholder[]) => {
        const isSameLength = balances.length === shareholders.length;
        debug("Balances and shareholder is same length", isSameLength);

        return balances
            .map((balance) => {
                const shareholder = shareholders.find((s) => s.address === balance.tokenHolder.address);
                if (!shareholder) {
                    console.warn("Could not find shareholder belonging to balance");
                    return;
                }
                return {
                    ...shareholder,
                    ...balance,
                };
            })
            .filter((obj): obj is Merged => !!obj);
    };

    useAsyncEffect(async (isMounted) => {
        try {
            getShareholdersLoading(true);
            const response = await getCaptableShareholders(props.capTableAddress);

            if (response.status === 200) {
                if (isMounted()) {
                    setShareholders(response.data.shareholders);
                    setRole(response.data.yourRole as ROLE);
                    getShareholdersLoading(false);
                    debug("role", response.data.yourRole);
                }
            }
        } catch (error: any) {
            if ("message" in error) {
                debug(error.message);
            } else {
                debug("error in getUnclaimedShares", error);
            }
        }
    }, []);

    type TableProps = {
        data: CapTableBalance[];
        isBoardDirector: boolean;
    };

    const CapTableBalanceTable = ({ data, isBoardDirector }: TableProps) => {
        if (isBoardDirector) {
            {
                return (
                    data && (
                        <DataTable
                            data={capTableBalance ? capTableBalance : []}
                            primaryKey={false}
                            columns={[
                                // {
                                //     property: "address",
                                //     header: <Text>ID</Text>,
                                //     render: (data) => <FormatEthereumAddress address={data.tokenHolder.address}></FormatEthereumAddress>,
                                // },
                                {
                                    property: "name",
                                    header: <Text>Navn</Text>,
                                    render: (data) => data.name,
                                },
                                {
                                    property: "city",
                                    header: <Text>By</Text>,
                                    render: (data) => data.city,
                                },
                                {
                                    property: "postcode",
                                    header: <Text>Postkode</Text>,
                                    render: (data) => data.postcode ?? "",
                                },
                                {
                                    property: "email",
                                    header: <Text>Epost</Text>,
                                    render: (data) => data.email ?? "",
                                },
                                {
                                    property: "birthday",
                                    header: <Text>Født</Text>,
                                    render: (data) => data.birthdate ?? "",
                                },
                                {
                                    property: "balance",
                                    header: <Text>Aksjer</Text>,
                                    render: (data) => ethers.utils.formatEther(data.amount),
                                },
                                {
                                    property: "balanceByPartition",
                                    header: <Text>Aksjeklasser</Text>,
                                    render: (data) => data.partition,
                                },
                                {
                                    property: "virtual",
                                    header: "",
                                    render: (data) => {
                                        return (
                                            <Button
                                                icon={<Edit></Edit>}
                                                // onClick={() => setEditEntity(data.tokenHolder.address)}
                                                // disabled={
                                                //     data.capTable.owner.toLowerCase() !== address?.toLowerCase()
                                                // }
                                            ></Button>
                                        );
                                    },
                                },
                            ]}></DataTable>
                    )
                );
            }
        } else {
            {
                return (
                    data && (
                        <DataTable
                            data={capTableBalance ? capTableBalance : []}
                            primaryKey={false}
                            columns={[
                                // {
                                //     property: "address",
                                //     header: <Text>ID</Text>,
                                //     render: (data) => <FormatEthereumAddress address={data.tokenHolder.address}></FormatEthereumAddress>,
                                // },
                                {
                                    property: "name",
                                    header: <Text>Navn</Text>,
                                    render: (data) => data.name,
                                },
                                {
                                    property: "city",
                                    header: <Text>By</Text>,
                                    render: (data) => data.city,
                                },
                                {
                                    property: "balance",
                                    header: <Text>Aksjer</Text>,
                                    render: (data) => ethers.utils.formatEther(data.amount),
                                },
                                {
                                    property: "balanceByPartition",
                                    header: <Text>Aksjeklasser</Text>,
                                    render: (data) => data.partition,
                                },
                                {
                                    property: "virtual",
                                    header: "",
                                    render: (data) => {
                                        return (
                                            <Button
                                                icon={<Edit></Edit>}
                                                // onClick={() => setEditEntity(data.tokenHolder.address)}
                                                // disabled={
                                                //     data.capTable.owner.toLowerCase() !== address?.toLowerCase()
                                                // }
                                            ></Button>
                                        );
                                    },
                                },
                            ]}></DataTable>
                    )
                );
            }
        }
    };

    return (
        <Box>
            {error && <Paragraph>Noe galt skjedde</Paragraph>}
            <CapTableBalanceTable isBoardDirector={role === "BOARD_DIRECTOR"} data={capTableBalance} />
            {capTableBalance && (
                <Box fill="horizontal" direction="row" margin="small" align="center" justify="between">
                    <Text color="blue">Vises som {getRoleName(role).toLocaleLowerCase()}</Text>
                    <ExportExcel capTableName={props.name} data={capTableBalance} />
                </Box>
            )}
            <Box margin="small" align="center" height="small">
                {loading || (shareholdersLoading && <Spinner></Spinner>)}
            </Box>
        </Box>
    );
};

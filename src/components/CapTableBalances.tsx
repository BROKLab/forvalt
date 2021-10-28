import { ethers } from "ethers";
import { useQuery } from "graphql-hooks";
import { Box, Button, DataTable, Paragraph, Spinner, Text } from "grommet";
import { Edit } from "grommet-icons";
import React, { useContext, useEffect, useState } from "react";
import { useAsyncEffect } from "use-async-effect";
import { BrokContext, Shareholder } from "../context/BrokContext";
import { CapTableGraphQL, CapTableGraphQLTypes } from "../utils/CapTableGraphQL.utils";
import { ExportExcel } from "../utils/ExportExcel";
import { FormatEthereumAddress } from "./FormatEthereumAddress";
var debug = require("debug")("component:CapTableBalances");

interface Props {
    capTableAddress: string;
    name: string;
}

type Merged = Shareholder & CapTableGraphQLTypes.BalancesQuery.Balance;

export const CapTableBalances: React.FC<Props> = ({ ...props }) => {
    const { loading, error, data, refetch } = useQuery<CapTableGraphQLTypes.BalancesQuery.Response>(
        CapTableGraphQL.BALANCES_QUERY(props.capTableAddress)
    );
    const [brokLoading, setBrokloading] = useState(false);
    const [isBoardDirector, setIsBoardDirector] = useState(false);
    const [shareholders, setShareHolder] = useState<Shareholder[]>([]);
    const [merged, setMerged] = useState<Merged[]>([]);

    const { getCaptableShareholders } = useContext(BrokContext);

    useEffect(() => {
        if (brokLoading || loading) return;
        if (!data) return;

        const isSameLength = data.balances.length === shareholders.length;
        debug("Balances and shareholder is same length", isSameLength);

        const _merged = data.balances
            .map((balance) => {
                // TODO how to join them
                const shareholder = shareholders.find((s) => s.id === balance.tokenHolder.address);
                console.log("identifier", shareholder?.identifier);
                console.log("address", balance.tokenHolder.address);
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

        console.log(_merged);
        setMerged(_merged);
    }, [brokLoading, loading]);

    // useInterval(() => {
    //     refetch()
    // }, 4000)

    useAsyncEffect(async (isMounted) => {
        try {
            setBrokloading(true);
            const response = await getCaptableShareholders(props.capTableAddress);

            if (response.status === 200) {
                if (isMounted()) {
                    setShareHolder(response.data);
                    setBrokloading(false);
                    const isBoardDirector = response.data.find((sh) => sh.email !== undefined) !== undefined;
                    debug("isBoardDirector", isBoardDirector);
                    setIsBoardDirector(isBoardDirector);
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
        data: Merged[];
        isBoardDirector: boolean;
    };

    const Table = ({ data, isBoardDirector }: TableProps) => {
        if (isBoardDirector) {
            {
                return (
                    data && (
                        <DataTable
                            data={merged ? merged : []}
                            primaryKey={false}
                            columns={[
                                {
                                    property: "address",
                                    header: <Text>ID</Text>,
                                    render: (data) => <FormatEthereumAddress address={data.tokenHolder.address}></FormatEthereumAddress>,
                                },
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
                            data={merged ? merged : []}
                            primaryKey={false}
                            columns={[
                                {
                                    property: "address",
                                    header: <Text>ID</Text>,
                                    render: (data) => <FormatEthereumAddress address={data.tokenHolder.address}></FormatEthereumAddress>,
                                },
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

            <Table isBoardDirector={isBoardDirector} data={merged} />
            {data && <ExportExcel capTableName={props.name} data={data} />}
            <Box margin="small" align="center" height="small">
                {loading && <Spinner></Spinner>}
            </Box>
        </Box>
    );
};

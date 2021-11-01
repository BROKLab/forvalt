import { ethers } from "ethers";
import { useQuery } from "graphql-hooks";
import { Box, Button, DataTable, Heading, Paragraph, Spinner, Text } from "grommet";
import { Edit } from "grommet-icons";
import React, { useContext, useEffect, useState } from "react";
import { useAsyncEffect } from "use-async-effect";
import { BrokContext, CapTableBalance, getRoleName, ROLE, Shareholder } from "../context/BrokContext";
import { CapTableGraphQL, CapTableGraphQLTypes } from "../utils/CapTableGraphQL.utils";
import { ExportExcel } from "../utils/ExportExcel";
import useInterval from "../utils/useInterval";
import { EditShareholderModal } from "./EditShareholderModal";
var debug = require("debug")("component:CapTableBalances");

interface Props {
    capTableAddress: string;
    name: string;
}
export type UpdateShareholderData = {
    name: string;
    email: string;
    birthdate: string;
    postcode: number;
    city: string;
};
export const CapTableBalances: React.FC<Props> = ({ ...props }) => {
    const { loading, error, data, refetch } = useQuery<CapTableGraphQLTypes.BalancesQuery.Response>(
        CapTableGraphQL.BALANCES_QUERY(props.capTableAddress)
    );
    const [shareholdersLoading, getShareholdersLoading] = useState(false);
    const [role, setRole] = useState<ROLE>("PUBLIC");
    const [shareholders, setShareholders] = useState<Shareholder[]>([]);
    const [capTableBalance, setCapTableBalance] = useState<CapTableBalance[]>([]);
    const [editEntity, setEditShareholder] = useState<CapTableBalance>();

    const { getCaptableShareholders, updateShareholder } = useContext(BrokContext);

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
                    return undefined;
                }
                return {
                    ...shareholder,
                    ...balance,
                };
            })
            .filter((obj): obj is CapTableBalance => !!obj);
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

    const roleDependendtColums = () => {
        return [
            // {
            //     property: "address",
            //     header: <Text>ID</Text>,
            //     render: (data) => <FormatEthereumAddress address={data.tokenHolder.address}></FormatEthereumAddress>,
            // },
            {
                property: "name",
                header: <Text>Navn</Text>,
                render: (data: CapTableBalance) => data.name,
            },
            {
                property: "city",
                header: <Text>By</Text>,
                render: (data: CapTableBalance) => data.city,
            },
            {
                property: "postcode",
                header: <Text>Postkode</Text>,
                render: (data: CapTableBalance) => data.postcode ?? "",
            },
            {
                property: "email",
                header: <Text>Epost</Text>,
                render: (data: CapTableBalance) => data.email ?? "",
            },
            {
                property: "birthday",
                header: <Text>Født</Text>,
                render: (data: CapTableBalance) => data.birthdate ?? "",
            },
            {
                property: "balance",
                header: <Text>Aksjer</Text>,
                render: (data: CapTableBalance) => ethers.utils.formatEther(data.amount),
            },
            {
                property: "balanceByPartition",
                header: <Text>Aksjeklasser</Text>,
                render: (data: CapTableBalance) => data.partition,
            },
            {
                property: "virtual",
                header: "",
                render: (data: CapTableBalance) => {
                    return <Button icon={<Edit></Edit>} onClick={() => setEditShareholder(data)} />;
                },
            },
        ].filter((row) => {
            if (role !== "BOARD_DIRECTOR") {
                if (["identifier", "email", "postcode"].includes(row.property)) {
                    return false;
                }
            }
            return true;
        });
    };

    const updateShareholderData = (updateShareholderData: UpdateShareholderData) => {
        // TODO fix jwt and do request

        debug("updateShareholderData", updateShareholderData);
        setEditShareholder(undefined);
        updateShareholder("");
    };

    return (
        <Box>
            {error && <Paragraph>Noe galt skjedde</Paragraph>}
            {editEntity && (
                <EditShareholderModal
                    onDismiss={() => setEditShareholder(undefined)}
                    updateShareholderData={{
                        name: editEntity.name,
                        email: editEntity.email ?? "",
                        city: editEntity.city,
                        birthdate: editEntity.birthdate,
                        postcode: editEntity.postcode ?? 0,
                    }}
                    onConfirm={updateShareholderData}
                />
            )}

            {data && <DataTable data={capTableBalance ? capTableBalance : []} primaryKey={false} columns={roleDependendtColums()}></DataTable>}
            {capTableBalance && (
                <Box fill="horizontal" direction="row" margin="small" align="center" justify="between">
                    <Text size="small" color="blue">
                        Vises som {getRoleName(role).toLocaleLowerCase()}
                    </Text>
                    <ExportExcel capTableName={props.name} data={capTableBalance} />
                </Box>
            )}
            <Box margin="small" align="center" height="small">
                {loading || (shareholdersLoading && <Spinner></Spinner>)}
            </Box>
        </Box>
    );
};

import { ethers } from "ethers";
import { useQuery } from "graphql-hooks";
import { Box, Button, DataTable, Paragraph, Spinner, Text } from "grommet";
import { Edit } from "grommet-icons";
import React, { useContext, useState } from "react";
import { toast } from "react-toastify";
import { useAsyncEffect } from "use-async-effect";
import { BalanceAndMaybePrivateData, BrokContext, getRoleName, ROLE } from "../context/BrokContext";
import { CapTableGraphQL, CapTableGraphQLTypes } from "../utils/CapTableGraphQL.utils";
import { ExportExcel } from "../utils/ExportExcel";
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
    const {
        loading,
        error,
        data: graphData,
    } = useQuery<CapTableGraphQLTypes.BalancesQuery.Response>(CapTableGraphQL.BALANCES_QUERY(props.capTableAddress));
    const [role, setRole] = useState<ROLE>("PUBLIC");
    const [editEntity, setEditShareholder] = useState<BalanceAndMaybePrivateData>();
    const [balancesAndPrivateData, setBalancesAndPrivateData] = useState<BalanceAndMaybePrivateData[]>([]);

    const { getCaptableShareholders, updateShareholder } = useContext(BrokContext);

    // useInterval(() => {
    //     refetch();
    // }, 4000);

    useAsyncEffect(
        async (isMounted) => {
            try {
                if (!graphData) return;
                const _balances = graphData.balances.map((bal) => {
                    return {
                        ...bal,
                    } as BalanceAndMaybePrivateData;
                });
                if (isMounted()) {
                    setBalancesAndPrivateData(_balances);
                }
                const response = await getCaptableShareholders(props.capTableAddress).catch((err) => {
                    toast("Kunne ikke hente ekstra informasjon om aksjeholdere");
                });
                debug("response", response);
                if (!response || response.status !== 200) return;

                const _balancesAndPrivateData = graphData.balances.map((balance) => {
                    const shareholder = response.data.shareholders.find((s) => s.address.toLowerCase() === balance.tokenHolder.address.toLowerCase());
                    if (!shareholder) {
                        debug("Could not find shareholder belonging to balance");
                        return balance as BalanceAndMaybePrivateData;
                    }
                    return {
                        ...shareholder,
                        ...balance,
                    } as BalanceAndMaybePrivateData;
                });
                // .filter((obj): obj is BalanceAndMaybePrivateData => !!obj);

                if (isMounted()) {
                    debug("Setting _balancesAndPrivateData", _balancesAndPrivateData);
                    setBalancesAndPrivateData(_balancesAndPrivateData);
                    setRole(response.data.yourRole as ROLE);
                }
            } catch (error) {
                debug("error in useAsyncEffect", error);
            }
        },
        [graphData]
    );

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
                render: (data: BalanceAndMaybePrivateData) => data.name ?? "Ukjent bruker",
            },
            {
                property: "city",
                header: <Text>By</Text>,
                render: (data: BalanceAndMaybePrivateData) => data.city ?? "-",
            },
            {
                property: "postcode",
                header: <Text>Postkode</Text>,
                render: (data: BalanceAndMaybePrivateData) => data.postcode ?? "-",
            },
            {
                property: "email",
                header: <Text>Epost</Text>,
                render: (data: BalanceAndMaybePrivateData) => data.email ?? "-",
            },
            {
                property: "birthday",
                header: <Text>Født</Text>,
                render: (data: BalanceAndMaybePrivateData) => data.birthdate ?? "-",
            },
            {
                property: "balance",
                header: <Text>Aksjer</Text>,
                render: (data: BalanceAndMaybePrivateData) => ethers.utils.formatEther(data.amount),
            },
            {
                property: "balanceByPartition",
                header: <Text>Aksjeklasser</Text>,
                render: (data: BalanceAndMaybePrivateData) => data.partition,
            },
            {
                property: "virtual",
                header: "",
                render: (data: BalanceAndMaybePrivateData) => {
                    return <Button icon={<Edit></Edit>} onClick={() => setEditShareholder(data)} />;
                },
            },
        ].filter((row) => {
            if (role !== "BOARD_DIRECTOR") {
                if (["identifier", "email", "postcode", "birthday"].includes(row.property)) {
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
                        name: editEntity.name ?? "",
                        email: editEntity.email ?? "",
                        city: editEntity.city ?? "",
                        birthdate: editEntity.birthdate ?? "",
                        postcode: editEntity.postcode ?? 0,
                    }}
                    onConfirm={updateShareholderData}
                />
            )}

            {graphData && <DataTable data={balancesAndPrivateData} primaryKey={false} columns={roleDependendtColums()}></DataTable>}
            {balancesAndPrivateData && (
                <Box fill="horizontal" direction="row" margin="small" align="center" justify="between">
                    <Text size="small" color="blue">
                        Vises som {getRoleName(role).toLocaleLowerCase()}
                    </Text>
                    <ExportExcel capTableName={props.name} data={balancesAndPrivateData} />
                </Box>
            )}
            <Box margin="small" align="center" height="small">
                {loading && <Spinner></Spinner>}
            </Box>
        </Box>
    );
};

import { ethers } from "ethers";
import { Box, Button, DataTable, Text } from "grommet";
import { Edit } from "grommet-icons";
import React, { useContext, useState } from "react";
import { useHistory } from "react-router";
import { toast } from "react-toastify";
import { BalanceAndMaybePrivateData, BrokContext, ROLE } from "../context/BrokContext";
import { useSignUpdateShareholderVP } from "../hooks/useSignUpdateShareholderVP";
import { ExportExcel } from "../utils/ExportExcel";
import { EditShareholderModal } from "./EditShareholderModal";
var debug = require("debug")("component:CapTableBalances");

interface Props {
    capTableAddress: string;
    name: string;
    boardDirectorName: string;
    balances: BalanceAndMaybePrivateData[];
    userRole: ROLE;
}
export type UpdateShareholderData = {
    name?: string | null;
    email?: string | null;
    birthdate?: string | null;
    postcode?: string | null;
    city?: string | null;
};
export const CapTableBalances: React.FC<Props> = ({ ...props }) => {
    const [editEntity, setEditShareholder] = useState<BalanceAndMaybePrivateData>();
    const history = useHistory();

    const { updateShareholder } = useContext(BrokContext);
    const { signUpdateShareholderVP } = useSignUpdateShareholderVP();

    const toHoursMonthYear = (date: string) => {
        return new Date(date).toLocaleDateString("no-NO", {
            year: "numeric",
            month: "2-digit",
            day: "2-digit",
        });
    };

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
                render: (data: BalanceAndMaybePrivateData) => (!data.birthdate ? "-" : toHoursMonthYear(data.birthdate)),
            },
            {
                property: "balance",
                header: <Text>Aksjer</Text>,
                render: (data: BalanceAndMaybePrivateData) => parseInt(ethers.utils.formatEther(data.amount)),
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
            if (props.userRole !== "BOARD_DIRECTOR") {
                if (["identifier", "email", "postcode", "birthday", "virtual"].includes(row.property)) {
                    return false;
                }
            }
            return true;
        });
    };

    const updateShareholderData = async (updateShareholderData: UpdateShareholderData) => {
        debug("updatreShareholderData", updateShareholderData);
      
        // 1. Validate input
        if (!editEntity?.id) {
            debug("!editEntity?.id is undefined");
            toast("Noe gikk galt. Prøv å gjør en refresh av siden");
            return;
        }

        // 2. Sign
        const signResult = await signUpdateShareholderVP(props.capTableAddress, editEntity.id, updateShareholderData);

        if (signResult.isErr()) {
            debug("symfonID_updateShareholderVP response error", signResult.error);
            toast("feil ved endring av data");
            return undefined;
        }
        const result = signResult.value[0];

        // 3. Update
        debug("updateShareholderData", updateShareholderData);
        await updateShareholder(result.jwt);
        history.go(0);
    };

    const ShowAsRoleRow = ({ role }: { role: ROLE }) => {
        switch (role) {
            case "BOARD_DIRECTOR":
                return <Text size="xsmall">Du ser aksjeeierboka basert på din rolle som styreleder</Text>;
            case "SHAREHOLDER":
                return <Text size="xsmall">Du ser aksjeeierboka basert på din rolle som aksjeeier</Text>;
            case "PUBLIC": {
                return (
                    <Box direction="row" align="center" gap="medium">
                        <Text size="xsmall">Du ser den offentlige versjonen av aksjeeierboka. Styreleder og aksjonærer kan se mer.</Text>
                        <Button label={"Logg inn"} size="small" secondary></Button>
                    </Box>
                );
            }
        }
    };

    return (
        <Box gap="medium">
            {editEntity && (
                <EditShareholderModal
                    onDismiss={() => setEditShareholder(undefined)}
                    updateShareholderData={{
                        name: editEntity.name,
                        email: editEntity.email,
                        city: editEntity.city,
                        birthdate: editEntity.birthdate,
                        postcode: editEntity.postcode,
                    }}
                    onConfirm={updateShareholderData}
                />
            )}

            {props.balances && <DataTable data={props.balances} primaryKey={false} columns={roleDependendtColums()}></DataTable>}
            {props.balances && (
                <Box fill="horizontal" direction="row" margin="small" align="center" justify="between">
                    <ShowAsRoleRow role={props.userRole} />
                    <ExportExcel capTableName={props.name} data={props.balances} />
                </Box>
            )}
        </Box>
    );
};

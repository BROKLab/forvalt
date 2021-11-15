import { ethers } from "ethers";
import { useQuery } from "graphql-hooks";
import { Box, Heading, Paragraph, Spinner } from "grommet";
import React, { useContext, useState } from "react";
import { useParams } from "react-router-dom";
import { toast } from "react-toastify";
import useAsyncEffect from "use-async-effect";
import { CapTableActions } from "../components/CapTableActions";
import { CapTableBalances } from "../components/CapTableBalances";
import { CapTableDetails } from "../components/CapTableDetails";
import { BalanceAndMaybePrivateData, BrokContext, ROLE, Shareholder } from "../context/BrokContext";
import { SymfoniContext } from "../context/SymfoniContext";
import { CapTableGraphQL, CapTableGraphQLTypes } from "../utils/CapTableGraphQL.utils";
var debug = require("debug")("page:CapTablePage");

interface Props {}

interface RouteParams {
    address: string;
}

export const CapTablePage: React.FC<Props> = ({ ...props }) => {
    const { address } = useParams<RouteParams>();
    const { address: currentSignerAddress } = useContext(SymfoniContext);
    const [balancesAndPrivateData, setBalancesAndPrivateData] = useState<BalanceAndMaybePrivateData[]>([]);
    const [role, setRole] = useState<ROLE>("PUBLIC");
    const [boardDirectorName, setBoardDirectorName] = useState<string>("Laster.....");

    const [loadingShareholders, setLoadingShareholders] = useState<boolean>(false);
    const [shareholderData, setShareHolderData] = useState<{ shareholders: Shareholder[]; yourRole: string }>();

    const {
        loading: loadingCapTable,
        error: errorCapTable,
        data: capTableData,
    } = useQuery<CapTableGraphQLTypes.CapTableQuery.Response>(CapTableGraphQL.CAP_TABLE_QUERY(address));

    const {
        loading: loadingBalances,
        error: errorBalances,
        data: balancesData,
    } = useQuery<CapTableGraphQLTypes.BalancesQuery.Response>(CapTableGraphQL.BALANCES_QUERY(address));

    const { getCaptableShareholders } = useContext(BrokContext);
    const isCurrentWalletController =
        !!currentSignerAddress &&
        !!capTableData &&
        capTableData.capTable &&
        capTableData.capTable.controllers.includes(currentSignerAddress.toLowerCase());

    const isError = errorBalances || errorCapTable;

    useAsyncEffect(async (isMounted) => {
        setLoadingShareholders(true);
        const response = await getCaptableShareholders(address.toLowerCase()).catch((err) => {
            toast("Kunne ikke hente ekstra informasjon om aksjeholdere");
        });
        debug("response", response);
        if (!response || response.status !== 200) {
            setLoadingShareholders(false);
            return;
        }
        if (isMounted()) {
            setShareHolderData(response.data);
            setLoadingShareholders(false);
        }
    }, []);

    useAsyncEffect(
        async (isMounted) => {
            if (!capTableData?.capTable || !balancesData?.balances || !shareholderData) return;
            const _balancesAndPrivateData = balancesData.balances.map((balance) => {
                const shareholder = shareholderData.shareholders.find((s) => s.address.toLowerCase() === balance.tokenHolder.address.toLowerCase());

                if (!shareholder) {
                    debug("Could not find shareholder belonging to balance");
                    return balance as BalanceAndMaybePrivateData;
                }
                return {
                    ...shareholder,
                    ...balance,
                } as BalanceAndMaybePrivateData;
            });

            const _boardDirector = shareholderData.shareholders.find(
                (sh) => sh.address.toLowerCase() === capTableData.capTable.boardDirector.toLowerCase()
            )?.name;

            debug("balancesAndPrivateData", _balancesAndPrivateData);
            debug("boardDirector", _boardDirector);

            if (isMounted()) {
                setBalancesAndPrivateData(_balancesAndPrivateData);
                setBoardDirectorName(_boardDirector ?? "Ukjent");
                setRole(shareholderData.yourRole as ROLE);
            }
        },
        [capTableData, balancesData, shareholderData]
    );

    const getStatusMessageForStatus = (status: string) => {
        switch (status) {
            case "APPROVED":
                return "";
            case "QUED":
                return "Advarsel: Denne aksjeeierboken er ikke godkjent av Brønnøysundregistrene. Kontakt selskapet for å få tilgang til selskapets aksjeeierbok";
            case "DECLINED":
                return "Advarsel: Denne aksjeeierboken er ikke aktiv";
            case "REMOVED":
                return "Advarsel: Denne aksjeeierboken er slettet. Kontakt selskapet for mer informasjon";
            case "UNKNOWN":
                return "Advarsel: Denne aksjeeierboken har ukjent status";
            default:
                console.warn("captable status is not defined here. Please investigate", status);
                return "";
        }
    };

    return (
        <Box>
            <Heading level={2}>Aksjeeierboken</Heading>
            {(loadingBalances || loadingCapTable || loadingShareholders) && <Spinner></Spinner>}
            {isError && <Paragraph>Noe galt skjedde</Paragraph>}
            {capTableData && capTableData.capTable && (
                <Box gap="small">
                    {capTableData.capTable.status !== "APPROVED" && (
                        <Box background="red">
                            <Paragraph>{getStatusMessageForStatus(capTableData.capTable.status)}</Paragraph>
                        </Box>
                    )}
                    <Heading level={3}>Nøkkelopplysninger</Heading>
                    <CapTableDetails
                        data={{
                            boardDirectorName: boardDirectorName ?? "Laster",
                            name: capTableData.capTable.name,
                            organizationNumber: capTableData.capTable.orgnr,
                            totalSupply: ethers.utils.formatEther(capTableData.capTable.totalSupply),
                        }}
                    />

                    {isCurrentWalletController && <CapTableActions capTableAddress={address} />}

                    {balancesAndPrivateData.length === 0 && <Heading level={4}>Fant ingen aksjeholdere</Heading>}
                    <CapTableBalances
                        capTableAddress={address}
                        name={capTableData.capTable.name}
                        boardDirectorName={boardDirectorName}
                        userRole={role}
                        balances={balancesAndPrivateData}
                    />
                </Box>
            )}
        </Box>
    );
};

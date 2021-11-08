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
import { BalanceAndMaybePrivateData, BrokContext, ROLE } from "../context/BrokContext";
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
    const [boardDirectorName, setBoardDirectorName] = useState<string>("");

    const { loading, error, data } = useQuery<CapTableGraphQLTypes.CapTableQuery.Response>(CapTableGraphQL.CAP_TABLE_QUERY(address));
    const {
        loading: loadingBalances,
        error: errorBalances,
        data: balancesData,
    } = useQuery<CapTableGraphQLTypes.BalancesQuery.Response>(CapTableGraphQL.BALANCES_QUERY(address));

    // const { loading, error, data } = useQuery<CapTableTypes.Types.CapTable>(CapTableTypes.Queries.CAP_TABLE_QUERY(address), {
    //     variables: {
    //         limit: 10
    //     }
    // })

    // useEffect(() => {
    //     const _capTable = erc1400.connect(address)
    //     setCapTable(_capTable)
    // }, [erc1400, address])
    const { getCaptableShareholders, updateShareholder } = useContext(BrokContext);
    const isCurrentWalletController =
        !!currentSignerAddress && !!data && data.capTable && data.capTable.controllers.includes(currentSignerAddress.toLowerCase());

    useAsyncEffect(
        async (isMounted) => {
            try {
                if (!balancesData || !data) return;
                const _balances = balancesData.balances.map((bal) => {
                    return {
                        ...bal,
                    } as BalanceAndMaybePrivateData;
                });
                if (isMounted()) {
                    setBalancesAndPrivateData(_balances);
                }
                debug("address", address);
                const response = await getCaptableShareholders(address.toLowerCase()).catch((err) => {
                    toast("Kunne ikke hente ekstra informasjon om aksjeholdere");
                });
                debug("response", response);
                if (!response || response.status !== 200) return;

                const _balancesAndPrivateData = balancesData.balances.map((balance) => {
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

                const _boardDirector = response.data.shareholders.find(
                    (sh) => sh.address.toLowerCase() === data?.capTable.boardDirector.toLowerCase()
                )?.name;
                debug("shareholders", response.data.shareholders);
                debug("boardDirector", _boardDirector);

                if (isMounted()) {
                    debug("Setting _balancesAndPrivateData", _balancesAndPrivateData);
                    setBalancesAndPrivateData(_balancesAndPrivateData);
                    setRole(response.data.yourRole as ROLE);
                    setBoardDirectorName(_boardDirector ?? "");
                }
            } catch (error) {
                debug("error in useAsyncEffect", error);
            }
        },
        [balancesData, data]
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
            <Heading level={3}>Aksjeeierboken</Heading>
            {loading && <Spinner></Spinner>}
            {error && <Paragraph>Noe galt skjedde</Paragraph>}
            {data && data.capTable && (
                <Box gap="small">
                    {data.capTable.status !== "APPROVED" && (
                        <Box background="red">
                            <Paragraph>{getStatusMessageForStatus(data.capTable.status)}</Paragraph>
                        </Box>
                    )}
                    <Heading level={3}>Nøkkelopplysninger</Heading>
                    <CapTableDetails
                        data={{
                            boardDirectorName: boardDirectorName,
                            name: data.capTable.name,
                            organizationNumber: data.capTable.orgnr,
                            totalSupply: ethers.utils.formatEther(data.capTable.totalSupply),
                        }}></CapTableDetails>

                    {isCurrentWalletController && <CapTableActions capTableAddress={address}></CapTableActions>}

                    {balancesAndPrivateData.length === 0 && <Heading level={4}>Fant ingen aksjeholdere</Heading>}
                    <CapTableBalances
                        capTableAddress={address}
                        name={data.capTable.name}
                        boardDirectorName={boardDirectorName}
                        userRole={role}
                        balances={balancesAndPrivateData}
                    />
                </Box>
            )}
        </Box>
    );
};

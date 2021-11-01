import { ethers } from 'ethers';
import { useQuery } from 'graphql-hooks';
import { Box, Heading, Paragraph, Spinner } from 'grommet';
import React, { useContext } from 'react';
import { useParams } from 'react-router-dom';
import { CapTableActions } from '../components/CapTableActions';
import { CapTableBalances } from '../components/CapTableBalances';
import { CapTableDetails } from '../components/CapTableDetails';
import { SymfoniContext } from '../context/SymfoniContext';
import { CapTableGraphQL, CapTableGraphQLTypes } from '../utils/CapTableGraphQL.utils';

interface Props {
}

interface RouteParams {
    address: string
}



export const CapTablePage: React.FC<Props> = ({ ...props }) => {
    const { address } = useParams<RouteParams>();
    const { address: currentSignerAddress } = useContext(SymfoniContext);

    const { loading, error, data } =
        useQuery<CapTableGraphQLTypes.CapTableQuery.Response>(CapTableGraphQL.CAP_TABLE_QUERY(address));

    // const { loading, error, data } = useQuery<CapTableTypes.Types.CapTable>(CapTableTypes.Queries.CAP_TABLE_QUERY(address), {
    //     variables: {
    //         limit: 10
    //     }
    // })


    // useEffect(() => {
    //     const _capTable = erc1400.connect(address)
    //     setCapTable(_capTable)
    // }, [erc1400, address])
    const isCurrentWalletConntroller = !!currentSignerAddress && !!data && data.capTable.controllers.includes(currentSignerAddress)



    return (
        <Box>
            {loading && <Spinner></Spinner>}
            {error && <Paragraph>Noe galt skjedde</Paragraph>}
            {data &&
                <Box gap="small">
                    <Heading level={3}>Nøkkelopplysninger</Heading>
                    <CapTableDetails data={{
                        boardDirector: data.capTable.boardDirector,
                        active: data.capTable.status === "APPROVED",
                        isCurrentWalletConntroller,
                        name: data.capTable.name,
                        organizationNuber: data.capTable.orgnr,
                        totalSupply: ethers.utils.formatEther(data.capTable.totalSupply)
                    }}></CapTableDetails>

                    <Heading level={3}>Handlinger</Heading>
                    <CapTableActions capTableAddress={address}></CapTableActions>

                    <Heading level={3}>Aksjeeierboken</Heading>
                    <CapTableBalances capTableAddress={address} name={data.capTable.name}></CapTableBalances>
                </Box>
            }

        </Box >
    )
}
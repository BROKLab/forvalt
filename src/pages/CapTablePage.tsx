import { Box, Text } from 'grommet';
import React, { useContext, useEffect, useState } from 'react';
import { Route, Switch, useParams, useRouteMatch } from 'react-router-dom';
import { Details } from '../components/CapTable/Details';
import { Loading } from '../components/ui/Loading';
import { ERC1400Context } from '../hardhat/ForvaltContext';
import { ERC1400 } from '@brok/captable-contracts';
import { useQuery } from 'graphql-hooks';
import { CapTableTypes } from '../components/CapTable/CapTable.types';

interface Props {
}

interface RouteParams {
    address: string
}
export const CapTablePage: React.FC<Props> = ({ ...props }) => {
    const { address } = useParams<RouteParams>();
    const { path } = useRouteMatch()
    const erc1400 = useContext(ERC1400Context);
    const [capTable, setCapTable] = useState<ERC1400>();
    // const { loading, error, data } = useQuery<CapTableTypes.Types.CapTable>(CapTableTypes.Queries.CAP_TABLE_QUERY(address), {
    //     variables: {
    //         limit: 10
    //     }
    // })


    useEffect(() => {
        const _capTable = erc1400.connect(address)
        setCapTable(_capTable)
    }, [erc1400, address])


    return (
        <Box>
            {!capTable &&
                <Box align="center" gap="small">
                    <Loading size={50}>
                    </Loading>
                    <Text>Laster aksjeeierboken...</Text>
                </Box>
            }
            <Switch>
                {capTable &&
                    <>
                        <Route path={`${path}`} exact={true} render={() => <Details capTable={capTable} />} />
                    </>
                }
            </Switch>
        </Box >
    )
}
import { CapTable } from '@brok/captable-contracts';
import { Box, Text } from 'grommet';
import React, { useContext, useEffect, useState } from 'react';
import { Route, Switch, useParams, useRouteMatch } from 'react-router-dom';
import { Details } from '../components/CapTable/Details';
import { Loading } from '../components/ui/Loading';
import { CapTableContext } from '../hardhat/ForvaltContext';

interface Props {
}

interface RouteParams {
    address: string
}
export const CapTablePage: React.FC<Props> = ({ ...props }) => {
    const { address } = useParams<RouteParams>();
    const { path } = useRouteMatch()
    const erc1400 = useContext(CapTableContext);
    const [capTable, setCapTable] = useState<CapTable>();
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
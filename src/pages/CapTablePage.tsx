import { Box, Text } from 'grommet';
import React, { useContext, useEffect, useState } from 'react';
import { Route, Switch, useParams, useRouteMatch } from 'react-router-dom';
import { Details } from '../components/CapTable/Details';
import { Loading } from '../components/ui/Loading';
import { ERC1400Context } from '../hardhat/ForvaltContext';
import { ERC1400 } from '../hardhat/typechain/ERC1400';

interface Props {
}

interface RouteParams {
    address: string
}
export const CapTablePage: React.FC<Props> = ({ ...props }) => {
    const { address } = useParams<RouteParams>();
    const { path } = useRouteMatch()
    const ERC1400 = useContext(ERC1400Context);
    const [capTable, setCapTable] = useState<ERC1400>();

    useEffect(() => {
        const _capTable = ERC1400.connect(address)
        setCapTable(_capTable)
    }, [address])


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
                {/* <Route path={`${path}/onboard`} exact={true} render={() => <OnBoard capTable={capTable} />} /> */}
            </Switch>
        </Box >
    )
}
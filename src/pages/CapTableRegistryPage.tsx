import { Box, Heading, Text } from 'grommet';
import React, { useContext } from 'react';
import { Route, Switch, useRouteMatch } from 'react-router-dom';
import { List } from '../components/Registry/List';
import { Loading } from '../components/ui/Loading';
import { CapTableRegistryContext } from '../hardhat/ForvaltContext';

interface Props {
}

interface RouteParams {

}
export const CapTableRegistryPage: React.FC<Props> = ({ ...props }) => {
    const { path } = useRouteMatch()
    const capTableRegistry = useContext(CapTableRegistryContext)

    return (
        <Box>
            <Heading>Aksjeeierbokregisteret</Heading>
            {!capTableRegistry &&
                <Box align="center">
                    <Loading size={50}>
                        <Text>Laster...</Text>
                    </Loading>
                </Box>
            }
            {capTableRegistry.instance &&
                <Switch>
                    <Route path={`${path}/list`} exact={true} >
                        <List capTableRegistry={capTableRegistry.instance} />
                    </Route>
                </Switch>
            }

        </Box >
    )
}
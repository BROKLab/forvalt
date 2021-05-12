import { Box, Heading, Text } from 'grommet';
import React, { useContext } from 'react';
import { Route, Switch, useRouteMatch } from 'react-router-dom';
import { List } from '../components/Que/List';
import { Loading } from '../components/ui/Loading';
import { CapTableQueContext } from '../hardhat/ForvaltContext';

interface Props {
}

interface RouteParams {
    address: string
}
export const CapTableQuePage: React.FC<Props> = ({ ...props }) => {
    const { path } = useRouteMatch()
    const capTableQue = useContext(CapTableQueContext)

    return (
        <Box>
            <Heading>Aksjeeierbok-kø</Heading>
            {!capTableQue &&
                <Box align="center">
                    <Loading size={50}>
                        <Text>Laster...</Text>
                    </Loading>
                </Box>
            }
            {capTableQue.instance &&
                <Switch>
                    <Route path={`${path}/list`} exact={true} >
                        <List capTableQue={capTableQue.instance} />
                    </Route>
                </Switch>
            }

        </Box >
    )
}
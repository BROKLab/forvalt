import { Box, Heading } from 'grommet';
import React from 'react';
import { List } from '../components/Que/List';


interface Props {
}

export const CapTableQuePage: React.FC<Props> = ({ ...props }) => {
    // const { path } = useRouteMatch()
    return (
        <Box>
            <Heading>Aksjeeierbok-kø</Heading>
            <List ></List>
        </Box >
    )
}

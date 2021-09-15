import { Box } from 'grommet';
import React from 'react';
import { UnclaimedList } from '../components/User/UnclaimedList';


interface Props {
}

export const ProfilePage: React.FC<Props> = ({ ...props }) => {


    return (
        <Box>
            <h3>Profile</h3>
            <UnclaimedList></UnclaimedList>
        </Box >
    )
}
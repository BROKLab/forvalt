import React from 'react';
import { Box, Grid, Text } from 'grommet';

interface Props {
    data: {
        name: string
        organizationNuber: string
        boardDirector: string
        active: boolean
        totalSupply: string
        isCurrentWalletConntroller: boolean
    }
}

export const CapTableDetails: React.FC<Props> = ({ data, ...props }) => {

    return (
        <Box gap="small">
            <Grid columns={["small", "flex"]}>
                <Text>Foretaksnavn</Text>
                <Text weight="bold">{data.name}</Text>
            </Grid>
            <Grid columns={["small", "flex"]}>
                <Text >Orginisasjonsnummer</Text>
                <Text weight="bold">{data.organizationNuber}</Text>
            </Grid>
            <Grid columns={["small", "flex"]}>
                <Text >Styreleder</Text>
                <Text weight="bold">{data.boardDirector}</Text>
            </Grid>
            <Grid columns={["small", "flex"]}>
                <Text >Aktivt</Text>
                <Text weight="bold">{data.active ? "Ja" : "Nei"}</Text>
            </Grid>
            <Grid columns={["small", "flex"]}>
                <Text >Antall aksjer</Text>
                <Text weight="bold">{data.totalSupply}</Text>
            </Grid>
            <Grid columns={["small", "flex"]}>
                <Text >Skrive rettigheter</Text>
                <Text weight="bold">{data.isCurrentWalletConntroller ? "Ja" : "Nei"}</Text>
            </Grid>

        </Box>
    )
}
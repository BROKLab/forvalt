import React from "react";
import { Box, Grid, Text } from "grommet";

interface Props {
    data: {
        name: string;
        organizationNumber: string;
        boardDirectorName: string;
        totalSupply: string;
    };
}

export const CapTableDetails: React.FC<Props> = ({ data, ...props }) => {
    return (
        <Box gap="small">
            <Grid columns={["small", "flex"]}>
                <Text>Foretaksnavn</Text>
                <Text weight="bold">{data.name}</Text>
            </Grid>
            <Grid columns={["small", "flex"]}>
                <Text>Organisasjonsnummer</Text>
                <Text weight="bold">{data.organizationNumber}</Text>
            </Grid>
            <Grid columns={["small", "flex"]}>
                <Text>Styreleder</Text>
                <Text weight="bold">{data.boardDirectorName}</Text>
            </Grid>

            <Grid columns={["small", "flex"]}>
                <Text>Antall aksjer</Text>
                <Text weight="bold">{parseInt(data.totalSupply)}</Text>
            </Grid>
        </Box>
    );
};

import { Box, Heading } from "grommet";
import React from "react";
var debug = require("debug")("page:me");

interface Props {}

export const MePage: React.FC<Props> = () => {
    debug("Render")

    return (
        <Box gap="small">
            <Heading level={3}>
                Mine aksjer
                <Box>

                </Box>
            </Heading>
        </Box>
    );
};

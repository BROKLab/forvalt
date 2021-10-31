import { Box, Button, Heading } from "grommet";
import React, { useContext } from "react";
import { MeBalances } from "../components/MeBalances";
import { SymfoniContext } from "../context/SymfoniContext";
var debug = require("debug")("page:me");

interface Props {}

export const MePage: React.FC<Props> = () => {
    debug("Render");
    const { address, initSigner } = useContext(SymfoniContext);

    return (
        <Box gap="small">
            <Heading level={3}>Mine aksjer</Heading>
            {address && <MeBalances address={address} />}
            {!address && <Button size="small" label="Koble til lommebok" onClick={() => initSigner()}></Button>}
        </Box>
    );
};

import { Box, Button, Heading } from "grommet";
import React, { useContext } from "react";
import { SymfoniContext } from "../context/SymfoniContext";
var debug = require("debug")("page:profile");

interface Props {}

export const ProfilPage: React.FC<Props> = () => {
    const { signer, initSigner, closeSigner } = useContext(SymfoniContext);
    const clearWalletConnect = async () => {
        debug("Closeing WC connection");
        closeSigner();
    };

    return (
        <Box gap="small">
            <Heading level={3}>Handlinger</Heading>
            <Box>
                {signer && <Button size="small" label="Koble fra lommebok" onClick={() => clearWalletConnect()}></Button>}
                {!signer && <Button size="small" label="Koble til lommebok" onClick={() => initSigner()}></Button>}
            </Box>
        </Box>
    );
};

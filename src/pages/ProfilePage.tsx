import { Box, Button, Heading } from "grommet";
import React, { useContext } from "react";
import { SymfoniContext } from "../context/SymfoniContext";
var debug = require("debug")("page:profile");

interface Props {}

export const ProfilPage: React.FC<Props> = () => {
    const { signer, initSigner } = useContext(SymfoniContext)

    const clearWalletConnect = () => {
        debug("Deleting WC connection ", localStorage.length)
        for (var i = 0, len = localStorage.length; i < len; ++i) {
            const key = localStorage.key(i)
            if (key && key.includes("wc@2")) {
                debug("deleting " + localStorage.getItem(key));
                localStorage.removeItem(key)
            }
        }
    }

    return (
        <Box gap="small">
            <Heading level={3}>
                Handlinger
                <Box>
                    {signer &&
                        <Button size="small" label="Koble fra lommebok" onClick={() => clearWalletConnect()} ></Button>
                    }
                    {!signer &&
                        <Button size="small" label="Koble til lommebok" onClick={() => initSigner()} ></Button>
                    }
                </Box>
            </Heading>
        </Box>
    );
};

import { Box, Button, Heading } from "grommet";
import React, { useContext } from "react";
import { MeBalances } from "../components/MeBalances";
import { BrokContext } from "../context/BrokContext";
import { SymfoniContext } from "../context/SymfoniContext";
import { useSignAccessVP } from "../sign/useSignAccessVP";
var debug = require("debug")("page:me");

interface Props {}

export const MePage: React.FC<Props> = () => {
    debug("Render");
    const { address } = useContext(SymfoniContext);
    const { signAccessVP } = useSignAccessVP();
    const { token, setToken } = useContext(BrokContext);
    const hasPermission = token && address;

    const login = async () => {
        const result = await signAccessVP();
        debug("login() 1", result);
        if (result.isErr()) {
            debug("login() error", result.error);
        } else {
            debug("login(), res", result.value);
            setToken(result.value[0].jwt);
        }
    };

    return (
        <Box gap="small">
            <Heading level={1}>Mine aksjer</Heading>
            {hasPermission && <MeBalances address={address} />}
            {!hasPermission && <Button onClick={login} size="small" label="Hent mine aksjer"></Button>}
        </Box>
    );
};

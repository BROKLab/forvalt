import { Box, Button, Heading } from "grommet";
import React, { useContext } from "react";
import { MeBalances } from "../components/MeBalances";
import { SymfoniContext } from "../context/SymfoniContext";
import { useLocalStorage } from "../utils/useLocalstorage";
var debug = require("debug")("page:me");

interface Props {}

export const MePage: React.FC<Props> = () => {
    debug("Render");
    const { address } = useContext(SymfoniContext);
    const [token] = useLocalStorage<string>("permissionBrokToken", "");
    const hasPermission = token && address

    return (
        <Box gap="small">
            <Heading level={1}>Mine aksjer</Heading>
            {hasPermission &&  <MeBalances address={address} />}
            {!hasPermission && <Button href="#request-access-shares-vp" size="small" label="Be om legitimasjon"></Button>}
        </Box>
    );
};

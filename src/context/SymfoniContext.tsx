import { Box, Spinner, Text } from "grommet";
import React from "react";
import { useLocation } from "react-router";
import { SignatureRequestModal } from "../components/SignatureRequestModal";
import { WalletConnectQr } from "../components/WalletConnectQr";
import { useSymfoni } from "./useSymfoni";
// var debug = require("debug")("provider:SymfoniProvider");

export type SymfoniContextInterface = ReturnType<typeof useSymfoni>
export const SymfoniContext = React.createContext<SymfoniContextInterface>(undefined!);


export const SymfoniProvider = ({ ...props }) => {
    const symfoni = useSymfoni()
    const location = useLocation();

    const context = {
        ...symfoni
    }

    const Loading = () => (
        <Box align="center" margin={{ vertical: "large" }} >
            <Spinner></Spinner>
            <Text>Laster</Text>
        </Box>
    )
    return (
        <SymfoniContext.Provider value={context}>
            {symfoni.loading
                ? <Loading></Loading>
                : props.children
            }
            {symfoni.walletConnectURI &&
                <WalletConnectQr walletConnectURI={symfoni.walletConnectURI} handleClose={() => symfoni.setWalletConnectURI(undefined)}></WalletConnectQr>
            }
            {/** @TODO Remove this !== check, when finished migrating to new modal-system */}
            {location.hash !== "#request-access-shares-vp" && <SignatureRequestModal></SignatureRequestModal>}
        </SymfoniContext.Provider>
    );
};

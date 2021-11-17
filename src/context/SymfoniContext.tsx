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
            {/** @TODO Remove !location.pathname.includes("/me"), when finished migrating to new request permission system */}
            {!location.pathname.includes("/me") && symfoni.walletConnectURI &&
                <WalletConnectQr walletConnectURI={symfoni.walletConnectURI} handleClose={() => symfoni.setWalletConnectURI(undefined)}></WalletConnectQr>
            }
            {/** @TODO Remove !location.pathname.includes("/me"), when finished migrating to new request permission system */}
            {!location.pathname.includes("/me") && <SignatureRequestModal></SignatureRequestModal>}
        </SymfoniContext.Provider>
    );
};

import React, {  useContext } from "react";
import { Box, Button, Spinner, Text } from "grommet";
import { Copy } from "grommet-icons";
import QRCode from "qrcode.react";
import copy from "clipboard-copy";

// Local
import { SymfoniContext } from "../context/SymfoniContext";
import useAsyncEffect from "use-async-effect";
import { Signer } from "../context/useSymfoni";
import { useLocalStorage } from "../utils/useLocalstorage";
var debug = require("debug")("AccessPermissionRequest");


interface AccessPermissionRequestProps {
    onResolve: () => void; 
    onReject: () => void;
}

/** AccessPermissionRequest - Requests an AccessVP from SymfoniID */
export function AccessPermissionRequest({ onResolve, onReject  }: AccessPermissionRequestProps) {
    const [, setToken] = useLocalStorage<string>("permissionBrokToken", "");
    const { signer, initSigner, walletConnectURI: uri } = useContext(SymfoniContext);
    
    const connected = !!signer;
    
    /** Async effect - initSigner to get the uri for the QR code */
    useAsyncEffect(() => initSigner(), [])

    /** Async effect - If connected with the wallet, request permission, then redirect back */
    useAsyncEffect(async (isMounted) => {
        if (!connected) {
            return;
        }
        // Connected!
        const permission = await requestAccessPermission(signer);
        if (!isMounted()){
            return;
        }
        if (!permission) {
            onReject();
            return;
        }

        // Got permission from wallet!
        setToken(permission);
        onResolve();
    }, [connected, onReject])


    /** No URI and not connected? - Show spinner */
    if (!uri && !connected) {
        return  <Box gap="medium" margin="medium"><Spinner /></Box>
    }

    /** Has URI but Not connected? - Show QR code */
    if (uri && !connected) {
        return (
            <Box gap="medium" margin="medium">
                {/* TODO : Fix this, not safe */}
                <Text textAlign="center" truncate>Koble til med Symfoni ID</Text>

                {/* TODO VERY NOT SAFE, just for testing */}
                <Box align="center">
                    <QRCode size={200} value={`${uri}`}></QRCode>
                </Box>
                <Box align="center" >
                    <Button
                        size="small"
                        icon={<Copy></Copy>}
                        label="Copy"
                        onClick={() => copy(uri)}></Button>
                </Box>
                <Button size="small" label="close" onClick={() => onReject()} />
            </Box>
        );
    }

    /** Is connected - Requesting permission...  */
    return (
        <Box gap="medium" margin="medium">
            <Text>Venter på tillatelse fra Symfoni ID...</Text>
            <Spinner alignSelf="center"/>
            <Button size="small" label="Close" onClick={() => onReject()} />
        </Box>
    );
}


/** Fetch token - Send Verifiable Presentation request to wallet. Expect a VP.jwt to be returned. */
async function requestAccessPermission(signer: Signer) : Promise<string|null> {
    if (!("request" in signer)) {
        debug(`requestAccessPermission(): !("request" in signer")`);
        return null;
    }

    const url = process.env.REACT_APP_USE_LOCAL_ENVIROMENT === "true" ? "http://localhost:3004" : process.env.REACT_APP_BROK_HELPERS_URL;
    debug("requestAccessPermission(): fetching from: ", url);

    let results;
    try {
        results = await signer.request("symfoniID_accessVP", [
            {
                verifier: process.env.BROK_HELPERS_VERIFIER,
                access: {
                    delegatedTo: {
                        id: process.env.REACT_APP_PUBLIC_URL,
                    },
                    scopes: [
                        {
                            id: `${url}/captable/:captableAddress/shareholder/list`,
                            name: "All shareholders for all captables",
                        },
                        {
                            id: `${url}/captable/:captableAddress/shareholder/:shareholderId`,
                            name: "One shareholder for all captables",
                        },
                        {
                            id: `${url}/unclaimed/list`,
                            name: "All unclaimed tokens for your identifier ",
                        },
                    ],
                },
            },
        ]) as unknown;
    } catch (e) {
        debug("requestAccessPermission(): await signatureRequestHandler.results() exception:", e);
        return null;
    }

    debug("requestAccessPermission(): Acceess VP results", results);
    let userTokenJwt = (results as { jwt: string }).jwt;
    if (!userTokenJwt) {
        debug("requestAccessPermission(): !userTokenJwt");
        return null;
    }
    
    debug("requestAccessPermission(): Access VC fra Wallet", userTokenJwt);
    return userTokenJwt;
};

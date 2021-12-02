import copy from "clipboard-copy";
import { Box, Button, Image, Layer, Spinner, Text } from "grommet";
import { Copy } from "grommet-icons";
import QRCode from "qrcode.react";
import React, { useCallback, useContext, useState } from "react";
import useAsyncEffect from "use-async-effect";
import SIGNATURE_SCREEN from "../assets/images/signatur_skjerm.png";
import BRREG_LOGO_SVG from "../assets/images/brreg_logo.png";
import { SymfoniContext } from "../context/SymfoniContext";
import { ErrorResponse, SignatureRequest } from "../utils/SignerRequestHandler";

var debug = require("debug")("utils:SignatureRequestModal");

interface Props {}

export const SignatureRequestModal: React.FC<Props> = ({ ...props }) => {
    const { signer, initSigner, walletConnectURI, setWalletConnectURI, signatureRequestHandler } = useContext(SymfoniContext);
    const [requestProcess, setProcess] = useState<number>(0);
    const [requests, setRequests] = useState<SignatureRequest[]>([]);
    const [error, setError] = useState<ErrorResponse>();

    /** Async effect - Handle all incoming signer requests */
    useAsyncEffect(async () => {
        // Must have a signer before you can do signer requests
        if (requests.length === 0) return;
        if (!signer) return await initSigner();

        let result = [];
        for (let i = 0; i < requests.length; i++) {
            setProcess(i);
            try {
                const res = await requests[i].fn(signer);
                debug("res => ", res);
                result.push(res);
            } catch (e: any) {
                debug("error in process doAsync functions. error:", (e as ErrorResponse).message);
                signatureRequestHandler.reject(e);
                setError(e);
                return;
            }
        }
        signatureRequestHandler.done(result);
    }, [signer, requests, signatureRequestHandler]);

    /** Callback - If the user rejects by clicking outside the modal, x or close button */
    const onReject = useCallback(() => {
        setWalletConnectURI(undefined);
        signatureRequestHandler.reject(error);
    }, [setWalletConnectURI, signatureRequestHandler, error]);

    /** Async effect - Configure the signature request handler */
    useAsyncEffect(() => {
        const handleRequests = (event: Array<Array<SignatureRequest>>) => {
            debug("handleRequest", event[0]);
            setRequests(event[0]);
        };
        const handleClear = (event: Array<SignatureRequest>) => {
            setRequests(event);
        };

        debug("update on signatureRequestHandler.requests", requests);
        signatureRequestHandler.on("onRequests", handleRequests);
        signatureRequestHandler.on("onClear", handleClear);

        return () => {
            signatureRequestHandler.removeListener("onRequests", handleRequests);
            signatureRequestHandler.removeListener("onClear", handleClear);
        };
    }, [requests, signatureRequestHandler]);

    /** No URI and not connected? - Show spinner */
    if (requests.length > 0 && !walletConnectURI && !signer) {
        return (
            <Layer onEsc={onReject} onClickOutside={onReject}>
                <Box gap="medium" margin="medium">
                    <Spinner />
                </Box>
            </Layer>
        );
    }

    /** Has URI but Not connected? - Show QR code */
    if (walletConnectURI && !signer) {
        return (
            <Layer onEsc={onReject} onClickOutside={onReject}>
                <Box gap="medium" margin="medium">
                    {/* TODO : Fix this, not safe */}
                    <Text textAlign="center" truncate>
                        Koble til med Symfoni ID
                    </Text>

                    {/* TODO VERY NOT SAFE, just for testing */}
                    <Box align="center">
                        <QRCode size={200} value={`${walletConnectURI}`}></QRCode>
                    </Box>
                    <Box align="center">
                        <Button size="small" icon={<Copy></Copy>} label="Copy" onClick={() => copy(walletConnectURI)}></Button>
                    </Box>
                    <Button size="small" label="close" onClick={onReject} />
                </Box>
            </Layer>
        );
    }

    /** A signing-request error? */
    if (error) {
        return (
            <Layer onEsc={onReject} onClickOutside={onReject}>
                <Box gap="medium" margin="medium">
                    {/* TODO : Fix this, not safe */}
                    <Text textAlign="center" truncate>
                        Noe galt skjedde
                    </Text>

                    <Text>{error.message}</Text>
                </Box>
            </Layer>
        );
    }

    /** Is connected and have requests! */
    return (
        <Box>
            {requests.length > 0 && (
                <Layer id="hei" modal={true} full={true} margin="100%" onEsc={onReject} onClickOutside={onReject}>
                    <Box
                        width="80%"
                        height="100%"
                        gap="medium"
                        margin="medium"
                        align="center"
                        justify="center"
                        alignSelf="center"
                        alignContent="center">
                        <Image src={BRREG_LOGO_SVG} height="40px" />
                        <Text size="1.5em" margin={{ top: "30px" }} weight="bold">
                            Signer i Symfoni ID
                        </Text>
                        {requests.length > 1 && <Text>{`Signatur ${requestProcess + 1} av ${requests.length}`}</Text>}
                        {requests[requestProcess]?.message && (
                            <Text color="gray" size="1em">
                                {requests[requestProcess].message}
                            </Text>
                        )}
                        <Image src={SIGNATURE_SCREEN} margin="small" height="40%"></Image>
                        <Button margin={{ top: "50px" }} size="small" label="Avbryt" onClick={onReject} />
                    </Box>
                </Layer>
            )}
        </Box>
    );
};

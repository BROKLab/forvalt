import { Box, Button, Text } from "grommet";
import React, { useContext, useEffect, useState } from "react";
import { SymfoniContext } from "../hardhat/ForvaltContext";
import { ErrorResponse, SignatureRequest } from "../utils/SignerRequestHandler";
import { Modal } from "./ui/Modal";

interface Props {}

export const SignatureRequestModal: React.FC<Props> = ({ ...props }) => {
    const { signatureRequestHandler } = useContext(SymfoniContext);
    const [process, setProcess] = useState<number>(0);
    const [requests, setRequests] = useState<SignatureRequest[]>([]);
    const [error, setError] = useState<ErrorResponse>();

    const handleRequests = (event: Array<Array<SignatureRequest>>) => {
        setRequests(event[0]);
    };

    const handleClear = (event: Array<SignatureRequest>) => {
        setRequests(event);
    };

    useEffect(() => {
        if (requests.length === 0) return;
        const doAsync = async () => {
            let result = [];
            for (let i = 0; i < requests.length; i++) {
                setProcess(i);
                try {
                    const res = await requests[i].fn();
                    result.push(res);
                } catch (e: any) {
                    console.log("error in process doAsync functions. error:", (e as ErrorResponse).message);
                    setError(e);
                    return;
                }
            }
            signatureRequestHandler.done(result);
        };
        doAsync();
    }, [requests, signatureRequestHandler]);

    const dismissError = () => {
        // TODO:
        signatureRequestHandler.reject(error);
        setError(undefined);
    };

    const clearRequest = () => {
        signatureRequestHandler.reject();
    };

    useEffect(() => {
        let subscribed = true;
        const doAsync = async () => {
            console.log("update on signatureRequestHandler.requests", requests);
            signatureRequestHandler.on("onRequests", handleRequests);
            signatureRequestHandler.on("onClear", handleClear);
        };
        doAsync();
        return () => {
            subscribed = false;
            signatureRequestHandler.removeListener("onRequests", handleRequests);
            signatureRequestHandler.removeListener("onClear", handleClear);
        };
    }, [signatureRequestHandler]);
    if (error) {
        return (
            <Box>
                <Modal show={true} setShow={() => dismissError()}>
                    <Text>Noe skjedde:</Text>
                    <Text>{error.message}</Text>
                </Modal>
            </Box>
        );
    } else {
        return (
            <Box>
                {requests.length > 0 && (
                    <Modal show={true} setShow={() => clearRequest()}>
                        <Text>{`Signatur ${process + 1} av ${requests.length}`}</Text>
                        <Text>{requests[process].message}</Text>
                    </Modal>
                )}
            </Box>
        );
    }
};
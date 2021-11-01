import { AxiosError } from 'axios';
import { ethers } from 'ethers';
import { Box, Text } from 'grommet';
import React, { useContext } from 'react';
import { toast } from 'react-toastify';
import { BrokContext } from '../context/BrokContext';
import { SymfoniContext } from '../context/SymfoniContext';
import { SignatureRequest } from '../utils/SignerRequestHandler';
import { PrivateTokenTransferData, PrivateTokenTransferForm } from './PrivateTokenTransferForm';
var debug = require("debug")("component:CapTableTransfer");


interface Props {
    capTableAddress: string;
    done?: () => void;
}

export const CapTableTransfer: React.FC<Props> = ({ ...props }) => {
    const { signatureRequestHandler, CapTableRegistry, signer, initSigner } = useContext(SymfoniContext)
    const { createUnclaimed } = useContext(BrokContext)

    const requireSigner = (!signer || !("request" in signer));

    const resolvePrivateTokenTransfer = async (privateUserData: PrivateTokenTransferData) => {
        if (requireSigner) {
            initSigner()
            return undefined
        }
        if (!CapTableRegistry.instance) {
            toast("Kunne ikke koble til Blokkkjeden")
            return undefined
        }
        const capTableRegistry = CapTableRegistry.instance

        const BROK_HELPERS_VERIFIER = process.env.REACT_APP_BROK_HELPERS_VERIFIER;
        let orgnr: string | undefined = undefined;
        try {
            const orgnrBytes32 = await capTableRegistry.getid(props.capTableAddress);
            orgnr = ethers.utils.parseBytes32String(orgnrBytes32);
        } catch (error: any) {
            toast("Could not resolve orgnr");
            if ("message" in error) {
                debug(error.message, error)
                toast(error.message)
            }
            return undefined
        }

        const request: SignatureRequest = {
            message: "Godkjenn private aksjeoverførelse via Brønnøysundregistrene",
            fn: async () =>
                await signer.request("symfoniID_capTablePrivateTokenTransferVP", [
                    {
                        verifier: BROK_HELPERS_VERIFIER,
                        toShareholder: {
                            name: privateUserData.name,
                            streetAddress: privateUserData.streetAddress,
                            postalcode: privateUserData.postalcode,
                            email: privateUserData.email,
                            identifier: privateUserData.identifier,
                            orgnr: orgnr,
                            amount: privateUserData.amount,
                            partition: privateUserData.partition,
                            capTableAddress: props.capTableAddress
                        },
                    },
                ]),
        };
        debug("symfonID_capTablePrivateTransferTokenVP request")
        signatureRequestHandler.add([request]);
        let result;
        try {
            const results = (await signatureRequestHandler.results()) as { capTablePrivateTransferTokenVP: string }[]
            result = results[0];
        } catch (error: any) {
            debug("symfonID_capTablePrivateTransferTokenVP response error", error)
            toast("Feil ved signering av private overføring.")
            return undefined
        }

        const res = await createUnclaimed(result.capTablePrivateTransferTokenVP).catch((error: AxiosError<{ message: string; code: number }>) => {
            if (error.response && error.response.data.message) {
                throw Error(error.response.data.message);
            }
            debug("createUnclaimed response error", error)
            return undefined
        });
        debug("symfonID_capTablePrivateTransferTokenVP response", res)
        if (!res || !res.data.tokensUnclaimed) {
            toast("Feil ved opprettelse av private overføring.")
            return undefined
        }
        const unclaimed = res.data.tokensUnclaimed.find(r => ethers.utils.isAddress(r.address));
        return unclaimed?.address
    };


    const transfer = async (privateTokenTransferData: PrivateTokenTransferData) => {
        if (requireSigner) {
            return initSigner()
        }
        debug(`transfer ${privateTokenTransferData.name} isAddress ${ethers.utils.isAddress(privateTokenTransferData.address)}`)
        const address = ethers.utils.isAddress(privateTokenTransferData.address) ? privateTokenTransferData.address : await resolvePrivateTokenTransfer(privateTokenTransferData);
        debug(`transfer address: ${address}`)

        if (props.done) {
            return props.done();
        }
        return;

        // TODO - Not handling self transfers yet

        // if (!address) {
        //     if (props.done) {
        //         return props.done();
        //     }
        //     return;
        // }
        // const amountEther = ethers.utils.parseEther(privateTokenTransferData.amount.toString());
        // if (amountEther === ethers.constants.Zero) return alert("Kan ikke overføre 0 beløp");

        // if (!CapTable.factory) {
        //     return toast("Kunne ikke koble til Blokkkjeden")
        // }
        // const capTable = CapTable.factory.attach(props.capTableAddress)

        // const request: SignatureRequest = {
        //     message: `Overfør aksjer til ${privateTokenTransferData.name}`,
        //     fn: async () => {
        //         const tx = await capTable.transferByPartition(privateTokenTransferData.partition, address, amountEther, "0x11");
        //         await tx.wait();
        //     },
        // };

        // signatureRequestHandler.add([request]);
        // await signatureRequestHandler.results();
        // if (props.done) {
        //     props.done();
        // }

        // if (props.done) props.done();
    };


    return (
        <Box gap="small">
            <Text>Overfør aksjer til: </Text>
            <PrivateTokenTransferForm onSubmit={transfer} submitLabel={requireSigner ? "Koble til lommebok" : "Overfør"}  selectPartiton={false} ></PrivateTokenTransferForm>
        </Box>
    )
}
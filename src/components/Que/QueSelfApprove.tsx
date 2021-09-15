import { Box, Button, Text } from 'grommet';
import React, { useContext } from 'react';
import { SymfoniContext } from '../../hardhat/ForvaltContext';
import { normalizePresentation } from "did-jwt-vc";
import axios from 'axios';
import { captableApprove } from '../../domain/BrokHelpers';

interface Props {
    orgnr: string,
    capTableAddress: string,
    done?: () => void
}

export const QueSelfApprove: React.FC<Props> = ({ ...props }) => {
    const { init, signer, } = useContext(SymfoniContext)


    const handleSelfApproval = async () => {
        if (!signer) {
            return init({ forceSigner: true })
        }
        const BROK_HELPERS_VERIFIER = process.env.REACT_APP_BROK_HELPERS_VERIFIER
        const BROK_HELPERS_URL = process.env.REACT_APP_BROK_HELPERS_URL
        if ("request" in signer) {
            const jwt = await signer.request("did_requestVerifiableCredential", [{
                type: "CapTableBoardDirector",
                orgnr: props.orgnr,
                verifier: BROK_HELPERS_VERIFIER

            }])
            console.log("test", normalizePresentation(jwt))
            // TODO - Make this strcutured and pretty
            const res = await captableApprove(jwt, props.capTableAddress);
            console.log("captableApprove", res)
            // const vp = await

            if (props.done) {
                props.done()
            }
        }

    }

    return (
        <Box>
            <Text>Du kan godkjenne selskapet selv ved å bekrefte identitet til Brreg</Text>
            <Button label="Start godkjenning" size="small" onClick={() => handleSelfApproval()}></Button>
        </Box>
    )
}
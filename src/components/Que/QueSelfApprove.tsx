import { Box, Button, Text } from 'grommet';
import React, { useContext } from 'react';
import { SymfoniContext } from '../../hardhat/ForvaltContext';

interface Props {
    capTableAddress: string,
    done?: () => void
}

export const QueSelfApprove: React.FC<Props> = ({ ...props }) => {
    const { init, signer } = useContext(SymfoniContext)


    const handleSelfApproval = async () => {
        if (!signer) {
            return init({ forceSigner: true })
        }
        if ("request" in signer) {
            await signer.request("oracle_data", [{
                method: "approve_captable",
                capTableAddress: props.capTableAddress
            }])
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
import React, { useState } from 'react';
import { Box, Button } from 'grommet';
import { Modal } from './Modal';
import { CapTableTransfer } from './CapTableTransfer';

interface Props {
    capTableAddress: string
}

export const CapTableActions: React.FC<Props> = ({ ...props }) => {
    const [showTransfers, setShowTransfers] = useState(false);

    return (
        <Box>
            <Box gap="small" direction="row">
                <Button size="small" label={"Overføre"} onClick={() => setShowTransfers(!showTransfers)}></Button>
            </Box>
            <Modal show={showTransfers} setShow={setShowTransfers}>
                <CapTableTransfer
                    capTableAddress={props.capTableAddress}
                    done={() => {
                        setShowTransfers(false);
                    }}
                    
                    ></CapTableTransfer>
            </Modal>
        </Box>
    )
}
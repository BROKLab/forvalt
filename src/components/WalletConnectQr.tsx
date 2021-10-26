import copy from "clipboard-copy";
import { Box, Button, Layer, Text } from 'grommet';
import { Copy } from "grommet-icons";
import QRCode from "qrcode.react";
import React from 'react';

interface Props {
    walletConnectURI: string,
    handleClose: () => void
}

export const WalletConnectQr: React.FC<Props> = ({ ...props }) => {

    return (
        <Box pad="small">
            <Layer
                onEsc={() => props.handleClose()}
                onClickOutside={() => props.handleClose()}
            >
                <Box gap="medium" margin="medium">
                    {/* TODO : Fix this, not safe */}
                    <Text textAlign="center" truncate>Koble til med en Symfoni ID app</Text>
                    {/* TODO VERY NOT SAFE, just for testing */}
                    <Box align="center">
                        <QRCode size={200} value={`${props.walletConnectURI}`}></QRCode>
                    </Box>
                    <Box align="center" >
                        <Button
                            size="small"
                            icon={<Copy></Copy>}
                            label="Copy"
                            onClick={() => copy(props.walletConnectURI)}></Button>
                    </Box>

                    <Button size="small" label="close" onClick={() => props.handleClose()} />
                </Box>
            </Layer>
        </Box >

    )
}
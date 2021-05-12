import { Box, Button, Layer } from 'grommet';
import React from 'react';

interface Props {
    show: boolean,
    setShow: (show: boolean) => void
}

export const Modal: React.FC<Props> = ({ ...props }) => {
    if (!props.show) return null
    return (
        <Layer
            onEsc={() => props.setShow(false)}
            onClickOutside={() => props.setShow(false)}
            animation="slide"
            modal
            position="center"
        >
            <Box margin="medium" align="center" gap="small">
                {props.children}
                <Box>
                    <Button size="small" label="Lukk" onClick={() => props.setShow(false)} />
                </Box>
            </Box>
        </Layer>

    )
}
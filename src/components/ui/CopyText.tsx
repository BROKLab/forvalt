import React, { useState } from 'react';
import { Box, Text } from 'grommet';
import copy from "clipboard-copy";
import { Copy as CopyIcon } from 'grommet-icons';
interface Props {
    text: string
}

export const CopyText: React.FC<Props> = ({ ...props }) => {
    const [color, setColor] = useState("brand");
    const handleCopy = () => {
        copy(props.text)
        setColor("green")
    }
    return (
        <Box direction="row" align="center">
            <Text truncate about={props.text}>{props.text}</Text>
            <CopyIcon color={color} style={{ marginLeft: "5px", cursor: "pointer" }} size="15px" onClick={() => handleCopy()}></CopyIcon>
        </Box>
    )

}
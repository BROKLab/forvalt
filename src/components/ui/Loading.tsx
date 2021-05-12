import React from 'react';
import { SpinnerDiamond } from 'spinners-react';

interface Props {
    size?: number
    color?: string
}

export const Loading: React.FC<Props> = ({ size = 30, color = "brand", ...props }) => {

    return (
        <SpinnerDiamond color={color} size={size}>
            {props.children}
        </SpinnerDiamond>
    )
}
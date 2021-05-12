import { Box, Heading } from 'grommet';
import React, { useContext } from 'react';
import { SymfoniContext } from '../../hardhat/ForvaltContext';
import { ERC1400 } from '../../hardhat/typechain/ERC1400';
import { Actions } from './Actions';
import { Balances } from './Balances';
import { Info } from './Info';


interface Props {
    capTable: ERC1400
}

export const Details: React.FC<Props> = ({ ...props }) => {
    const { signer } = useContext(SymfoniContext)
    return (
        <Box>
            <Heading level={3}>Nøkkelopplysninger</Heading>
            <Info capTable={props.capTable}></Info>
            {signer &&
                <>
                    <Heading level={3}>Handlinger</Heading>
                    <Actions capTable={props.capTable}></Actions>
                </>
            }
            <Heading level={3}>Aksjeliste</Heading>
            <Balances capTable={props.capTable}></Balances>
        </Box>
    )
}
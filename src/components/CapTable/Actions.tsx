import React, { useContext, useState } from 'react';
import { Box, Button } from 'grommet';
import { ERC1400 } from '../../hardhat/typechain/ERC1400';
import { Modal } from '../ui/Modal';
import { Transfer } from './Transfer';
import { SymfoniContext } from '../../hardhat/ForvaltContext';
import { BatchIssue } from './BatchIssue';
import { Extensions } from './Extensions';

interface Props {
    capTable: ERC1400
}

export const Actions: React.FC<Props> = ({ ...props }) => {
    const { init } = useContext(SymfoniContext)
    const [showTransfers, setShowTransfers] = useState(false);
    const [showIssue, setShowIssue] = useState(false);
    const [showExtensions, setShowExtensions] = useState(false);

    return (
        <Box gap="small" direction="row">
            <Button size="small" label={"Overføre"} onClick={() => setShowTransfers(!showTransfers)}></Button>
            <Button size="small" label={"Utestede"} onClick={() => setShowIssue(!showTransfers)}></Button>
            <Button size="small" label={"Utvidelser"} onClick={() => setShowExtensions(!showExtensions)}></Button>
            <Modal show={showTransfers} setShow={setShowTransfers}>
                <Transfer capTable={props.capTable} done={() => {
                    setShowTransfers(false)
                    init()
                }}></Transfer>
            </Modal>
            <Modal show={showIssue} setShow={setShowIssue}>
                <BatchIssue capTable={props.capTable} done={() => {
                    setShowTransfers(false)
                    init()
                }}></BatchIssue>
            </Modal>
            <Modal show={showExtensions} setShow={setShowExtensions}>
                <Extensions capTable={props.capTable} done={() => {
                    setShowTransfers(false)
                    init()
                }}></Extensions>
            </Modal>
        </Box>

    )
}
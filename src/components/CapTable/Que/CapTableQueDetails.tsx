import { ethers } from 'ethers';
import { Box, Button, Grid, Heading, Text } from 'grommet';
import React, { useEffect, useState } from 'react';
import { CapTableQue } from '../../../hardhat/typechain/CapTableQue';
import { getStatus } from '../../../utils/que-helpers';
import { QueAdmin } from '../../Que/QueAdmin';
import { QueSelfApprove } from '../../Que/QueSelfApprove';
import { Modal } from '../../ui/Modal';

interface Props {
    capTableQue: CapTableQue,
    capTableAddress: string,
}

interface QueInfo {
    uuid: string,
    status: number
}


export const CapTableQueDetails: React.FC<Props> = ({ ...props }) => {
    const [info, setInfo] = useState<QueInfo>();
    const [showQueAdmin, setShowQueAdmin] = useState(false);
    const [showQueSelfApprove, setShowQueSelfApprove] = useState(false);

    useEffect(() => {
        let subscribed = true
        const doAsync = async () => {
            const { status, uuid } = await props.capTableQue.info(props.capTableAddress)
            if (subscribed) {
                setInfo({
                    uuid: uuid !== ethers.constants.HashZero ? ethers.utils.parseBytes32String(uuid) : "Inget OrgNr.",
                    status: status.toNumber()
                })
            }
        };
        doAsync();
        return () => { subscribed = false }
    }, [props.capTableQue, props.capTableAddress])


    return (
        <Box>
            <Heading level={3}>Kø detaljer</Heading>
            <Box gap="small">
                {info &&
                    <Grid columns={["small", "flex"]}>
                        <Text>Orginisasjonsnummer</Text>
                        <Text weight="bold">{info.uuid}</Text>
                    </Grid>
                }
                {info &&
                    <Grid responsive={true} columns={["small", "flex"]}>
                        <Text>Status</Text>
                        <Text weight="bold">{getStatus(info.status)}</Text>

                    </Grid>
                }
                {info &&
                    <Grid responsive={true} columns={["small", "small", "small"]} gap="small">
                        <Text></Text>
                        <Button label="Kø admin" size="small" onClick={() => setShowQueAdmin(!showQueAdmin)}></Button>
                        <Button label="Fremskynd godkjenning" size="small" onClick={() => setShowQueSelfApprove(!showQueSelfApprove)}></Button>
                    </Grid>
                }
            </Box>
            <Modal show={showQueAdmin} setShow={setShowQueAdmin} >
                <QueAdmin capTableQue={props.capTableQue} capTableAddress={props.capTableAddress}></QueAdmin>
            </Modal>
            <Modal show={showQueSelfApprove} setShow={setShowQueSelfApprove} >
                <QueSelfApprove capTableQue={props.capTableQue} capTableAddress={props.capTableAddress}></QueSelfApprove>
            </Modal>
        </Box>
    )
}
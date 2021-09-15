import { ethers } from 'ethers';
import { Box, Button, Grid, Heading, Text } from 'grommet';
import React, { useEffect, useState } from 'react';
import { Modal } from './../ui/Modal';
import { CapTableRegistry } from '@brok/captable-contracts';
import { getStatus } from '../../utils/que-helpers';
import { QueAdmin } from './QueAdmin';
import { QueSelfApprove } from './QueSelfApprove';

interface Props {
    capTableRegistry: CapTableRegistry,
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
            const status = await props.capTableRegistry.getStatus(props.capTableAddress)
            const uuid = await props.capTableRegistry.getid(props.capTableAddress)
            if (subscribed) {
                setInfo({
                    uuid: uuid !== ethers.constants.HashZero ? ethers.utils.parseBytes32String(uuid) : "Inget OrgNr.",
                    status: status.toNumber()
                })
            }
        };
        doAsync();
        return () => { subscribed = false }
    }, [props.capTableAddress, props.capTableRegistry])


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
                <QueAdmin capTableRegistry={props.capTableRegistry} capTableAddress={props.capTableAddress}></QueAdmin>
            </Modal>
            <Modal show={showQueSelfApprove} setShow={setShowQueSelfApprove} >
                {info &&
                    <QueSelfApprove done={() => setShowQueSelfApprove(!showQueSelfApprove)} orgnr={info.uuid} capTableAddress={props.capTableAddress}></QueSelfApprove>
                }
            </Modal>
        </Box>
    )
}
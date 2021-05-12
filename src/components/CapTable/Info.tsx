import { ethers } from 'ethers';
import { Box, Grid, Text } from 'grommet';
import React, { useContext, useEffect, useState } from 'react';
import { CapTableQueContext, CapTableRegistryContext, SymfoniContext } from '../../hardhat/ForvaltContext';
import { ERC1400 } from '../../hardhat/typechain/ERC1400';
import { CapTableQueDetails } from './Que/CapTableQueDetails';

interface Props {
    capTable: ERC1400
}

interface CapTableData {
    name: string
    totalSupply: string,
    isController: boolean
}
interface CapTableRegistryData {
    uuid: string
    active: boolean
}


export const Info: React.FC<Props> = ({ capTable, ...pops }) => {
    const [data, setData] = useState<CapTableData>();
    const [registryData, setRegistryData] = useState<CapTableRegistryData>();
    const capTableRegistry = useContext(CapTableRegistryContext)
    const capTableQue = useContext(CapTableQueContext)
    const { address: currentAddress } = useContext(SymfoniContext)


    useEffect(() => {
        let subscribed = true
        const doAsync = async () => {
            const name = await capTable.name().catch(() => "No company found");
            const totalSupplyBN = await capTable
                .totalSupply()
                .catch(() => ethers.constants.Zero);
            const totalSupply = ethers.utils.formatEther(totalSupplyBN);
            const isController = await (await capTable.controllers()).findIndex(address => address === currentAddress) !== -1
            if (subscribed) {
                setData({ name, totalSupply, isController });
            }
            if (capTableRegistry.instance) {
                const { uuid, active } = await capTableRegistry.instance.info(capTable.address)
                if (subscribed) {
                    setRegistryData({
                        uuid: uuid === ethers.constants.HashZero ? ethers.utils.formatBytes32String("Ikke opprettet") : uuid,
                        active: active
                    })
                }
            }
        };
        doAsync();
        return () => { subscribed = false }
    }, [capTable, capTableRegistry.instance, currentAddress])

    return (
        <Box gap="small">
            {data &&
                <Grid columns={["small", "flex"]}>
                    <Text>Foretaksnavn</Text>
                    <Text weight="bold">{data.name}</Text>
                </Grid>
            }
            {registryData &&
                <Grid columns={["small", "flex"]}>
                    <Text >Orginisasjonsnummer</Text>
                    <Text weight="bold">{ethers.utils.parseBytes32String(registryData.uuid)}</Text>
                </Grid>
            }
            {registryData &&
                <Grid columns={["small", "flex"]}>
                    <Text >Aktivt</Text>
                    <Text weight="bold">{registryData.active ? "Ja" : "Nei"}</Text>
                </Grid>
            }
            {data &&
                <Grid columns={["small", "flex"]}>
                    <Text >Antall aksjer</Text>
                    <Text weight="bold">{data.totalSupply.slice(0, -2)}</Text>
                </Grid>
            }
            {data &&
                <Grid columns={["small", "flex"]}>
                    <Text >Skrive rettigheter</Text>
                    <Text weight="bold">{data.isController ? "Ja" : "Nei"}</Text>
                </Grid>
            }
            {registryData && !registryData.active && capTableQue.instance &&
                <CapTableQueDetails capTableQue={capTableQue.instance} capTableAddress={capTable.address}></CapTableQueDetails>
            }

        </Box>
    )
}
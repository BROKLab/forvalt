import { ethers } from 'ethers';
import { Box, Grid, Text } from 'grommet';
import React, { useContext, useEffect, useState } from 'react';
import { CapTableRegistryContext, SymfoniContext } from '../../hardhat/ForvaltContext';
import { ERC1400 } from '@brok/captable-contracts';
import { CapTableQueDetails } from './../Que/CapTableQueDetails';

interface Props {
    capTable: ERC1400
}


interface CapTableRegistryData {
    uuid: string
    active: boolean
}


export const Info: React.FC<Props> = ({ capTable, ...pops }) => {
    const [name, setName] = useState<string>();
    const [isController, setIsController] = useState<boolean>();
    const [totalSupply, setTotalSupply] = useState<string>();
    const [registryData, setRegistryData] = useState<CapTableRegistryData>();
    const capTableRegistry = useContext(CapTableRegistryContext)
    const { address: currentAddress } = useContext(SymfoniContext)


    useEffect(() => {
        let subscribed = true
        const doAsync = async () => {
            const name = await capTable.name().catch(() => "No company found");
            const totalSupplyBN = await capTable
                .totalSupply()
            const isController = await (await capTable.controllers()).findIndex(address => address === currentAddress) !== -1
            if (subscribed) {
                setName(name)
                setTotalSupply(ethers.utils.formatEther(totalSupplyBN.toString()))
                setIsController(isController)
            }
            if (capTableRegistry.instance) {
                try {
                    const status = await capTableRegistry.instance.getStatus(capTable.address)
                    const uuid = await capTableRegistry.instance.getUuid(capTable.address)
                    if (subscribed) {
                        setRegistryData({
                            uuid: uuid === ethers.constants.HashZero ? ethers.utils.formatBytes32String("Ikke opprettet") : uuid,
                            active: status.toString() === "2"
                        })
                    }
                } catch (error) {
                    console.log(error)
                }
            }
        };
        doAsync();
        return () => { subscribed = false }
    }, [capTable, capTableRegistry.instance, currentAddress])

    return (
        <Box gap="small">
            {name &&
                <Grid columns={["small", "flex"]}>
                    <Text>Foretaksnavn</Text>
                    <Text weight="bold">{name}</Text>
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
            {totalSupply &&
                <Grid columns={["small", "flex"]}>
                    <Text >Antall aksjer</Text>
                    <Text weight="bold">{totalSupply}</Text>
                </Grid>
            }
            {isController &&
                <Grid columns={["small", "flex"]}>
                    <Text >Skrive rettigheter</Text>
                    <Text weight="bold">{isController ? "Ja" : "Nei"}</Text>
                </Grid>
            }
            {registryData && !registryData.active && capTableRegistry.instance &&
                <CapTableQueDetails capTableRegistry={capTableRegistry.instance} capTableAddress={capTable.address}></CapTableQueDetails>
            }

        </Box>
    )
}
import { ethers } from 'ethers';
import { Box, Grid, Text } from 'grommet';
import React, { useContext, useEffect, useState } from 'react';
import { CapTableRegistryContext, SymfoniContext } from '../../hardhat/ForvaltContext';
import { CapTable } from '@brok/captable-contracts';
import { CapTableQueDetails } from './../Que/CapTableQueDetails';

interface Props {
    capTable: CapTable
}


interface CapTableRegistryData {
    id: string
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
            try {
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
                        const uuid = await capTableRegistry.instance.getid(capTable.address)
                        if (subscribed) {
                            setRegistryData({
                                id: uuid === ethers.constants.HashZero ? ethers.utils.formatBytes32String("Ikke opprettet") : uuid,
                                active: status.toString() === "2"
                            })
                        }
                    } catch (error) {
                        console.log(error)
                    }
                }
            } catch (error) {
                console.log(error)
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
                    <Text weight="bold">{ethers.utils.parseBytes32String(registryData.id)}</Text>
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
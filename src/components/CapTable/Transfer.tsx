import { BytesLike, ethers } from 'ethers';
import { Box, Button, Select, Text, TextInput } from 'grommet';
import React, { useContext, useEffect, useState } from 'react';
import { SymfoniContext } from '../../hardhat/ForvaltContext';
import { ERC1400 } from '../../hardhat/typechain/ERC1400';
import { SelectUser } from '../ui/SelectUser';

interface Props {
    capTable: ERC1400
    done?: () => void
}


export const Transfer: React.FC<Props> = ({ ...props }) => {
    const [partitions, setPartitions] = useState<BytesLike[]>([]);
    const [partition, setPartition] = useState<BytesLike>();
    const [to, setTo] = useState<string>("");
    const [amount, setAmount] = useState<number>(0);
    const { init, signer } = useContext(SymfoniContext)
    // const authProvider = useContext(AuthProviderContext).instance?.attach(process.env.REACT_APP_AUTH_PROVIDER_ADDRESS ? process.env.REACT_APP_AUTH_PROVIDER_ADDRESS : ethers.constants.AddressZero)
    // Get partitions
    useEffect(() => {
        let subscribed = true
        const doAsync = async () => {
            const partitionsBytes32 = await props.capTable.totalPartitions()
            if (subscribed) {
                setPartitions(partitionsBytes32)
            }
        };
        doAsync();
        return () => { subscribed = false }
    }, [props.capTable])

    const transfer = async () => {
        if (!signer)
            return init()
        if (!partition) return alert("Sett aksjeklasse")
        if (!to) return alert("Sett til addresse")
        const amountEther = ethers.utils.parseEther(amount.toString())
        if (amountEther === ethers.constants.Zero) return alert("Kan ikke overføre 0 beløp")
        const tx = await props.capTable.transferByPartition(partition, to, amountEther, "0x11",)
        await tx.wait()
        if (props.done) props.done()
    }

    return (
        <Box gap="small">
            <Box direction="row" gap="small">
                <Box basis="100%">
                    <Text size="small">Til fødselsnummer</Text>
                    {/* <TextInput
                        style={{ minWidth: "100%" }}
                        placeholder="Til addresse"
                        value={to}
                        onChange={event => setTo(event.target.value)}
                    /> */}
                    <SelectUser onChange={setTo} value={to} capTableAddress={props.capTable.address} protocol={"ERC1400:BRREG:TRANSFER"}></SelectUser>
                </Box>

            </Box>
            <Box direction="row" gap="small">
                <Box basis="2/3">
                    <Text size="small">Aksjeklasse</Text>
                    <Select
                        placeholder="Aksjeklasse"
                        options={partitions}
                        labelKey={option => ethers.utils.parseBytes32String(option)}
                        onChange={({ option }) => setPartition(option)}
                    />
                </Box>
                <Box basis="1/3">
                    <Text size="small">Beløp</Text>
                    <TextInput
                        placeholder="Antall aksjer"
                        value={amount}
                        type="number"
                        onChange={(event) => setAmount(event.target.valueAsNumber)}
                    />
                </Box>
            </Box>

            <Box>
                <Button size="medium" label="Overfør aksjer" onClick={() => transfer()}></Button>
            </Box>
        </Box>
    )
}
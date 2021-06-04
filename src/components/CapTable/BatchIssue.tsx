import { BytesLike, ethers } from 'ethers';
import { Box, Button, Grid, Select, Text, TextInput } from 'grommet';
import React, { useContext, useEffect, useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { useHistory } from 'react-router-dom';
import { SymfoniContext } from '../../hardhat/ForvaltContext';
import { ERC1400 } from '@brok/captable-contracts';
import { SelectUser } from '../ui/SelectUser';

type PropsAggregate = {
    capTable?: ERC1400,
    done?: () => void
    actions?: React.ReactNode
    aggregateResult: (batchIssueData: BatchIssueData) => void
}
type PropsSend = {
    capTable: ERC1400,
    done?: () => void
    actions?: React.ReactNode
    aggregateResult?: never
}
type Props = PropsAggregate | PropsSend
export interface BatchIssueData {
    address: string[]
    amount: string[]
    partition: string[]
}
interface FormData extends BatchIssueData {

}

const createArrayWithNumbers = (length: number) => {
    return Array.from({ length }, (_, k) => k);
}

const DEFAULT_PARTITIONS = [ethers.utils.formatBytes32String("ordinære")]
const DEFAULT_ROW = {
    address: process.env.NODE_ENV === "development" ? ["0xf39fd6e51aad88f6f4ce6ab8827279cfffb92266"] : [],
    amount: [""],
    partition: [DEFAULT_PARTITIONS[0]],
}

export const BatchIssue: React.FC<Props> = ({ ...props }) => {
    const { handleSubmit, control, errors, setValue, watch } = useForm<FormData>({
        defaultValues: DEFAULT_ROW
    });
    const [rows, setRows] = useState(1);
    const history = useHistory()
    const [partitions, setPartitions] = useState<BytesLike[]>(DEFAULT_PARTITIONS);
    const [newPartition, setNewPartition] = useState("");
    const [useDefaultPartitions, setUseDefaultPartitions] = useState(true);
    const { init, signer } = useContext(SymfoniContext)
    const all = watch()

    useEffect(() => {
        console.log("all addr", all.address)
    }, [all])

    // Get partitions
    useEffect(() => {
        let subscribed = true
        const doAsync = async () => {
            if (props.capTable) {
                try {
                    const partitionsBytes32 = await props.capTable.totalPartitions().catch(() => [])
                    if (subscribed) {
                        setPartitions(old => [...old, ...partitionsBytes32.filter(a => old.indexOf(a) === -1)])
                    }
                } catch (error) {
                    console.debug("Could not retrive partitions from capTable")
                }
            }
        };
        doAsync();
        return () => { subscribed = false }
    }, [props.capTable])

    const onSubmitBatchIssue = async (data: FormData) => {
        console.log("onSubmit=>", data);
        if (!signer) {
            return init({ forceSigner: true })
        }
        const txData = "0x11"
        if (props.aggregateResult) {
            return props.aggregateResult(data)
        } else {
            if (!props.capTable) {
                throw Error("CapTable must be set when not aggregate result")
            }
            await createArrayWithNumbers(rows)
                .reduce(async (prev, rowNr) => {
                    if (!props.capTable) {
                        throw Error("CapTable must be set when not aggregate result")
                    }
                    await prev
                    // TODO : Handle CDP
                    const tx = await props.capTable.issueByPartition(data.partition[rowNr], data.address[rowNr], ethers.utils.parseEther(data.amount[rowNr]), txData)
                    await tx.wait()
                    return Promise.resolve()
                }, Promise.resolve())

            history.push("/captable/" + props.capTable.address)
            if (props.done) props.done()
        }

    }

    const handleNewPartition = () => {
        if (partitions.indexOf(newPartition) === -1) {
            setPartitions(old => [...old, ...[ethers.utils.formatBytes32String(newPartition)]])
            setNewPartition("")
        }
    }

    const COLUMNS = { count: 3, size: "auto" }
    return (
        <Box gap="medium">
            <Box gap="small">
                <Grid columns="1" fill="horizontal" gap="small">
                    <Text size="small" weight="bold" truncate>Har selskapet aksjeklasser?</Text>
                </Grid>
                <Box gap="small" direction="row-responsive">
                    <Button size="small" hoverIndicator={false} focusIndicator={false} label="Ja, legg til aksjeklasser" onClick={() => setUseDefaultPartitions(false)} style={{ fontWeight: !useDefaultPartitions ? "bold" : "initial" }}></Button>
                    <Button size="small" hoverIndicator={false} focusIndicator={false} label="Nei, selskapet har kun ordinære aksjer" onClick={() => setUseDefaultPartitions(true)} style={{ fontWeight: useDefaultPartitions ? "bold" : "initial" }}></Button>
                </Box>
            </Box>
            {!useDefaultPartitions &&
                <Box gap="small">
                    <Grid columns={["medium", "small"]}>
                        <TextInput size="small" value={newPartition} onChange={(e) => setNewPartition(e.target.value)} placeholder="Navn på partisjon feks. a-aksje"></TextInput>
                        <Button size="small" label="Foreslå partisjon" onClick={() => handleNewPartition()}></Button>
                    </Grid>
                    <Text size="small">Partisjoner blir først lagret når du utsteder en aksje på den.</Text>
                </Box>
            }
            <form /* id={props.capTable.address} */ onSubmit={handleSubmit(onSubmitBatchIssue)}>
                <Box gap="small">
                    <Grid columns={COLUMNS} fill="horizontal" gap="small">
                        <Text size="small" weight="bold" truncate>Fødselsnummer</Text>
                        <Text size="small" weight="bold" truncate>Antall aksjer</Text>
                        <Text style={{ display: useDefaultPartitions ? "none" : "inherit" }} size="small" weight="bold" truncate>Partisjon</Text>
                    </Grid>
                    {createArrayWithNumbers(rows).map((rowNr) =>
                        <Grid columns={COLUMNS} fill="horizontal" gap="small" key={rowNr}>
                            <Box >
                                <Controller render={({ onChange, value }) => <SelectUser onChange={onChange} value={value} capTableAddress={props.capTable.address} protocol={"ERC1400:BRREG:DEMO"}></SelectUser>} name={`address[${rowNr}]`} control={control} rules={{ required: true }} defaultValue={""} />
                                {errors["address"] && errors["address"][rowNr] && <Text color="red" size="xsmall">* {errors["address"][rowNr]?.type}</Text>}
                            </Box>
                            <Box >
                                <Controller as={<TextInput size="small" type={"number"} />} name={`amount[${rowNr}]`} control={control} rules={{ required: true }} defaultValue={""} />
                                {errors["amount"] && errors["amount"][rowNr] && <Text color="red" size="xsmall">* {errors["amount"][rowNr]?.type}</Text>}
                            </Box>
                            <Box style={{ display: useDefaultPartitions ? "none" : "inherit" }}>
                                {partitions &&
                                    <Controller
                                        render={({ onChange, value }) => <Select
                                            alignSelf="start"
                                            options={partitions}
                                            size="small"
                                            labelKey={(option) => ethers.utils.parseBytes32String(option)}
                                            emptySearchMessage={"Foreslå en partisjon ovenfor"}
                                            onChange={({ option }) => {
                                                setValue("org", option)
                                                setValue(`partition[${rowNr}]`, option)
                                                return option
                                            }}
                                            value={value}
                                            multiple={false}
                                        />}
                                        name={`partition[${rowNr}]`}
                                        control={control}
                                        rules={{ required: false }}
                                        defaultValue={DEFAULT_PARTITIONS[0]}

                                    />
                                }

                                {errors["partition"] && errors["partition"][rowNr] && <Text color="red" size="xsmall">* {errors["partition"][rowNr]?.type}</Text>}
                            </Box>
                        </Grid>
                    )}

                    <Box gap="small" alignSelf="end" direction="row-responsive" align="end">
                        <Button color="black" label="Legg til ny rad" onClick={() => setRows(rows + 1)} style={{ borderRadius: "0px" }}></Button>
                        <Button color="red" label="Fjern nederste rad" onClick={() => setRows(rows - 1)} disabled={rows === 1} style={{ borderRadius: "0px" }}></Button>
                        {props.actions}
                        <Button color="black" label={props.aggregateResult ? "Lagre og gå videre" : "Utsted aksjer"} type="submit" /* disabled={!formState.isValid} */ style={{ borderRadius: "0px" }}></Button>
                    </Box>
                </Box>
            </form>
        </Box>

    )
}
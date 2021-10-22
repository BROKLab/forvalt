import { CapTable } from '@brok/captable-contracts';
import { BytesLike, ethers } from 'ethers';
import { Box, Button, Grid, Select, Text, TextInput } from "grommet";
import { Trash } from 'grommet-icons';
import React, { useEffect, useState } from 'react';
import { useFieldArray, useForm } from 'react-hook-form';

type PropsAggregate = {
    capTable?: never,
    done?: () => void
    aggregateResult: (batchIssueData: BatchIssueData[]) => void
}
type PropsSend = {
    capTable: CapTable,
    done?: () => void
    aggregateResult?: never
}
type Props = PropsAggregate | PropsSend
export interface BatchIssueData {
    address: string
    amount: string
    partition: string
    identifier: string
    name: string
    streetAddress: string
    postalcode: string
    email: string
    id: string
}
interface FormData {
    test: BatchIssueData,
    production: BatchIssueData
}

const DEFAULT_PARTITION = ethers.utils.formatBytes32String("ordinære")

const defaultValues = {
    test: [
        {
            identifier: "17107292926",
            address: "",
            amount: "1000",
            partition: DEFAULT_PARTITION,
            name: "Robin Testesen",
            streetAddress: "Testveien 55",
            postalcode: "0123",
            email: "rob@test.com",
        },
    ],
    production: [
        {
            identifier: "",
            address: "",
            amount: "",
            partition: DEFAULT_PARTITION,
            name: "",
            streetAddress: "",
            postalcode: "",
            email: "",
        },
    ]
};

export const BatchIssue: React.FC<Props> = ({ ...props }) => {
    const { control, watch, register, setValue } = useForm({ defaultValues });
    const enviroment = process.env.NODE_ENV === "development" ? "test" : "production"
    const { fields, append, remove } = useFieldArray({
        control,
        name: enviroment
    });
    const watchFieldArray = watch(enviroment);
    const controlledFields = fields.map((field, index) => {
        return {
            ...field,
            ...watchFieldArray[index]
        };
    });
    // const history = useHistory()
    const [partitions, setPartitions] = useState<BytesLike[]>([DEFAULT_PARTITION]);
    const [newPartition, setNewPartition] = useState("");
    const [useDefaultPartitions, setUseDefaultPartitions] = useState(true);
    // const { init, signer } = useContext(SymfoniContext)

    // Get partitions if capTable is set
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

    const onSubmitBatchIssue = async () => {
        if (props.aggregateResult) {
            return props.aggregateResult(controlledFields)
        }
        // else {
        //     if (!props.capTable) {
        //         throw Error("CapTable must be set when not aggregate result")
        //     }
        // const txData = "0x11"
        //     await createArrayWithNumbers(rows)
        //         .reduce(async (prev, rowNr) => {
        //             if (!props.capTable) {
        //                 throw Error("CapTable must be set when not aggregate result")
        //             }
        //             await prev
        //             // TODO : Handle CDP
        //             const tx = await props.capTable.issueByPartition(data.partition[rowNr], data.address[rowNr], ethers.utils.parseEther(data.amount[rowNr]), txData)
        //             await tx.wait()
        //             return Promise.resolve()
        //         }, Promise.resolve())

        //     history.push("/captable/" + props.capTable.address)
        //     if (props.done) props.done()
        // }

    }

    const handleNewPartition = () => {
        if (partitions.indexOf(newPartition) === -1) {
            setPartitions(old => [...old, ...[ethers.utils.formatBytes32String(newPartition)]])
            setNewPartition("")
        }
    }

    return (
        <Box gap="medium">
            <Box gap="small" >
                <Grid columns="1" fill="horizontal" gap="small">
                    <Text size="small" weight="bold" truncate>Har selskapet aksjeklasser?</Text>
                </Grid>
                <Box gap="small" direction="row-responsive">
                    <Button size="small" hoverIndicator={false} focusIndicator={false} label="Ja, legg til aksjeklasser" onClick={() => setUseDefaultPartitions(false)} style={{ fontWeight: !useDefaultPartitions ? "bold" : "initial" }}></Button>
                    <Button size="small" hoverIndicator={false} focusIndicator={false} label="Nei, selskapet har kun ordinære aksjer" onClick={() => setUseDefaultPartitions(true)} style={{ fontWeight: useDefaultPartitions ? "bold" : "initial" }}></Button>
                </Box>
            </Box>
            {!useDefaultPartitions &&
                <Box gap="small" elevation="medium" pad="small">
                    <Grid columns={["medium", "small"]}>
                        <TextInput size="small" value={newPartition} onChange={(e) => setNewPartition(e.target.value)} placeholder="Navn på partisjon feks. a-aksje"></TextInput>
                        <Button size="small" label="Foreslå partisjon" onClick={() => handleNewPartition()}></Button>
                    </Grid>
                    <Text size="xsmall">*Partisjoner blir først opprettet når du utsteder en aksje på den.</Text>
                </Box>
            }

            <Box gap="small">
                <Grid columns={{ count: 8, size: "xsmall" }} fill="horizontal" gap="small">
                    <Text size="small" weight="bold" truncate>Fødselsnummer</Text>
                    <Text size="small" weight="bold" truncate>Navn</Text>
                    <Text size="small" weight="bold" truncate>Veiadresse</Text>
                    <Text size="small" weight="bold" truncate>Postnummer</Text>
                    <Text size="small" weight="bold" truncate>Epost</Text>
                    <Text size="small" weight="bold" truncate>Antall aksjer</Text>
                    <Text style={{ display: useDefaultPartitions ? "none" : "inherit" }} size="small" weight="bold" truncate>Partisjon</Text>
                </Grid>

                {controlledFields.map((field, index) => (
                    <Grid columns={{ count: 8, size: "xsmall" }} fill="horizontal" gap="small" key={index} >
                        <Box>
                            <TextInput {...register(`${enviroment}.${index}.identifier` as const)} placeholder="Fødselsnummer" size="small"  ></TextInput>
                        </Box>
                        <Box>
                            <TextInput {...register(`${enviroment}.${index}.name` as const)} placeholder={"Navn"} size="small" ></TextInput>
                        </Box>
                        <Box>
                            <TextInput {...register(`${enviroment}.${index}.streetAddress` as const)} placeholder={"Veiadresse"} size="small"  ></TextInput>
                        </Box>
                        <Box>
                            <TextInput {...register(`${enviroment}.${index}.postalcode` as const)} placeholder={"Postnummer"} size="small"  ></TextInput>
                        </Box>
                        <Box>
                            <TextInput {...register(`${enviroment}.${index}.email` as const)} placeholder={"Epost"} size="small"  ></TextInput>
                        </Box>
                        <Box>
                            <TextInput {...register(`${enviroment}.${index}.amount` as const)} type="number" placeholder={"Antall"} size="small"  ></TextInput>
                        </Box>
                        <Box style={{ display: useDefaultPartitions ? "none" : "inherit" }}>
                            <Select
                                {...register(`${enviroment}.${index}.partition` as const)}
                                options={partitions}
                                size="small"
                                alignSelf="start"
                                labelKey={(option) => ethers.utils.parseBytes32String(option)}
                                emptySearchMessage={"Foreslå en partisjon ovenfor"}
                                onChange={({ option }) => {
                                    setValue(`${enviroment}.${index}.partition`, option)
                                    return option
                                }}
                            ></Select>
                        </Box>
                        <Box>
                            <Button onClick={() => remove(index)} icon={<Trash color="red"></Trash>}></Button>
                        </Box>
                    </Grid>
                ))}
                {/* address: "",
            amount: "",
            partition: "",
            identifier: "",
            name: "",
            streetAddress: "",
            postalcode: "",
            email: "", */}



                <Box gap="small" alignSelf="end" direction="row-responsive" align="end">
                    <Button color="black" label="Legg til aksjeeier" onClick={() => append(defaultValues[enviroment])} style={{ borderRadius: "0px" }}></Button>
                    <Button color="black" label={props.aggregateResult ? "Lagre og gå videre" : "Utsted aksjer"} onClick={() => onSubmitBatchIssue()}/* disabled={!formState.isValid} */ style={{ borderRadius: "0px" }}></Button>
                </Box>
            </Box>
        </Box >

    )
}
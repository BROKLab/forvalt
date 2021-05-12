import axios, { AxiosError, AxiosResponse } from 'axios';
import { ethers } from 'ethers';
import { Box, Button, Grid, Select, Text } from 'grommet';
import { Search } from 'grommet-icons';
import React, { useContext, useEffect, useState } from 'react';
import { Controller, useForm } from "react-hook-form";
import { useHistory } from 'react-router-dom';
import { SpinnerDiamond } from 'spinners-react/lib/esm/SpinnerDiamond';
import { CapTableQueContext, ERC1400Context, SymfoniContext } from "../../hardhat/ForvaltContext";
import { Transaction } from '../../utils/ethers-helpers';
import { formatCurrency } from '../../utils/numbers';
import { removePassword } from '../../utils/passwordBlockAPI';

interface Props {
    capTableTransactions?: (capTableAddress: string, txs: Transaction[]) => void
}

interface FormData {
    org: OrgData | null
}

export interface OrgData {
    Aksjer: number
    Kapital: number
    Navn: string
    Orgnr: number
    Vedtektsdato: string
}
interface ApiRespons {
    result: OrgData[]
}

const DEFAULT_DATA = [
    {
        "Orgnr": 918465138,
        "Navn": "AUSTDAL-AS",
        "Kapital": 30300,
        "Aksjer": 300,
        "Vedtektsdato": "17.01.2020"
    },
    {
        "Orgnr": 922188157,
        "Navn": "ARB",
        "Kapital": 30000,
        "Aksjer": 100,
        "Vedtektsdato": "20.04.2020"
    },
    {
        "Orgnr": 999101720,
        "Navn": "AKTIVEBARN.NO",
        "Kapital": 100000,
        "Aksjer": 100000,
        "Vedtektsdato": "28.02.2018"
    },
    {
        "Orgnr": 922228701,
        "Navn": "AKSJESELSKAPET-REDITUS",
        "Kapital": 30000,
        "Aksjer": 30,
        "Vedtektsdato": "01.02.2019"
    },
    {
        "Orgnr": 914492742,
        "Navn": "ALFA-AS",
        "Kapital": 30000,
        "Aksjer": 2,
        "Vedtektsdato": "19.11.2014"
    },
    {
        "Orgnr": 810130822,
        "Navn": "ALSTRA AS",
        "Kapital": 100000,
        "Aksjer": 10,
        "Vedtektsdato": "20.04.2002"
    },
    {
        "Orgnr": 810215542,
        "Navn": "AS SUNBYGG",
        "Kapital": 570000,
        "Aksjer": 100,
        "Vedtektsdato": "22.11.2004"
    },
    {
        "Orgnr": 810359862,
        "Navn": "AUTOBJ�RN A/S",
        "Kapital": 792000,
        "Aksjer": 7920,
        "Vedtektsdato": "11.03.2005"
    },
    {
        "Orgnr": 810431172,
        "Navn": "AS SCAN-WOOD",
        "Kapital": 210000,
        "Aksjer": 30,
        "Vedtektsdato": "24.04.2012"
    },
    {
        "Orgnr": 811012572,
        "Navn": "AS CENTRALVERKSTEDET",
        "Kapital": 270000,
        "Aksjer": 0,
        "Vedtektsdato": "10.12.2013"
    }
]

export const CapTableCreate: React.FC<Props> = ({ ...props }) => {
    const { handleSubmit, watch, control, errors, setValue, formState, setError } = useForm<FormData>({
        defaultValues: {
            org: null,
        }
    });
    const history = useHistory();
    const [orgList, setOrgList] = useState<OrgData[]>(DEFAULT_DATA);
    const [isSearchingBrreg, setIsSearchingBrreg] = useState(false);
    const erc1400 = useContext(ERC1400Context)
    const capTableQue = useContext(CapTableQueContext)
    const orgWatch = watch("org")
    const [searchQuery, setSearchQuery] = useState("");
    const { init } = useContext(SymfoniContext)

    // useEffect(() => {
    //     if (process.env.NODE_ENV === "development") {
    //         setValue("org", DEFAULT_DATA[0])
    //     }
    // }, [setValue])

    useEffect(() => {
        const timer = setTimeout(async () => {
            try {
                if (!searchQuery) return
                setIsSearchingBrreg(true)
                const isOrgName = isNaN(+searchQuery)
                if (isOrgName) {
                    const res: AxiosResponse<ApiRespons> = await axios.get("https://auth-oracle.now.sh/api/v1/org", {
                        params: {
                            name: searchQuery,
                        }
                    }).catch((err: AxiosError<ApiRespons>) => {
                        if (err.response?.status === 401) {
                            removePassword()
                        }
                        throw Error("Søk etter navn ga ingen resultater.")
                    })
                    console.debug(res)
                    setOrgList(res.data.result)
                } else {
                    const res: AxiosResponse<ApiRespons> = await axios.get("https://auth-oracle.now.sh/api/v1/org", {
                        params: {
                            orgnr: searchQuery.replace(/\s/g, ''),
                        }
                    }).catch(err => {
                        if (err.response?.status === 401) {
                            removePassword()
                        }
                        throw Error("Søk etter org nr ga ingen resultater.")
                    })
                    setOrgList(res.data.result)
                }
                setIsSearchingBrreg(false)
            } catch (error) {
                setError("org", { message: error.message })
                setOrgList([])
                setIsSearchingBrreg(false)
            }
        }, 500)
        return () => {
            console.log("Cleanup")
            clearTimeout(timer)
            setIsSearchingBrreg(false)
        }
    }, [searchQuery, setError])

    const onSubmit = async (data: FormData) => {
        if (!capTableQue.instance) throw Error("Aksjeregister køen er ikke lastet inn.")
        console.debug("Submitting", data)
        if (!erc1400.factory) {
            return init()
        }
        if (!data.org) {
            throw Error("Data not defined.")
        }

        const CONTROLLERS = [
            '0xC9901c379E672912D86D12Cb8f182cFaf5951940',
            '0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266',
            '0xbb1c879cb7f5129ba026DfE1E5f30979D7978A65'
        ]
        const DEFAULT_PARTITIONS = [ethers.utils.formatBytes32String("A")]

        if (props.capTableTransactions) {
            const capTableTx = await erc1400.factory.getDeployTransaction(data.org.Navn, data.org.Navn.substr(0, 3), 1, CONTROLLERS, DEFAULT_PARTITIONS)
            const create2Address = ethers.utils.getContractAddress({ from: await erc1400.factory.signer.getAddress(), nonce: await erc1400.factory.signer.getTransactionCount() })
            console.log("create2Address", create2Address)
            const queTx = await capTableQue.instance.populateTransaction.add(create2Address, ethers.utils.formatBytes32String(data.org.Orgnr.toString()))
            return props.capTableTransactions(create2Address, [capTableTx, queTx])
        } else {
            const capTable = await erc1400.factory.deploy(data.org.Navn, data.org.Navn.substr(0, 3), 1, CONTROLLERS, DEFAULT_PARTITIONS)
            await capTable.deployed()
            console.debug("CapTable deployed", capTable.address)
            const orgnr = data.org.Orgnr.toString();
            const tx = await capTableQue.instance.add(capTable.address, ethers.utils.formatBytes32String(orgnr))
            await tx.wait()
            history.push("/capTable/" + capTable.address + "/onboard")
        }
    }

    const [selected, setSelected] = useState<OrgData>();
    return (
        <Box>
            <form onSubmit={handleSubmit(onSubmit)}>
                <Box gap="medium">
                    <Box gap="small">
                        <Text>Søk</Text>
                        <Grid columns={["flex", "auto"]}>
                            <Controller
                                render={({ value, onChange }) =>
                                    <Select
                                        options={orgList}
                                        value={selected}
                                        size="small"
                                        placeholder="Velg et selskap"
                                        emptySearchMessage={isSearchingBrreg ? "Søker..." : "Søk etter selskap med navn eller org nr."}
                                        focusIndicator={false}
                                        onSearch={(query) => setSearchQuery(query)}
                                        labelKey={(option: OrgData) => option.Navn + " | " + option.Orgnr}
                                        onChange={({ option }) => {
                                            setValue("org", option)
                                            setSelected(option)
                                            return option
                                        }}
                                        disabled={isSearchingBrreg}
                                    />
                                }
                                defaultValue={null}
                                name="org"
                                control={control}
                                rules={{ required: true }}
                            />

                            <Button size="small" icon={isSearchingBrreg ? <SpinnerDiamond color="brand" size="20"></SpinnerDiamond> : <Search></Search>}></Button>
                        </Grid>
                        <Box>
                            {errors.org && <Text color="red" size="small">* {errors.org.message}</Text>}
                        </Box>


                        {orgWatch && !isSearchingBrreg &&
                            <Box background="brand" pad="small">
                                <Grid columns={["1/3", "2/3"]} fill="horizontal" gap="small">
                                    <Text size="xsmall">Org nr.</Text>
                                    <Text size="small" weight="bold">{orgWatch.Orgnr}</Text>

                                    <Text size="xsmall">Navn</Text>
                                    <Text size="small" weight="bold">{orgWatch.Navn}</Text>

                                    <Text size="xsmall">Kapital</Text>
                                    <Text size="xsmall">{formatCurrency(orgWatch.Kapital)}</Text>

                                    <Text size="xsmall">Pålydene</Text>
                                    <Text size="xsmall">{formatCurrency(orgWatch.Kapital / orgWatch.Aksjer)}</Text>

                                    <Text size="xsmall">Aksjer</Text>
                                    <Text size="xsmall">{orgWatch.Aksjer}</Text>

                                    <Text size="xsmall">Vedtektsdato</Text>
                                    <Text size="xsmall">{orgWatch.Vedtektsdato}</Text>
                                </Grid>
                            </Box>
                        }
                    </Box>

                    {orgWatch &&
                        <Button
                            type="submit"
                            disabled={formState.isSubmitting /* || Object.keys(formState.touched).length === 0 */}
                            color="brand"
                            label="Velg selskap"
                            margin={{ /* top: "medium" */ }}
                            size="large"
                        ></Button>
                    }
                </Box>
            </form >
        </Box>
    )
}

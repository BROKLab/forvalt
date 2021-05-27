import axios, { AxiosError } from 'axios';
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
    aksjer: number
    kapital: number
    navn: string
    orgnr: number
    vedtektsdato: string
}
interface ApiRespons {
    result: OrgData[]
}

const DEFAULT_DATA: OrgData[] = [{ "orgnr": 911724758, "navn": "BLOCKCHAIN BROKERS AS", "kapital": 30000, "aksjer": 200, "vedtektsdato": "28.02.2018" }, { "orgnr": 915772137, "navn": "BLOCKCHANGERS AS", "kapital": 40378, "aksjer": 40378, "vedtektsdato": "10.12.2018" }, { "orgnr": 915912028, "navn": "BLOCKBONDS AS", "kapital": 18455512, "aksjer": 18455512, "vedtektsdato": "06.12.2019" }, { "orgnr": 918917160, "navn": "BLOCKBRIDGE AS", "kapital": 30000, "aksjer": 30000, "vedtektsdato": "08.05.2017" }, { "orgnr": 919437235, "navn": "BLOCKTRADE AS", "kapital": 30000, "aksjer": 30000, "vedtektsdato": "01.08.2017" }, { "orgnr": 919526696, "navn": "BLOCKCHAIN AS", "kapital": 30000, "aksjer": 300000, "vedtektsdato": "22.08.2017" }, { "orgnr": 920415296, "navn": "BLOCKCHAIN INVEST AS", "kapital": 30000, "aksjer": 30000, "vedtektsdato": "19.04.2018" }, { "orgnr": 920596908, "navn": "BLOCKANDINAVIA AS", "kapital": 30000, "aksjer": 300, "vedtektsdato": "20.02.2018" }, { "orgnr": 920876501, "navn": "BLOCKCHAIN SOLUTIONS AS", "kapital": 30000, "aksjer": 200, "vedtektsdato": "02.05.2018" }, { "orgnr": 921209347, "navn": "BLOCKCHAIN TECHNOLOGY AS", "kapital": 900000, "aksjer": 90, "vedtektsdato": "10.05.2018" }]

export const CapTableCreate: React.FC<Props> = ({ ...props }) => {
    const { handleSubmit, watch, control, errors, formState, setError } = useForm<FormData>({
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
    const { init, signer } = useContext(SymfoniContext)

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
                const _searchQuery = isOrgName ? searchQuery : searchQuery.replace(/\s/g, '')
                if (!process.env.REACT_APP_BROK_HELPERS) {
                    throw Error("process.env.REACT_APP_BROK_HELPERS not set")
                }
                const capTableInfoAPI = process.env.REACT_APP_BROK_HELPERS + "/brreg/captable/info"

                const res = await axios.get<OrgData[]>(capTableInfoAPI, {
                    params: {
                        query: _searchQuery,
                    }
                }).catch((err: AxiosError<ApiRespons>) => {
                    if (err.response?.status === 401) {
                        removePassword()
                    }
                    throw Error("Søk etter navn ga ingen resultater.")
                })
                console.debug(res)
                setOrgList(res.data)

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
        if (!erc1400.factory || !signer) {
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
            const capTableTx = await erc1400.factory.getDeployTransaction(data.org.navn, data.org.navn.substr(0, 3), 1, CONTROLLERS, DEFAULT_PARTITIONS)
            const create2Address = ethers.utils.getContractAddress({ from: await erc1400.factory.signer.getAddress(), nonce: await erc1400.factory.signer.getTransactionCount() })
            console.log("create2Address", create2Address)
            const queTx = await capTableQue.instance.populateTransaction.add(create2Address, ethers.utils.formatBytes32String(data.org.orgnr.toString()))
            return props.capTableTransactions(create2Address, [capTableTx, queTx])
        } else {
            const capTable = await erc1400.factory.deploy(data.org.navn, data.org.navn.substr(0, 3), 1, CONTROLLERS, DEFAULT_PARTITIONS)
            await capTable.deployed()
            console.debug("CapTable deployed", capTable.address)
            const orgnr = data.org.orgnr.toString();
            const tx = await capTableQue.instance.add(capTable.address, ethers.utils.formatBytes32String(orgnr))
            await tx.wait()
            if ("request" in signer) {
                await signer.request("oracle_data", [{
                    method: "approve_captable",
                    capTableAddress: capTable.address
                }])
            }

            history.push("/capTable/" + capTable.address + "/onboard")
        }
    }

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
                                        value={value}
                                        size="small"
                                        placeholder="Velg et selskap"
                                        emptySearchMessage={isSearchingBrreg ? "Søker..." : "Søk etter selskap med navn eller org nr."}
                                        focusIndicator={false}
                                        onSearch={(query) => setSearchQuery(query)}
                                        labelKey={(option: OrgData) => option.navn + " | " + option.orgnr}
                                        onChange={({ option }) => onChange(option)}
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
                                    <Text size="small" weight="bold">{orgWatch.orgnr}</Text>

                                    <Text size="xsmall">Navn</Text>
                                    <Text size="small" weight="bold">{orgWatch.navn}</Text>

                                    <Text size="xsmall">Kapital</Text>
                                    <Text size="xsmall">{formatCurrency(orgWatch.kapital)}</Text>

                                    <Text size="xsmall">Pålydene</Text>
                                    <Text size="xsmall">{formatCurrency(orgWatch.kapital / orgWatch.aksjer)}</Text>

                                    <Text size="xsmall">Aksjer</Text>
                                    <Text size="xsmall">{orgWatch.aksjer}</Text>

                                    <Text size="xsmall">Vedtektsdato</Text>
                                    <Text size="xsmall">{orgWatch.vedtektsdato}</Text>
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

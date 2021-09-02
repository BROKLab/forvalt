import axios, { AxiosError } from 'axios';
import { ethers } from 'ethers';
import { Accordion, AccordionPanel, Box, Button, Heading, Paragraph, Text } from 'grommet';
import { Checkmark } from 'grommet-icons';
import { validateNorwegianIdNumber } from 'norwegian-national-id-validator';
import React, { useCallback, useContext, useEffect, useState } from 'react';
import { useHistory } from 'react-router-dom';
import { BatchIssue, BatchIssueData } from '../components/CapTable/BatchIssue';
import { OrgData, SelectOrg } from '../components/CapTable/SelectOrg';
import { Loading } from '../components/ui/Loading';
import { CapTableFactoryContext, SymfoniContext } from '../hardhat/ForvaltContext';

interface Props {
}

enum STEP {
    SELECT_COMPANY = 0,
    ISSUE_SHARES = 1,
    CONFIRM = 2
}

const TESTING = false


export const CapTableCreatePage: React.FC<Props> = ({ ...props }) => {
    const { init, signer } = useContext(SymfoniContext)
    const [step, setStep] = useState(STEP.SELECT_COMPANY); // TEST - ISSUE_SHARES
    const [deploying, setDeploying] = useState(false);
    const [orgData, setOrgData] = useState<OrgData>(); // TEST - DEFAULT_ORG_DATA[0]
    const [batchIssueData, setBatchIssueData] = useState<BatchIssueData[]>();
    const capTableFactory = useContext(CapTableFactoryContext)

    const history = useHistory()


    const handleOrgData = useCallback((data: OrgData) => {
        setStep(step + 1)
        setOrgData(data)
    }, [step])


    const handleBatchIssueData = useCallback((data: BatchIssueData[]) => {
        setStep(step + 1)
        setBatchIssueData(data)
    }, [step])
    useEffect(() => {
        if (!signer) {
            init({ forceSigner: true })
        }
    }, [init, signer])

    const resolveIdentifierToAddress = async (params: { name: string, streetAddress: string, postalcode: string, email: string, identifier: string, orgnr: string }) => {
        if (!signer || !("request" in signer)) throw Error("Must have a signer resolve address from identifier")
        const BROK_HELPERS_URL = process.env.REACT_APP_BROK_HELPERS_URL
        const BROK_HELPERS_VERIFIER = process.env.REACT_APP_BROK_HELPERS_VERIFIER
        if (!BROK_HELPERS_URL || !BROK_HELPERS_VERIFIER) throw Error("BROK_HELPERS_URL and BROK_HELPERS_VERIFIER must be decleared in enviroment")
        const vpJWT = await signer.request("did_createVerifiableCredential", [{
            verifier: BROK_HELPERS_VERIFIER,
            payload: {
                name: params.name,
                streetAddress: params.streetAddress,
                postalcode: params.postalcode,
                email: params.email,
                identifier: params.identifier,
                orgnr: params.orgnr,
            }
        }])
        console.log("vpJWT", vpJWT)
        const res = await axios
            .post<{ blockchainAccount: string }>(
                `${TESTING ? "http://localhost:3004" : BROK_HELPERS_URL
                }/brreg/unclaimed/create`,
                {
                    jwt: vpJWT,
                }
            )
            .catch(
                (error: AxiosError<{ message: string; code: number }>) => {
                    if (error.response && error.response.data.message) {
                        throw Error(error.response.data.message);
                    }
                    throw Error(error.message);
                }
            );
        if (!res.data.blockchainAccount) {
            throw Error("/brreg/unclaimed/create should return a blockchainAccount ")
        }
        return res.data.blockchainAccount
    }

    const deploy = async () => {
        if (!signer) return init({ forceSigner: true })
        if (!capTableFactory.instance) {
            throw Error("CapTable Factory not initialized")
        }
        if (!orgData) {
            throw Error("Du må velge selskap først")
        }
        if (!batchIssueData) {
            throw Error
        }
        setDeploying(true)
        console.log("batchIssueData", batchIssueData)
        const resolvedFieldPromises = batchIssueData.map(async field => {
            if (field.identifier.substr(0, 2) === "0x") {
                if (ethers.utils.isAddress(field.identifier)) {
                    return { ...field, address: field.identifier }
                }
            }
            if (validateNorwegianIdNumber(field.identifier)) {
                const address = await resolveIdentifierToAddress({
                    email: field.name + Math.random().toString(),
                    identifier: field.identifier,
                    name: field.name,
                    postalcode: field.postalcode,
                    streetAddress: field.streetAddress,
                    orgnr: orgData.orgnr.toString(),
                })
                return { ...field, address: address }
            }
            throw Error("Identifier was not Norwegian ID number or an Ethereum address")
        })
        const resolvedFields = await Promise.all(resolvedFieldPromises)

        let deployedContract: string | undefined
        const deployTx = await capTableFactory.instance.createCapTable(
            ethers.utils.formatBytes32String(orgData.orgnr.toString()),
            orgData.navn,
            orgData.navn.substr(0, 3),
            resolvedFields.map(a => a.address),
            resolvedFields.map(a => ethers.utils.parseEther(a.amount))
        )
        await deployTx.wait()
        try {
            deployedContract = await capTableFactory.instance.getLastQuedAddress(ethers.utils.formatBytes32String(orgData.orgnr.toString()))
        } catch (error) {
            throw Error("Could not getLastQuedAddress on uuid " + orgData.orgnr.toString())
        }
        // TODO ADD this back inn
        // if ("request" in signer) {
        //     await signer.request("oracle_data", [{
        //         method: "approve_captable",
        //         capTableAddress: deployedContract
        //     }])
        // }
        setDeploying(false)
        if (deployedContract) {
            history.push("/captable/" + deployedContract)
        }
    }

    return (
        <Box gap="small" >
            <Heading>Opprett aksjeeierbok</Heading>
            {!signer &&
                <Box><Text>Du må koble til med en signer</Text></Box>
            }
            <Accordion justify="start" activeIndex={step} gap="small">
                <AccordionPanel label="1. Velg selskap" onClickCapture={() => setStep(STEP.SELECT_COMPANY)}>
                    <Box pad="small">
                        <SelectOrg aggragateResult={(orgData) => handleOrgData(orgData)}></SelectOrg>
                    </Box>
                </AccordionPanel>
                <AccordionPanel label="2. Utsted aksjer" onClickCapture={() => setStep(STEP.ISSUE_SHARES)}>
                    <Box pad="medium">
                        {orgData
                            ? <BatchIssue aggregateResult={(batchIssueData) => handleBatchIssueData(batchIssueData)}></BatchIssue>
                            : <Paragraph fill>Vennligst velg en aksjeeierbok</Paragraph>
                        }
                    </Box>
                </AccordionPanel>
                <AccordionPanel label="3. Bekreft" onClickCapture={() => setStep(STEP.CONFIRM)}>
                    <Box margin="small">
                        <Paragraph fill={true}>Kun selskapets <strong>styreleder</strong> kan flytte aksjeeierboken til Brønnøysundregistrene Aksjeeierbok.
                            Når selskapet bruker denne løsningen, vil dette være en offisielle aksjeeierboken,
                            og den tidligere aksjeeierboken selskapet er ikke lengre gyldig.</Paragraph>

                        <Paragraph fill={true}>Aksjonærer i selskapet vil kunne sende aksjene sine til andre uten styrets samtykke,
                            og aksjeeierboken vil automatisk oppdateres fortløpende.
                        </Paragraph>

                        <Paragraph><Text weight="bold">Ved å fortsette, bekrefter du følgende:</Text></Paragraph>

                        <Paragraph fill={true}><Checkmark size="small"></Checkmark> Jeg er styreleder i selskapet jeg valgte i forrige steg.</Paragraph>
                        <Paragraph fill={true}><Checkmark size="small"></Checkmark> Jeg er inneforstått med at løsningen ikke automatisk innrapporterer noe til offentlig sektor,
                            og at innrapportering forstatt må gjøres som før.</Paragraph>
                        <Paragraph fill={true}><Checkmark size="small"></Checkmark> Jeg er inneforstått med at løsningen er i Brønnøysundregistrene Sandkasse,
                            som betyr at Brønnøysundregistrene kan slutte å drifte løsningen. Det vil da være mulig å laste need aksjeeierboken i csv-format.</Paragraph>
                        <Paragraph fill={true}><Checkmark size="small"></Checkmark> Jeg er inneforstått med at løsningen er i Brønnøysundregistrene Sandkasse, som betyr at det kan være feil i løsningen.</Paragraph>
                        <Paragraph fill={true}><Checkmark size="small"></Checkmark> Jeg er inneforstått med at aksjeeierboken blir liggende offentlig tilgjengelig på nett.</Paragraph>

                        {/* <Paragraph fill>Det kreves {totalTransactions + 1} signereing for å opprette dette selskapet, utstede aksjene og godkjenne selskapet hos Brreg. Lommeboken vil forslå signering for deg.</Paragraph> */}
                    </Box>
                </AccordionPanel>
            </Accordion>
            <Button size="large" label="Opprett aksjeeierbok" disabled={step !== STEP.CONFIRM || !orgData || !batchIssueData /* || deploying */} onClick={() => deploy()}></Button>
            {deploying &&
                <Box align="center" >
                    <Loading size={50}></Loading>

                </Box>
            }
        </Box >
    )
}
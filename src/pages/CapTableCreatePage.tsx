import React, { useCallback, useContext, useEffect, useState } from 'react';
import { Accordion, AccordionPanel, Box, Button, Grid, Heading, Paragraph, Spinner, Text } from 'grommet';
import { OrgData, SelectOrg } from '../components/SelectOrg';
import { PrivateTokenTransferData, PrivateTokenTransferForm } from '../components/PrivateTokenTransferForm';
import { Checkmark } from 'grommet-icons';
import { SymfoniContext } from '../context/SymfoniContext';
import { toast } from 'react-toastify';
import { SignatureRequest } from '../utils/SignerRequestHandler';
import { BrokContext } from '../context/BrokContext';
import { useHistory } from 'react-router';
import { AxiosError } from 'axios';
var debug = require("debug")("page:createCapTable");



interface Props {}

enum STEP {
    SELECT_COMPANY = 0,
    ISSUE_SHARES = 1,
    CONFIRM = 2,
}


export const CapTableCreatePage: React.FC<Props> = ({ ...props }) => {
    const history = useHistory();
    const { signer, initSigner, signatureRequestHandler } = useContext(SymfoniContext)
    const { createCaptable } = useContext(BrokContext)
    const [step, setStep] = useState(STEP.SELECT_COMPANY); // TEST - ISSUE_SHARES
    const [orgData, setOrgData] = useState<OrgData>(); // TEST - DEFAULT_ORG_DATA[0]
    const [privateTokenTransfers, setPrivateTokenTransfers] = useState<PrivateTokenTransferData[]>();
    const [useDefaultPartitions, setUseDefaultPartitions] = useState(true);
    const [deploying, setDeploying] = useState(false);

    const handleOrgData = useCallback(
        (data: OrgData) => {
            setStep(step + 1);
            setOrgData(data);
        },
        [step]
    );

    const handlePrivateTokenTransferData = useCallback(
        (data: PrivateTokenTransferData[]) => {
            setStep(step + 1);
            setPrivateTokenTransfers(data);
        },
        [step]
    );

    const requireSigner = (!signer || !("request" in signer));


    const createCapTable = async () => {
        debug(`Started createCapTable, has request in signer ${signer && "request" in signer}`)
        if (!signer || !("request" in signer)) {
            debug(`No signer or request in signer found, running initSigner`)
            return initSigner()
        }
        const BROK_HELPERS_VERIFIER = process.env.REACT_APP_BROK_HELPERS_VERIFIER;
        if (!orgData) {
            return toast("Du må velge selskap først");
        }
        if (!privateTokenTransfers) {
            return toast("Du må sette aksjonærer først");
        }
        setDeploying(true);
        debug(`creating org`, orgData)
        debug(`creating privateTokenTransfers`, privateTokenTransfers);
        if (!signatureRequestHandler) throw Error("TODO: Create error");
        debug("BROK_HELPERS_VERIFIER", BROK_HELPERS_VERIFIER)
        const request: SignatureRequest = {
            message: "Godkjenn migreringen av aksjeeierboka",
            fn: async () =>
                await signer.request("symfoniID_createCapTableVP", [
                    {
                        verifier: BROK_HELPERS_VERIFIER,
                        capTable: {
                            organizationNumber: orgData.orgnr.toString(),
                            shareholders: privateTokenTransfers,
                        }
                    },
                ]),
        };

        debug(`Created request in signatureRequestHandler`)
        signatureRequestHandler.add([request]);
        let response = await signatureRequestHandler.results().catch(error => {
            debug(error)
            return undefined
        }) as { vp: string }[] | undefined
        if (!response) {
            toast(`Signering ble avbrutt.`)
            setDeploying(false);
            return
        }
        if (!Array.isArray(response) || !response[0]) {
            toast(`Feil i respons fra Lommebok.`)!
            setDeploying(false);
            return
        }
        const createCapTableVP = response[0].vp

        debug("signature result", createCapTableVP);
        const createCapTableRespone = await createCaptable(createCapTableVP).catch((error: AxiosError<{message: string}>) => {
            if(error.isAxiosError){
                if(error.response && error.response.data && "message" in error.response.data){
                    toast( error.response.data.message)
                }
                debug("createCapTableRespone", error.response);
            }
            toast(error.message)
            return undefined
        })
        debug("deployed contract", createCapTableRespone);

        setDeploying(false);
        // history.push("/");
        if (createCapTableRespone && createCapTableRespone.data.capTableAddress) {
            history.push("/captable/" + createCapTableRespone.data.capTableAddress);
        }
    };

    useEffect(() => {
        if(process.env.NODE_ENV !== "production"){
            console.log("Fnr", `11126138727`);
            console.log("Fnr", `14102123973`);
            console.log("Fnr", `26090286144`);
            console.log("Fnr", `09050319935`, "Jon");
            console.log("One - time password", `otp`);
            console.log("Personal password", `qwer1234`);
        }
    }, []);


  
    return (
        <Box gap="small">
            <Heading>Opprett aksjeeierbok</Heading>

            <Accordion justify="start" activeIndex={step} gap="small">


                {/* Select organization */}
                <AccordionPanel label="1. Velg selskap" onClickCapture={() => setStep(STEP.SELECT_COMPANY)}>
                    <Box pad="small">
                        <SelectOrg onSubmit={(orgData) => handleOrgData(orgData)}></SelectOrg>
                    </Box>
                </AccordionPanel>


                {/* Token issue */}
                <AccordionPanel label="2. Utsted aksjer" onClickCapture={() => setStep(STEP.ISSUE_SHARES)}>
                    <Box pad="medium">
                    <PrivateTokenTransferForm
                                submitLabel="Lagre og gå videre"
                                multiple
                                selectPartiton={useDefaultPartitions ? true : false}
                                createPartition={useDefaultPartitions ? false : true}
                                onSubmit={handlePrivateTokenTransferData}>
                                <Box gap="small">
                                    <Grid columns="1" fill="horizontal" gap="small">
                                        <Text size="small" weight="bold" truncate>
                                            Har selskapet aksjeklasser?
                                        </Text>
                                    </Grid>
                                    <Box gap="small" direction="row-responsive">
                                        <Button
                                            size="small"
                                            hoverIndicator={false}
                                            focusIndicator={false}
                                            label="Ja, legg til aksjeklasser"
                                            onClick={() => setUseDefaultPartitions(false)}
                                            style={{
                                                fontWeight: !useDefaultPartitions ? "bold" : "initial",
                                            }}></Button>
                                        <Button
                                            size="small"
                                            hoverIndicator={false}
                                            focusIndicator={false}
                                            label="Nei, selskapet har kun ordinære aksjer"
                                            onClick={() => setUseDefaultPartitions(true)}
                                            style={{
                                                fontWeight: useDefaultPartitions ? "bold" : "initial",
                                            }}></Button>
                                    </Box>
                                </Box>
                            </PrivateTokenTransferForm>
                    </Box>
                </AccordionPanel>


                {/* Confirm */}

                <AccordionPanel label="3. Bekreft" onClickCapture={() => setStep(STEP.CONFIRM)}>
                    <Box margin="small">
                        <Paragraph fill={true}>
                            Kun selskapets <strong>styreleder</strong> kan flytte aksjeeierboken til Brønnøysundregistrene Aksjeeierbok. Når selskapet
                            bruker denne løsningen, vil dette være en offisielle aksjeeierboken, og den tidligere aksjeeierboken selskapet er ikke
                            lengre gyldig.
                        </Paragraph>

                        <Paragraph fill={true}>
                            Aksjonærer i selskapet vil kunne sende aksjene sine til andre uten styrets samtykke, og aksjeeierboken vil automatisk
                            oppdateres fortløpende.
                        </Paragraph>

                        <Paragraph>
                            <Text weight="bold">Ved å fortsette, bekrefter du følgende:</Text>
                        </Paragraph>

                        <Paragraph fill={true}>
                            <Checkmark size="small"></Checkmark> Jeg er styreleder i selskapet jeg valgte i forrige steg.
                        </Paragraph>
                        <Paragraph fill={true}>
                            <Checkmark size="small"></Checkmark> Jeg er inneforstått med at løsningen ikke automatisk innrapporterer noe til offentlig
                            sektor, og at innrapportering forstatt må gjøres som før.
                        </Paragraph>
                        <Paragraph fill={true}>
                            <Checkmark size="small"></Checkmark> Jeg er inneforstått med at løsningen er i Brønnøysundregistrene Sandkasse, som betyr
                            at Brønnøysundregistrene kan slutte å drifte løsningen. Det vil da være mulig å laste need aksjeeierboken i csv-format.
                        </Paragraph>
                        <Paragraph fill={true}>
                            <Checkmark size="small"></Checkmark> Jeg er inneforstått med at løsningen er i Brønnøysundregistrene Sandkasse, som betyr
                            at det kan være feil i løsningen.
                        </Paragraph>
                        <Paragraph fill={true}>
                            <Checkmark size="small"></Checkmark> Jeg er inneforstått med at aksjeeierboken blir liggende offentlig tilgjengelig på
                            nett.
                        </Paragraph>

                        {/* <Paragraph fill>Det kreves {totalTransactions + 1} signereing for å opprette dette selskapet, utstede aksjene og godkjenne selskapet hos Brreg. Lommeboken vil forslå signering for deg.</Paragraph> */}
                    </Box>
                </AccordionPanel>

            </Accordion>

            <Button
                size="large"
                label={requireSigner ? "Koble til lommebok" : "Opprett aksjeeierbok"}
                disabled={step !== STEP.CONFIRM || !orgData || !privateTokenTransfers /* || deploying */}
                onClick={() => createCapTable()}>
            </Button>
            {deploying && (
                <Box align="center">
                    <Spinner></Spinner>
                </Box>
            )}

        </Box >
    )
}
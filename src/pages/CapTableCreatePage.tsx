import { Box, Button, Grid, Heading, Paragraph, Spinner, Text } from "grommet";
import { CaretDown, CaretUp, Checkmark } from "grommet-icons";
import React, { useCallback, useContext, useEffect, useState } from "react";
import { useHistory } from "react-router";
import { toast } from "react-toastify";
import { PrivateTokenTransferData, PrivateTokenTransferForm } from "../components/PrivateTokenTransferForm";
import { OrgData, SelectOrg } from "../components/SelectOrg";
import { BrokContext } from "../context/BrokContext";
import { SymfoniContext } from "../context/SymfoniContext";
import { useSignCreateCapTableVP } from "../hooks/useSignCreateCapTableVP";
var debug = require("debug")("page:createCapTable");

interface Props {}

enum STEP {
    SELECT_COMPANY = 0,
    ISSUE_SHARES = 1,
    CONFIRM = 2,
}

export const CapTableCreatePage: React.FC<Props> = ({ ...props }) => {
    const history = useHistory();
    const { signer } = useContext(SymfoniContext);
    const { signCreateCapTableVP } = useSignCreateCapTableVP();
    const { createCaptable } = useContext(BrokContext);
    const [step, setStep] = useState(STEP.SELECT_COMPANY); // TEST - ISSUE_SHARES
    const [orgData, setOrgData] = useState<OrgData>(); // TEST - DEFAULT_ORG_DATA[0]
    const [privateTokenTransfers, setPrivateTokenTransfers] = useState<PrivateTokenTransferData[]>();
    const [useDefaultPartitions, setUseDefaultPartitions] = useState(true);
    const [deploying, setDeploying] = useState(false);
    const [resetTokenTransferData, setResetTokenTransferData] = useState(0);

    const handleOrgData = useCallback(
        (data: OrgData) => {
            setResetTokenTransferData(resetTokenTransferData + 1);
            setStep(step + 1);
            setOrgData(data);
        },
        [resetTokenTransferData, step]
    );

    const handlePrivateTokenTransferData = useCallback(
        (data: PrivateTokenTransferData[]) => {
            setStep(step + 1);
            setPrivateTokenTransfers(data);
        },
        [step]
    );

    const signAndCreateCapTable = async () => {
        debug(`Started createCapTable, has request in signer ${signer && "request" in signer}`);

        // 0. Validate input
        if (!orgData) {
            return toast("Du må velge selskap først");
        }
        if (!privateTokenTransfers) {
            return toast("Du må sette aksjonærer først");
        }
        debug(`creating org`, orgData);
        debug(`creating privateTokenTransfers`, privateTokenTransfers);

        // 1. Sign
        setDeploying(true);
        const result = await signCreateCapTableVP(orgData, privateTokenTransfers);
        if (result.isErr()) {
            console.warn("signCreateCapTableVP(): result.isErr(): ", result.error);
            setDeploying(false);
            return;
        }
        const createCapTableVP = result.value[0].jwt;

        // 2. Create
        let createCapTableRespone;
        try {
            createCapTableRespone = await createCaptable(createCapTableVP);
        } catch (error: any) {
            if (error.isAxiosError) {
                if (error.response && error.response.data && "message" in error.response.data) {
                    toast(error.response.data.message);
                }
                debug("createCapTableRespone", error.response);
            }
            toast(error.message);
            return undefined;
        } finally {
            setDeploying(false);
        }

        // 3. Navigate
        debug("deployed contract", createCapTableRespone);
        if (createCapTableRespone?.data?.capTableAddress) {
            history.push("/captable/" + createCapTableRespone.data.capTableAddress);
        }
    };

    useEffect(() => {
        if (process.env.NODE_ENV !== "production") {
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

            {/* Select organization */}
            <Grid
                pad={{ vertical: "small" }}
                columns={["2/3", "1/3"]}
                onClickCapture={() => setStep(STEP.SELECT_COMPANY)}
                style={{ cursor: "pointer" }}>
                <Text>1. Velg selskap</Text>
                <Box align="end">{step === STEP.SELECT_COMPANY ? <CaretUp></CaretUp> : <CaretDown></CaretDown>}</Box>
            </Grid>
            <Box pad="small" style={{ display: step === STEP.SELECT_COMPANY ? "" : "none" }}>
                <SelectOrg onSubmit={(orgData) => handleOrgData(orgData)}></SelectOrg>
            </Box>
            {/* Token issue */}
            <Grid
                pad={{ vertical: "small" }}
                columns={["2/3", "1/3"]}
                onClickCapture={() => setStep(STEP.ISSUE_SHARES)}
                style={{ cursor: "pointer" }}>
                <Text>2. Utsted aksjer</Text>
                <Box align="end">{step === STEP.ISSUE_SHARES ? <CaretUp></CaretUp> : <CaretDown></CaretDown>}</Box>
            </Grid>
            <Box pad="medium" style={{ display: step === STEP.ISSUE_SHARES ? "" : "none" }}>
                <PrivateTokenTransferForm
                    submitLabel="Lagre og gå videre"
                    multiple
                    selectPartiton={useDefaultPartitions ? true : false}
                    createPartition={useDefaultPartitions ? false : true}
                    requiredTotal={orgData ? orgData.aksjer : undefined}
                    onSubmit={handlePrivateTokenTransferData}
                    resetForm={resetTokenTransferData}>
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

            {/* Confirm */}
            <Grid
                columns={["2/3", "1/3"]}
                pad={{ vertical: "small" }}
                onClickCapture={() => setStep(STEP.CONFIRM)}
                style={{ cursor: step === STEP.CONFIRM ? "inherit" : "pointer" }}>
                <Text>3. Bekreft</Text>
                <Box align="end">{step === STEP.ISSUE_SHARES ? <CaretUp></CaretUp> : <CaretDown></CaretDown>}</Box>
            </Grid>
            <Box margin="small" style={{ display: step === STEP.CONFIRM ? "" : "none" }}>
                <Paragraph fill={true}>
                    Kun selskapets <strong>styreleder</strong> kan flytte aksjeeierboken til Brønnøysundregistrene Aksjeeierbok. Når selskapet bruker
                    denne løsningen, vil dette være en offisielle aksjeeierboken, og den tidligere aksjeeierboken selskapet er ikke lengre gyldig.
                </Paragraph>

                <Paragraph fill={true}>
                    Aksjonærer i selskapet vil kunne sende aksjene sine til andre uten styrets samtykke, og aksjeeierboken vil automatisk oppdateres
                    fortløpende.
                </Paragraph>

                <Paragraph>
                    <Text weight="bold">Ved å fortsette, bekrefter du følgende:</Text>
                </Paragraph>

                <Paragraph fill={true}>
                    <Checkmark size="small"></Checkmark> Jeg er styreleder i selskapet jeg valgte i forrige steg.
                </Paragraph>
                <Paragraph fill={true}>
                    <Checkmark size="small"></Checkmark> Jeg er inneforstått med at løsningen ikke automatisk innrapporterer noe til offentlig sektor,
                    og at innrapportering forstatt må gjøres som før.
                </Paragraph>
                <Paragraph fill={true}>
                    <Checkmark size="small"></Checkmark> Jeg er inneforstått med at løsningen er i Brønnøysundregistrene Sandkasse, som betyr at
                    Brønnøysundregistrene kan slutte å drifte løsningen. Det vil da være mulig å laste need aksjeeierboken i csv-format.
                </Paragraph>
                <Paragraph fill={true}>
                    <Checkmark size="small"></Checkmark> Jeg er inneforstått med at løsningen er i Brønnøysundregistrene Sandkasse, som betyr at det
                    kan være feil i løsningen.
                </Paragraph>
                <Paragraph fill={true}>
                    <Checkmark size="small"></Checkmark> Jeg er inneforstått med at aksjeeierboken blir liggende offentlig tilgjengelig på nett.
                </Paragraph>

                {/* <Paragraph fill>Det kreves {totalTransactions + 1} signereing for å opprette dette selskapet, utstede aksjene og godkjenne selskapet hos Brreg. Lommeboken vil forslå signering for deg.</Paragraph> */}
            </Box>

            <Button
                size="large"
                label={"Opprett aksjeeierbok"}
                disabled={step !== STEP.CONFIRM || !orgData || !privateTokenTransfers /* || deploying */}
                onClick={() => signAndCreateCapTable()}></Button>
            {deploying && (
                <Box align="center">
                    <Spinner></Spinner>
                </Box>
            )}
        </Box>
    );
};

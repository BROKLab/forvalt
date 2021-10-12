import { AxiosError } from "axios";
import { normalizePresentation } from "did-jwt-vc";
import { ethers } from "ethers";
import { Accordion, AccordionPanel, Box, Button, Grid, Heading, Paragraph, Text } from "grommet";
import { Checkmark } from "grommet-icons";
import { validateNorwegianIdNumber } from "norwegian-national-id-validator";
import React, { useCallback, useContext, useEffect, useState } from "react";
import { useHistory } from "react-router-dom";
import { OrgData, SelectOrg } from "../components/CapTable/SelectOrg";
import { PrivateUserData, SelectPrivateUser } from "../components/SelectPrivateUser";
import { Loading } from "../components/ui/Loading";
import { captableApprove, unclaimedCreate } from "../domain/BrokHelpers";
import { CapTableFactoryContext, SymfoniContext } from "../hardhat/ForvaltContext";
import { SignatureRequest } from "../utils/SignerRequestHandler";

interface Props {}

enum STEP {
    SELECT_COMPANY = 0,
    ISSUE_SHARES = 1,
    CONFIRM = 2,
}

const TESTING = true;

export const CapTableCreatePage: React.FC<Props> = ({ ...props }) => {
    const { init, signer, signatureRequestHandler } = useContext(SymfoniContext);
    const [step, setStep] = useState(STEP.SELECT_COMPANY); // TEST - ISSUE_SHARES
    const [deploying, setDeploying] = useState(false);
    const [orgData, setOrgData] = useState<OrgData>(); // TEST - DEFAULT_ORG_DATA[0]
    const [batchIssueData, setBatchIssueData] = useState<PrivateUserData[]>();
    const capTableFactory = useContext(CapTableFactoryContext);
    const [useDefaultPartitions, setUseDefaultPartitions] = useState(true);

    const history = useHistory();

    const handleOrgData = useCallback(
        (data: OrgData) => {
            setStep(step + 1);
            setOrgData(data);
        },
        [step]
    );

    const handleBatchIssueData = useCallback(
        (data: PrivateUserData[]) => {
            setStep(step + 1);
            setBatchIssueData(data);
        },
        [step]
    );
    useEffect(() => {
        if (!signer) {
            init({ forceSigner: true });
        }
    }, [init, signer]);

    const resolveIdentifierToAddress = async (params: {
        name: string;
        streetAddress: string;
        postalcode: string;
        email: string;
        identifier: string;
        orgnr: string;
        amount: string;
        partition: string;
    }) => {
        if (!signer || !("request" in signer)) throw Error("Must have a signer resolve address from identifier");
        const BROK_HELPERS_VERIFIER = process.env.REACT_APP_BROK_HELPERS_VERIFIER;

        const verifier = BROK_HELPERS_VERIFIER;
        const method = "did_createVerifiableCredential";
        const payload = {
            name: params.name,
            streetAddress: params.streetAddress,
            postalcode: params.postalcode,
            email: params.email,
            identifier: params.identifier,
            orgnr: params.orgnr,
            amount: params.amount,
            partition: params.partition,
        };

        const request: SignatureRequest = {
            message: "Godkjenn privat aksjeutstedelse via Brønnøysundregistrene",
            fn: async () =>
                await signer.request(method, [
                    {
                        verifier: verifier,
                        payload: payload,
                    },
                ]),
        };

        if (!signatureRequestHandler) throw Error("TODO: Create error");
        signatureRequestHandler.add([request]);
        let result;
        try {
            const results = (await signatureRequestHandler.results()) as string[];
            result = results[0];
        } catch (e: any) {
            console.log("[ERROR] resolveIdentifierToAddress", e);
            throw e;
        }
        console.log("resultt", result);

        const res = await unclaimedCreate(result).catch((error: AxiosError<{ message: string; code: number }>) => {
            if (error.response && error.response.data.message) {
                throw Error(error.response.data.message);
            }
            throw Error(error.message);
        });
        console.log("unclaimed create res", res);
        if (!res.data.blockchainAccount) {
            throw Error("/brreg/unclaimed/create should return a blockchainAccount ");
        }
        return res.data.blockchainAccount;
    };

    const deploy = async () => {
        if (!signer) return init({ forceSigner: true });
        if (!capTableFactory.instance) {
            throw Error("CapTable Factory not initialized");
        }
        if (!orgData) {
            throw Error("Du må velge selskap først");
        }
        if (!batchIssueData) {
            throw Error;
        }
        setDeploying(true);
        console.log("batchIssueData", batchIssueData);
        const resolvedFieldPromises = batchIssueData.map(async (field) => {
            if (field.identifier.substr(0, 2) === "0x") {
                if (ethers.utils.isAddress(field.identifier)) {
                    return { ...field, address: field.identifier };
                }
            }
            if (validateNorwegianIdNumber(field.identifier)) {
                const address = await resolveIdentifierToAddress({
                    email: field.name,
                    identifier: field.identifier,
                    name: field.name,
                    postalcode: field.postalcode,
                    streetAddress: field.streetAddress,
                    amount: field.amount,
                    partition: field.partition,
                    orgnr: orgData.orgnr.toString(),
                });

                return { ...field, address: address };
            }
            throw Error("Identifier was not Norwegian ID number or an Ethereum address");
        });
        const resolvedFields = await Promise.all(resolvedFieldPromises);

        let deployedContract: string | undefined;
        const request: SignatureRequest = {
            message: "Bekreft migrering av aksjeeierboken",
            fn: async () => {
                if (!capTableFactory.instance) {
                    throw Error("CapTable Factory not initialized");
                }
                const deployTx = await capTableFactory.instance.createCapTable(
                    ethers.utils.formatBytes32String(orgData.orgnr.toString()),
                    orgData.navn,
                    orgData.navn.substr(0, 3),
                    resolvedFields.map((a) => a.address),
                    resolvedFields.map((a) => ethers.utils.parseEther(a.amount))
                );
                await deployTx.wait();
            },
        };

        signatureRequestHandler.add([request]);
        let results;
        try {
            results = await signatureRequestHandler.results();
        } catch (e: any) {
            console.log("CaptableCreatePage error =", e);
            setDeploying(false);
            return;
        }

        console.log("CaptableCreatePage deployContract request result", request);

        try {
            deployedContract = await capTableFactory.instance.getLastQuedAddress(ethers.utils.formatBytes32String(orgData.orgnr.toString()));
        } catch (error) {
            throw Error("Could not getLastQuedAddress on uuid " + orgData.orgnr.toString());
        }
        // Approve capTable
        const BROK_HELPERS_VERIFIER = process.env.REACT_APP_BROK_HELPERS_VERIFIER;

        if ("request" in signer) {
            const request: SignatureRequest = {
                message: "Bekreft at du er styreleder",
                fn: async () => {
                    const jwt = await signer.request("did_requestVerifiableCredential", [
                        {
                            type: "CapTableBoardDirector",
                            orgnr: orgData.orgnr.toString(),
                            verifier: BROK_HELPERS_VERIFIER,
                        },
                    ]);
                    console.log("test", normalizePresentation(jwt));
                    const res = captableApprove(jwt, deployedContract!, true);
                    console.log("RESPONSE brreg/captable/approve: ", res);
                },
            };
            // TODO GJør om flyt etter Brokhelpers rewrite. Nå throwes det error om bruker rejecter
            signatureRequestHandler.add([request]);
            const results = await signatureRequestHandler.results();
            console.log("CaptableCreatePage did_requestVerifiableCredential request result", results);
        }
        setDeploying(false);
        history.push("/");
        if (deployedContract) {
            history.push("/captable/" + deployedContract);
        }
    };

    return (
        <Box gap="small">
            <Heading>Opprett aksjeeierbok</Heading>
            {!signer && (
                <Box>
                    <Text>Du må koble til med en signer</Text>
                </Box>
            )}
            <Accordion justify="start" activeIndex={step} gap="small">
                <AccordionPanel label="1. Velg selskap" onClickCapture={() => setStep(STEP.SELECT_COMPANY)}>
                    <Box pad="small">
                        <SelectOrg aggragateResult={(orgData) => handleOrgData(orgData)}></SelectOrg>
                    </Box>
                </AccordionPanel>
                <AccordionPanel label="2. Utsted aksjer" onClickCapture={() => setStep(STEP.ISSUE_SHARES)}>
                    <Box pad="medium">
                        {orgData ? (
                            <SelectPrivateUser
                                onSubmitButtonProps={{
                                    label: "Lagre og gå videre",
                                }}
                                multiple
                                selectPartiton={useDefaultPartitions ? true : false}
                                createPartition={useDefaultPartitions ? false : true}
                                onSubmit={handleBatchIssueData}>
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
                            </SelectPrivateUser>
                        ) : (
                            <Paragraph fill>Vennligst velg en aksjeeierbok</Paragraph>
                        )}
                    </Box>
                </AccordionPanel>
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
                label="Opprett aksjeeierbok"
                disabled={step !== STEP.CONFIRM || !orgData || !batchIssueData /* || deploying */}
                onClick={() => deploy()}></Button>
            {deploying && (
                <Box align="center">
                    <Loading size={50}></Loading>
                </Box>
            )}
        </Box>
    );
};

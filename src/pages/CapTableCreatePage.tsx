import { ethers } from 'ethers';
import { Accordion, AccordionPanel, Box, Button, Heading, Paragraph, Text } from 'grommet';
import { Checkmark } from 'grommet-icons';
import React, { useContext, useEffect, useState } from 'react';
import { useHistory } from 'react-router-dom';
import { BatchIssue } from '../components/CapTable/BatchIssue';
import { CapTableCreate } from '../components/CapTable/CapTableCreate';
import { Loading } from '../components/ui/Loading';
import { ERC1400Context, SymfoniContext } from '../hardhat/ForvaltContext';
import { ERC1400 } from '../hardhat/typechain/ERC1400';
import { Transaction } from '../utils/ethers-helpers';

interface Props {
}

enum STEP {
    SELECT_COMPANY = 0,
    ISSUE_SHARES = 1,
    CONFIRM = 2
}

export const CapTableCreatePage: React.FC<Props> = ({ ...props }) => {
    const { init, signer } = useContext(SymfoniContext)
    const [step, setStep] = useState(STEP.SELECT_COMPANY);
    const [transactions, setTransactions] = useState<{ [step in STEP]: Transaction[] }>({
        0: [],
        1: [],
        2: []
    });
    const totalTransactions = Object.values(transactions).flat(1).length
    const [capTableAddress, setCapTableAddress] = useState(ethers.constants.AddressZero);
    const erc1400 = useContext(ERC1400Context)
    const [capTable, setCapTable] = useState<ERC1400>();
    const [deploying, setDeploying] = useState(false);

    const history = useHistory()

    const handleCapTableTransactions = async (capTableAddress: string, txs: Transaction[]) => {
        setCapTableAddress(capTableAddress)
        setCapTable(erc1400.connect(capTableAddress))
        handleTransactions(txs, STEP.SELECT_COMPANY)
    }
    const handleTransactions = async (txs: Transaction[], step: STEP) => {
        setStep(step + 1)
        setTransactions(old => ({ ...old, [step]: [...txs] }))
    }
    useEffect(() => {
        if (!signer) {
            init({ forceSigner: true })
        }
    }, [])

    const deploy = async () => {
        if (!signer) return init({ forceSigner: true })
        setDeploying(true)
        let deployedContract: string | undefined = undefined
        await Object.values(transactions).reduce(async (prev, txs) => {
            await prev
            for (const tx of txs) {
                const txRes = await signer.sendTransaction(tx)
                const receipt = await txRes.wait()
                if (receipt.contractAddress) {
                    deployedContract = receipt.contractAddress
                }
            }
            return Promise.resolve()
        }, Promise.resolve())
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
                        <CapTableCreate capTableTransactions={handleCapTableTransactions}></CapTableCreate>
                    </Box>
                </AccordionPanel>
                <AccordionPanel label="2. Utsted aksjer" onClickCapture={() => setStep(STEP.ISSUE_SHARES)}>
                    <Box pad="medium">
                        {capTable
                            ? <BatchIssue transactions={(txs) => handleTransactions(txs, STEP.ISSUE_SHARES)} capTable={capTable}></BatchIssue>
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

                        <Paragraph fill>Det kreves {totalTransactions} signereing for å opprette dette selskapet og utstede aksjene. Metamask vil forslå signering for deg.</Paragraph>
                    </Box>
                </AccordionPanel>
            </Accordion>
            <Button size="large" label="Opprett aksjeeierbok" disabled={step !== STEP.CONFIRM || transactions[0].length !== 2 || deploying} onClick={() => deploy()}></Button>
            {deploying &&
                <Box align="center" >
                    <Loading size={50}></Loading>

                </Box>
            }
        </Box >
    )
}
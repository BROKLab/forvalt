import { Accordion, AccordionPanel, Anchor, Box, Button, Grid, Heading, Image, Paragraph, Text } from 'grommet';
import { Checkmark, CircleQuestion } from 'grommet-icons';
import React, { useContext, useState } from 'react';
import { Route, Switch, useHistory, useRouteMatch } from 'react-router-dom';
import { CopyText } from '../components/ui/CopyText';
import { SymfoniContext } from '../hardhat/ForvaltContext';


interface Props {
}

interface RouteParams {
    address: string
}
export const AccountPage: React.FC<Props> = ({ ...props }) => {
    const { path } = useRouteMatch()
    const history = useHistory()
    const [hasProvider, setHasProvider] = useState(false);
    const [hasAccount, setHasAccount] = useState(false);
    const [hasChainId, setHasChainId] = useState(false);
    const { init } = useContext(SymfoniContext)
    const ready = hasProvider && hasAccount && hasChainId
    const checkAll = () => {
        checkProvider()
        checkWallet()
        checkChainId()
    }

    const checkProvider = async () => {
        if ("ethereum" in window) {
            setHasProvider(true)
        }
    }

    const checkWallet = async () => {
        if ("ethereum" in window) {

        }
    }
    const checkChainId = async () => {
        if ("ethereum" in window) {

        }
    }

    const handleCheckAll = async () => {
        if (ready) {
            init()
            ready ? history.push("/register/list") : checkAll()
        }
    }

    return (
        <Box>
            <Switch>
                <Route path={`${path}/onboard`} exact={true}>
                    <Heading level="2">Kom igang</Heading>
                    <Box>
                        <Accordion animate={true} multiple={false} gap="medium" >

                            <AccordionPanel label={<Text weight="bold" margin="small" size="large">Sette opp digital lommebok <span role="img" aria-label="fox">🦊</span></Text>} >
                                <Box margin={{ left: "large" }} pad="small" gap="small" >

                                    <Paragraph fill>1. Installer <Anchor href="https://metamask.io/download.html" target="_blank" label="Metamask"></Anchor></Paragraph>
                                    <Button reverse={true} icon={hasProvider ? <Checkmark></Checkmark> : <CircleQuestion></CircleQuestion>} label={hasProvider ? "Du har en Metamask" : "Test om du har Metamask"} onClick={() => checkProvider()}></Button>
                                    <Paragraph fill>2. Metamask-oppsettet åpner en nettside. Velg «Kom i gang»</Paragraph>
                                    <Image style={{ maxHeight: "200px" }} alignSelf="start" src={require("./../assets/metamask/getStarted.png")} fit="contain"></Image>
                                    <Paragraph fill>3. Velg «Opprett en lommebok»</Paragraph>
                                    <Image style={{ maxHeight: "200px" }} alignSelf="start" src={require("./../assets/metamask/createWallet.png")} fit="contain"></Image>
                                    <Paragraph fill>4. Velg om du vil dele data med Metamask eller ikke</Paragraph>
                                    <Paragraph fill>5. Sett et passord, godkjenn brukervilkårene og velg «Opprett»</Paragraph>
                                    <Paragraph fill>6. Ta vare på den hemmelige sikkerhetskopifrasen. Dette er ikke essensielt nå siden dette er en prototype. Man står ikke i reel fare for å miste tilgangen til noe.</Paragraph>
                                    <Paragraph fill>7. Sjekk om du har en lommebok, en vindu vil poppe opp fra Metamask hvor du kan gi applikasjonen tilgang til å lese offentlig addresse til lommeboken.</Paragraph>
                                    <Image style={{ maxHeight: "200px" }} alignSelf="start" src={require("./../assets/metamask/connect.png")} fit="contain"></Image>
                                    <Button reverse={true} icon={hasAccount ? <Checkmark></Checkmark> : <CircleQuestion></CircleQuestion>} label={hasAccount ? "Du har en lommebok" : "Test om du har lommebok"} onClick={() => checkWallet()}></Button>
                                </Box>
                            </AccordionPanel>

                            <AccordionPanel label={<Text weight="bold" margin="small" size="large">Koble til Brønnøysundregistrene nettverket <span role="img" aria-label="network">🕸</span></Text>}>
                                <Box margin={{ left: "large" }} pad="small" gap="small" >
                                    <Paragraph fill>Metamask er i utgangspunktet koblet til «Offentlig Ethereum». Her må man ha kryptovalutaen «ether» for å operere. Brønnøysundregistrene blokkjedeløsning kjører ikke på offentlig Ethereum, men på en egen kjede sammen med andre.</Paragraph>
                                    <Paragraph fill>1. Klikk på «Ethereum hovednettverk»</Paragraph>
                                    <Image style={{ maxHeight: "200px" }} alignSelf="start" src={require("./../assets/metamask/rpcMainnet.png")} fit="contain"></Image>
                                    <Paragraph fill>2. Velg «Tilpasset RPC»</Paragraph>
                                    <Image style={{ maxHeight: "200px" }} alignSelf="start" src={require("./../assets/metamask/customRpc.png")} fit="contain"></Image>
                                    <Paragraph fill>3. Fyll inn</Paragraph>
                                    <Grid margin={{ left: "medium" }} columns={["small", "flex"]} gap="small">
                                        <Text>Nettverksnavn:</Text>
                                        <CopyText text="Brreg"></CopyText>
                                        <Text>NY RPC-URL:</Text>
                                        <CopyText text="https://e0cteq8qnh:IY2scS2ywMZkinR5m4sS7GBs7EDgm4Mh9F1uUVkmKFI@e0qchlost7-e0zi3w4q2r-rpc.de0-aws.kaleido.io"></CopyText>
                                        <Text>Blokkjede:</Text>
                                        <CopyText text="55577"></CopyText>
                                    </Grid>
                                    <Text>Velg lagre</Text>
                                    <Button reverse={true} icon={hasChainId ? <Checkmark></Checkmark> : <CircleQuestion></CircleQuestion>} label={hasChainId ? "Du er på riktig nettverk" : "Test om du er på riktig nettverk"} onClick={() => checkChainId()}></Button>
                                </Box>
                            </AccordionPanel>

                            <AccordionPanel label={<Text weight="bold" margin="small" size="large">Autentiser deg <span role="img" aria-label="user">👤</span></Text>}>
                                <Box margin={{ left: "large" }} pad="small" gap="small" >
                                    <Paragraph fill>Bruk en autentiserings tjeneste for å koble lommeboken din mot en fysisk person. Kun autentiseringstjenesten vil kunne se denne informasjonen. Det vil være synlig for andre at addressen til lommeboken din er autentisert, men ikke av hvem.</Paragraph>
                                    <Button size="small" target="_blank" href="https://brreg1.gitlab.io/auth-contracts/" label="Koble til BankID"></Button>
                                    {/* <Button reverse={true} icon={hasChainId ? <Checkmark></Checkmark> : <CircleQuestion></CircleQuestion>} label={hasChainId ? "Du er på riktig nettverk" : "Test om du er på riktig nettverk"} onClick={() => checkChainId()}></Button> */}
                                </Box>
                            </AccordionPanel>

                            <Button size="large" icon={ready ? <Checkmark></Checkmark> : <CircleQuestion></CircleQuestion>} label={ready ? "Du er klar, klikk igjen for gå til Aksjeeierboken" : "Test om alt er riktig"} onClick={() => handleCheckAll()} ></Button>

                        </Accordion>
                    </Box>
                </Route>
            </Switch>
        </Box >
    )
}
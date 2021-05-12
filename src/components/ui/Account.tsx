

import { Anchor, Box, Button, DropButton, Grid, Image, Paragraph, Select, Text } from 'grommet';
import { User } from 'grommet-icons';
import React, { useContext, useState } from 'react';
import { Link } from 'react-router-dom';
import { SymfoniContext } from '../../hardhat/ForvaltContext';
import { AuthContext } from '../../utils/AuthContext';
import { Modal } from './Modal';

interface Props { }

const SHOW_PROVIDER_SWITCH = localStorage.getItem("PROVIDER_SWITCH") === "true" /* || process.env.NODE_ENV === "development" ? "true" : "false" */
export const Account: React.FC<Props> = () => {


    const { init, selectedProvider, providers, loading, address } = useContext(SymfoniContext)
    const [newProvider, setNewProvider] = useState();
    const { user, logOut } = useContext(AuthContext)

    // fund account

    const [showDisconnect, setShowDisconnect] = useState(false);
    return (
        <Box pad="small">
            {SHOW_PROVIDER_SWITCH &&
                <Box>
                    <Grid gap="small" columns={["auto", "flex"]}>
                        <Select
                            options={providers}
                            size="small"
                            value={newProvider}
                            onChange={(option) => { setNewProvider(option.value) }}
                        ></Select>
                        <Button hoverIndicator focusIndicator={false} disabled={loading || newProvider === selectedProvider} size="small" label={newProvider ? "Connect " + newProvider : "Connect"} onClick={() => init({ provider: newProvider })}></Button>
                    </Grid>
                    <Box alignContent="end" gap="small">
                        {address &&
                            <Text size="small" >Connected to: {selectedProvider} with: {address.substr(0, 5) + ".." + address.substring(address.length - 2, address.length)}</Text>
                        }
                        {!address &&
                            <Text size="small">Ikke tilkoblet</Text>
                        }
                    </Box>
                    <Button label="Signer" onClick={() => init({ forceSigner: true })}></Button>
                </Box>
            }
            {
                !SHOW_PROVIDER_SWITCH &&
                <Box align="center">
                    {!user && (
                        <Link to="/account/onboard">
                            <Button size="small" label="Logg inn" hoverIndicator focusIndicator={false} />
                        </Link>
                    )}
                    {user && (
                        <Box pad="small">

                            <DropButton
                                label={user ? user.name : address ? `${address.substr(0, 4)}..` : "Fant ingen"}
                                icon={<User></User>}
                                size="medium"
                                reverse={true}
                                dropAlign={{ top: 'bottom', right: 'right' }}
                                dropContent={
                                    <Box pad="small" elevation="large" align="start">
                                        {logOut &&
                                            <Anchor label="Log ut" onClick={() => logOut()}></Anchor>
                                        }
                                    </Box>
                                }
                            />
                        </Box>
                        // <Grid columns={["flex", "flex"]} gap="small">
                        //     <Box border="all" alignContent="end" round={"full"}>

                        //     </Box>
                        //     {/* <Button size="small" icon={<User></User>} label={`${address.substr(0, 4)}..`} hoverIndicator={false} style={{ cursor: "not-allowed" }}></Button>
                        //     <Button size="small" label={"Logg ut"} onClick={() => setShowDisconnect(true)}></Button> */}
                        // </Grid>
                    )}
                </Box>
            }
            <Modal setShow={setShowDisconnect} show={showDisconnect}>
                <Box margin="small">
                    <Paragraph fill>Gå inn i Metamask.</Paragraph>
                    <Paragraph fill>Klikk på der det står tilkoblet</Paragraph>
                    <Paragraph fill>Koble fra den addressen du ønsker</Paragraph>
                    <Image style={{ maxHeight: "300px" }} alignSelf="center" src={require("./../../assets/metamask/disconnect.png")} fit="contain"></Image>
                </Box>
            </Modal>
        </Box >
    )
}
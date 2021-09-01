

import { Box, Button, Grid, Image, Paragraph, Select, Text } from 'grommet';
import React, { useContext, useState } from 'react';
import { SymfoniContext } from '../../hardhat/ForvaltContext';
import { Modal } from './Modal';

interface Props {}

const SHOW_PROVIDER_SWITCH = localStorage.getItem("PROVIDER_SWITCH") === "true" /* || process.env.NODE_ENV === "development" ? "true" : "false" */
export const Account: React.FC<Props> = () => {


    const { init, selectedProvider, providers, loading, address } = useContext(SymfoniContext)
    const [newProvider, setNewProvider] = useState();

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
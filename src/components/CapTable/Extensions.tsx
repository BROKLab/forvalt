import { ethers } from 'ethers';
import { Box, Button, Card, CardBody, CardFooter, Heading, Paragraph, Text } from 'grommet';
import { UserPolice } from 'grommet-icons';
import React, { useContext, useEffect } from 'react';
import { ERC1400AuthValidatorContext, ERC1820RegistryContext } from '../../hardhat/ForvaltContext';
import { ERC1400 } from '../../hardhat/typechain/ERC1400';

interface Props {
    capTable: ERC1400
    done?: () => void
}
const ERC820_ADDRESS = "0x1820a4B7618BdE71Dce8cdc73aAB6C95905faD24";

export const Extensions: React.FC<Props> = ({ ...props }) => {

    const erc1820 = useContext(ERC1820RegistryContext).instance?.attach(ERC820_ADDRESS)
    const authValidator = useContext(ERC1400AuthValidatorContext)


    // Get partitions
    useEffect(() => {
        let subscribed = true
        const doAsync = async () => {
            if (erc1820) {
                const tokenValidator = await erc1820.getInterfaceImplementer(props.capTable.address, ethers.utils.id("ERC1400TokensValidator"))
                if (subscribed) {

                    console.log("Manager", tokenValidator)
                }
            }

        };
        doAsync();
        return () => { subscribed = false }
    }, [props.capTable, erc1820])


    const addAuthValidator = async () => {
        if (props.capTable && authValidator.factory) {
            const authProviderAddress = process.env.REACT_APP_AUTH_PROVIDER_ADDRESS;
            let authValidatorAddress = process.env.REACT_APP_AUTH_VALIDATOR_ADDRESS;
            if (!authValidatorAddress) {
                if (!authProviderAddress) {
                    throw Error("Please set REACT_APP_AUTH_PROVIDER_ADDRESS or predeployed REACT_APP_AUTH_VALIDATOR_ADDRESS in .env file")
                }
                const _authValidator = await authValidator.factory.deploy(authProviderAddress)
                await _authValidator.deployed()
                authValidatorAddress = _authValidator.address;
            }
            const tx = await props.capTable.setTokenExtension(authValidatorAddress, "ERC1400TokensValidator", false, false, false)
            await tx.wait()
        }
    }


    return (
        <Box gap="small">
            <Heading level={3}>Utvidelser</Heading>
            <Box margin="small">
                <Box border="all" round={false} gap="small" pad="small">
                    <Box direction="row" gap="small">
                        <UserPolice></UserPolice>
                        <Box>
                            <Text weight="bold">Autentiserings validator</Text>
                            <Paragraph>Sjekker at alle mottakere av alle utstedelser og overføringer har vært autentisert det siste året.</Paragraph>
                        </Box>
                    </Box>
                    <Box align="end">
                        <Button size="small" label="Installer" onClick={() => addAuthValidator()}></Button>
                    </Box>
                </Box>
                <Card>
                    <CardBody>
                        <Box direction="row" pad="small" gap="small">



                        </Box>
                    </CardBody>
                    <CardFooter>

                    </CardFooter>
                </Card>

            </Box>


        </Box>
    )
}
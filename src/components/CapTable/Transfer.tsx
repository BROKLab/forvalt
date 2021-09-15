import { ERC1400 } from '@brok/captable-contracts';
import axios, { AxiosError } from 'axios';
import { ethers } from 'ethers';
import { Box, Text } from 'grommet';
import React, { useContext } from 'react';
import { CapTableRegistryContext, SymfoniContext } from '../../hardhat/ForvaltContext';
import { PrivateUserData, SelectPrivateUser } from '../SelectPrivateUser';

interface Props {
    capTable: ERC1400
    done?: () => void
}


export const Transfer: React.FC<Props> = ({ ...props }) => {
    const registry = useContext(CapTableRegistryContext)
    const { init, signer } = useContext(SymfoniContext)


    const resolvePrivateAddress = async (privateUserData: PrivateUserData) => {

        if (!signer || !("request" in signer)) throw Error("Cant resolve private address with request in signer")
        const BROK_HELPERS_URL = process.env.REACT_APP_BROK_HELPERS_URL
        const BROK_HELPERS_VERIFIER = process.env.REACT_APP_BROK_HELPERS_VERIFIER
        if (!BROK_HELPERS_URL || !BROK_HELPERS_VERIFIER) throw Error("BROK_HELPERS_URL and BROK_HELPERS_VERIFIER must be decleared in enviroment")
        if (!registry.instance) throw Error("Not cap table registry instance")
        let orgnr: string | undefined = undefined
        try {
            const orgnrBytes32 = await registry.instance.getid(props.capTable.address)
            orgnr = ethers.utils.parseBytes32String(orgnrBytes32)

        } catch (error) {
            console.error("Could not resolve orgnr")
            throw error
        }
        const vpJWT = await signer.request("did_createVerifiableCredential", [{
            verifier: BROK_HELPERS_VERIFIER,
            payload: {
                name: privateUserData.name,
                streetAddress: privateUserData.streetAddress,
                postalcode: privateUserData.postalcode,
                email: privateUserData.email,
                identifier: privateUserData.identifier,
                orgnr: orgnr,
                amount: privateUserData.amount,
                partition: privateUserData.partition
            }
        }])
        const res = await axios
            .post<{ blockchainAccount: string }>(
                `${true ? "http://localhost:3004" : BROK_HELPERS_URL
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
    const transfer = async (privateUserData: PrivateUserData) => {
        if (!signer)
            return init()

        const address = ethers.utils.isAddress(privateUserData.address) ? privateUserData.address : await resolvePrivateAddress(privateUserData)

        const amountEther = ethers.utils.parseEther(privateUserData.amount.toString())
        if (amountEther === ethers.constants.Zero) return alert("Kan ikke overføre 0 beløp")
        const tx = await props.capTable.transferByPartition(privateUserData.partition, address, amountEther, "0x11",)
        await tx.wait()


        if (props.done) {
            props.done()
        }


        if (props.done) props.done()
    }

    return (
        <Box gap="small">
            <Text>Overfør aksjer til: </Text>
            <SelectPrivateUser onSubmit={transfer} onSubmitButtonProps={{ label: "Overfør" }}></SelectPrivateUser>

        </Box>
    )
}
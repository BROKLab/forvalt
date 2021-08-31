import axios, { AxiosError } from 'axios';
import { ethers } from 'ethers';
import { Button, TextInput } from 'grommet';
import { validateNorwegianIdNumber } from 'norwegian-national-id-validator';
import React, { useContext, useEffect, useState } from 'react';
import { SymfoniContext } from '../../hardhat/ForvaltContext';


interface Props {
    onChange: (...event: any[]) => void,
    value: string,
    orgNr: string,
}

enum IDENTIFIER {
    DEFAULT,
    ADDRESS,
    UUID,
}

export const SelectUser: React.FC<Props> = ({ ...props }) => {

    const [identifier, setIdentifier] = useState(IDENTIFIER.DEFAULT);
    const [userInput, setUserInput] = useState(props.value);
    const [address, setAddress] = useState<string | null>("");
    const [name, setName] = useState<string>("");
    const [streetAddress, setStreetAddress] = useState("");
    const [postalcode, setPostalcode] = useState("");
    const [email, setEmail] = useState("");
    const { signer } = useContext(SymfoniContext)


    useEffect(() => {
        props.onChange(address)
        // eslint-disable-next-line
    }, [address])


    useEffect(() => {
        const input = userInput.toLowerCase()
        if (input.substr(0, 2) === "0x") {
            if (ethers.utils.isAddress(input)) {
                setAddress(input)
                setIdentifier(IDENTIFIER.ADDRESS)
                return
            }
        }
        if (validateNorwegianIdNumber(input)) {
            setAddress(null)
            setName("")
            setIdentifier(IDENTIFIER.UUID)
            return
        }
        setAddress(null)
        setName("")
        return setIdentifier(IDENTIFIER.DEFAULT)
        // eslint-disable-next-line
    }, [userInput])

    const resolve = async () => {
        if (!signer || !("request" in signer)) throw Error("Must have a signer resolve address from identifier")
        const BROK_HELPERS_URL = process.env.REACT_APP_BROK_HELPERS_URL
        const BROK_HELPERS_VERIFIER = process.env.REACT_APP_BROK_HELPERS_VERIFIER
        if (!BROK_HELPERS_URL || !BROK_HELPERS_VERIFIER) throw Error("BROK_HELPERS_URL and BROK_HELPERS_VERIFIER must be decleared in enviroment")
        if (identifier !== IDENTIFIER.UUID) throw Error("Can only resolve identfiers")
        const vpJWT = await signer.request("did_createVerifiableCredential", [{
            verifier: BROK_HELPERS_VERIFIER,
            payload: {
                name,
                streetAddress,
                postalcode,
                email,
                identifier: userInput,
                orgnr: props.orgNr,
            }
        }])
        console.log("vpJWT", vpJWT)
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
        setAddress(res.data.blockchainAccount)

        if (address !== null) {
            setName("")
            setAddress(null)
        }
    }

    return (
        <>
            <TextInput size="small" onChange={(e) => setUserInput(e.target.value)} placeholder="Fødselsnummer" value={userInput} />
            <TextInput size="small" onChange={(e) => setName(e.target.value)} value={name} placeholder="Navn" disabled={identifier === IDENTIFIER.ADDRESS}></TextInput>
            <TextInput size="small" onChange={(e) => setStreetAddress(e.target.value)} placeholder="Veiadresse" value={streetAddress} disabled={identifier === IDENTIFIER.ADDRESS} />
            <TextInput size="small" onChange={(e) => setPostalcode(e.target.value)} placeholder="Postnummer" value={postalcode} disabled={identifier === IDENTIFIER.ADDRESS} />
            <TextInput size="small" onChange={(e) => setEmail(e.target.value)} placeholder="Epost" value={email} disabled={identifier === IDENTIFIER.ADDRESS} />
            <Button color="black" style={{ borderRadius: "0px", border: "2px" }} size="small" onClick={() => resolve()}>Kontroll</Button>
        </>
    )
}
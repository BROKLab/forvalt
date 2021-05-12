import { ethers } from 'ethers';
import { Box, Button, Grid, Text, TextInput } from 'grommet';
import { Checkmark, Close, Lock, Unlock, Waypoint } from 'grommet-icons';
import { validateNorwegianIdNumber } from 'norwegian-national-id-validator';
import React, { useContext, useEffect, useState } from 'react';
import { AuthContext } from '../../utils/AuthContext';


interface Props {
    onChange: (...event: any[]) => void
    value: string,
    capTableAddress: string,
    protocol: string
}

enum IDENTIFIER {
    DEFAULT,
    ADDRESS,
    UUID,
}

export const SelectUser: React.FC<Props> = ({ ...props }) => {

    const [identifier, setIdentifier] = useState(IDENTIFIER.DEFAULT);
    const [searchInput, setSearchInput] = useState(props.value);
    const [address, setAddress] = useState<string | null>("");
    const [name, setName] = useState<string>("");
    const { user, resolveAddressOrUUID } = useContext(AuthContext)


    useEffect(() => {
        props.onChange(address)
        // eslint-disable-next-line
    }, [address])


    useEffect(() => {
        const input = searchInput.toLowerCase()
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
    }, [searchInput])

    const indetifierLabel = () => {
        switch (identifier) {
            case IDENTIFIER.ADDRESS: {
                return "addresse"
            }
            case IDENTIFIER.UUID: {
                return "fødselsnummer"
            }
            case IDENTIFIER.DEFAULT: {
                return "ukjent"
            }
        }
    }
    const resolveUuidAndName = async () => {
        if (!resolveAddressOrUUID) {
            throw Error("AuthContext not ready")
        }
        console.log(address)
        if (address !== null) {
            setName("")
            setAddress(null)
        } else {
            const address = await resolveAddressOrUUID(props.capTableAddress, props.protocol, searchInput, name)
            setAddress(address)
        }
    }


    const acceptedName = () => {
        // TODO Maybe there is a better way to determine accepted name, then just length of 3.
        return name.length > 2
    }

    const validAddress = () => {
        return address !== null && address !== ""
    }

    const nameResolvedIcon = () => {
        let color = acceptedName() ? "orange" : "red"
        color = validAddress() ? "green" : color;
        return validAddress() ? <Lock color={color}></Lock> : <Unlock color={color}></Unlock>
    }


    return (
        <Box gap="small">
            <TextInput size="small" onChange={(e) => setSearchInput(e.target.value)} placeholder="Fødselsnummer" value={searchInput} />
            <Box gap="small">
                {IDENTIFIER.UUID === identifier &&
                    <Grid columns={["flex", "xxsmall"]}>
                        <TextInput size="small" placeholder="Navn..." onChange={(e) => setName(e.target.value)} disabled={validAddress()} value={name}></TextInput>
                        <Button onClick={() => resolveUuidAndName()} size="small" focusIndicator={false} icon={nameResolvedIcon()}></Button>
                    </Grid>
                }
                {user &&
                    <Text size="xsmall"><Checkmark size="small" color="green" style={{ marginRight: "5px", paddingTop: "3px" }}></Checkmark>Din bruker kan utstede til fødselsnummer.</Text>
                }
                {!user &&
                    <Text size="xsmall"><Close size="small" color="red" style={{ marginRight: "5px", paddingTop: "3px" }}></Close>Din bruker kan IKKE utstede til fødselsnummer.</Text>
                }
                {IDENTIFIER.DEFAULT === identifier &&
                    <Text size="xsmall"><Waypoint size="small" color="red" style={{ marginRight: "5px", paddingTop: "3px" }}></Waypoint>Ukjent indentifisering, vennligst tast {user ? "fødselsnummer eller " : ""}Ethereum addresse.</Text>
                }
                {IDENTIFIER.DEFAULT !== identifier &&
                    < Text size="xsmall"><Waypoint size="small" color="green" style={{ marginRight: "5px", paddingTop: "3px" }}></Waypoint>Utsteder til {indetifierLabel()}</Text>
                }

            </Box>
        </Box >
    )
}
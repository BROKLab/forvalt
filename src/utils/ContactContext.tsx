import axios, { AxiosError } from 'axios';
import React, { useCallback } from 'react';
import { useLocalStorage } from './useLocalstorage';

interface Props {}

export type Address2Name = {
    [address: string]: string,
}
export interface ContactContext {
    names: Address2Name
    getContractNames: (contractAddress: string) => Promise<Address2Name>
    getAddressName: (address: string) => Promise<Address2Name>
}

export const ContactContext = React.createContext<ContactContext>(undefined!)

const TESTING = true

export const Contact: React.FC<Props> = ({ ...props }) => {
    const [names, setNames] = useLocalStorage<Address2Name>("address2name", {});

    const getContractNames = useCallback(async (contractAddress: string) => {
        const BROK_HELPERS_URL = process.env.REACT_APP_BROK_HELPERS_URL
        const BROK_HELPERS_VERIFIER = process.env.REACT_APP_BROK_HELPERS_VERIFIER
        if (!BROK_HELPERS_URL || !BROK_HELPERS_VERIFIER) throw Error("BROK_HELPERS_URL and BROK_HELPERS_VERIFIER must be decleared in enviroment")
        const res = await axios
            .post<Address2Name>(
                `${TESTING ? "http://localhost:3004" : BROK_HELPERS_URL
                }/brreg/contract/erc1400/names`,
                {
                    capTableAddress: contractAddress,
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
        console.log("brreg/contract/erc1400/names", res.data)
        if (!res.data) {
            throw Error("No data in POST request to /brreg/contract/erc1400/names")
        }
        setNames(old => ({ ...old, ...res.data }))
        return res.data
    }, [setNames])

    const getAddressName = useCallback((address: string) => {
        throw Error("TODO - getAddressName")
    }, [])

    const context: ContactContext = {
        getContractNames,
        getAddressName,
        names
    }


    return (
        <ContactContext.Provider value={context}>
            {props.children}
        </ContactContext.Provider>
    )
}
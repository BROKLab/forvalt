import axios, { AxiosError } from 'axios';
import React, { useCallback } from 'react';
import { fetchAddress2Name } from '../domain/BrokHelpers';
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
        const res = await fetchAddress2Name(contractAddress)
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
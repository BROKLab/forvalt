import { ethers } from 'ethers';
import { validateNorwegianIdNumber } from 'norwegian-national-id-validator';
import React, { useContext, useEffect, useState } from 'react';
import { SymfoniContext } from '../hardhat/ForvaltContext';
import { AuthProviderUser, GetBrregUnclaimedResponse, getChallengeToken, getUserMe, signChallengeAndVerify, unclaimed as _unclaimed, userNames } from './auth-provider';

interface Props { }

interface AuthContext {
    authToken?: string
    user?: AuthProviderUser
    logOut?: () => void
    unclaimed?: (contract: string, protocol: string, uuidHash: string) => Promise<GetBrregUnclaimedResponse>
    resolveAddressOrUUID?: (contract: string, protocol: string, uuidOrAddress: string, name?: string) => Promise<string>
    requestName?: (address: string) => void
}
interface NameContext {
    [address: string]: string | null,
}
export const AuthContext = React.createContext<AuthContext>({})
export const NameContext = React.createContext<NameContext>({})


export const Auth: React.FC<Props> = ({ ...props }) => {
    const { signer, address } = useContext(SymfoniContext)
    const [authToken, setAuthToken] = useState<string>();
    const [user, setUser] = useState<AuthProviderUser>();
    const [unamedAddresses, setUnamedAddresses] = useState<string[]>([]);
    const [address2name, setAddress2name] = useState<{ [address: string]: string | null }>({});

    const shouldSaveToken = () => {
        // return process.env.NODE_ENV === "development"
        return true
    }

    // get auth token
    useEffect(() => {
        let subscribed = true
        const doAsync = async () => {
            if (address && signer) {
                try {
                    if (shouldSaveToken()) {
                        const authToken = localStorage.getItem("authToken")
                        if (authToken) {
                            return setAuthToken(authToken)
                        }
                    }
                    const challengeToken = await getChallengeToken(address);
                    const authToken = await signChallengeAndVerify(challengeToken, signer)
                    if (subscribed && authToken) {
                        setAuthToken(authToken)
                        if (shouldSaveToken()) {
                            localStorage.setItem("authToken", authToken)
                        }
                    }
                } catch (error) {
                    if (shouldSaveToken() && subscribed && !authToken) {
                        localStorage.removeItem("authToken")
                    }
                }
            }
        };
        doAsync();
        return () => { subscribed = false }
    }, [address, signer, authToken])

    // get user if authToken
    useEffect(() => {
        let subscribed = true
        const doAsync = async () => {
            if (authToken) {
                try {
                    const me = await getUserMe(authToken)
                    if (subscribed && me) {
                        setUser(me)
                    } else {
                        throw Error("User not found")
                    }
                } catch (error) {
                    console.log()
                    if (shouldSaveToken()) {
                        localStorage.removeItem("authToken")
                    }
                }
            }
            if (subscribed) {
            }
        };
        doAsync();
        return () => { subscribed = false }
    }, [authToken])

    useEffect(() => {
        let subscribed = true
        const interval = setTimeout(async () => {
            if (unamedAddresses.length > 0 && authToken) {
                console.log("unamedAddresses", unamedAddresses)
                const res = await userNames(authToken, unamedAddresses)
                if ("names" in res) {
                    if (subscribed) {
                        console.log("got names", res.names)
                        setAddress2name(res.names)
                        setUnamedAddresses([])
                    }
                }
            }
        }, 500)
        return () => {
            subscribed = false
            clearTimeout(interval)
        }
    }, [unamedAddresses, authToken])

    const logOut = () => {
        setAuthToken(undefined)
        setUser(undefined)
        if (shouldSaveToken()) {
            localStorage.removeItem("authToken")
        }
    }

    // Will return address if address or resolve UUID 
    const resolveAddressOrUUID = async (
        contract: string,
        protocol: string,
        uuidOrAddress: string,
        name?: string
    ) => {
        if (!authToken) {
            throw Error("Please authenticate before running this.")
        }
        if (uuidOrAddress.substr(0, 2) === "0x") {
            if (ethers.utils.isAddress(uuidOrAddress)) {
                return uuidOrAddress
            }
        }
        if (validateNorwegianIdNumber(uuidOrAddress)) {
            const res = await _unclaimed(authToken, contract, protocol, ethers.utils.keccak256(ethers.utils.id(uuidOrAddress)), name)
            if (res) {
                return res.address
            }
        }
        throw Error("Could not resolve Address or UUID")
    }
    const unclaimed = (
        contract: string,
        protocol: string,
        uuidHash: string,
        name?: string
    ) => {
        if (!authToken) {
            throw Error("Please authenticate before running this.")
        }
        return _unclaimed(authToken, contract, protocol, uuidHash, name)
    }

    const requestName = (address: string) => {
        if (!(address in address2name)) {
            setUnamedAddresses(old => [...old, address])
        }
    }

    return (
        <AuthContext.Provider value={{ authToken, user, logOut, unclaimed, resolveAddressOrUUID, requestName }}>
            <NameContext.Provider value={address2name}>
                {props.children}
            </NameContext.Provider>
        </AuthContext.Provider>
    )
}
import React, { useEffect, useContext, useState } from 'react';
import { Box, Button, DataTable, Grid, Heading } from 'grommet';
import { claimUnclaimed, fetchUnclaimedList, Unclaimed } from '../../domain/BrokHelpers';
import { SymfoniContext } from '../../hardhat/ForvaltContext';
import { ethers } from 'ethers';

interface Props {}

export const UnclaimedList: React.FC<Props> = ({ ...props }) => {
    const { signer, init } = useContext(SymfoniContext)
    const [unclaimed, setUnclaimed] = useState<Unclaimed[]>([]);

    // Check for unclaimed
    useEffect(() => {
        let subscribed = true
        const doAsync = async () => {
            if (unclaimed.length > 0) return
            if (!signer) {
                return init({ forceSigner: true })
            }
            if (!("request" in signer)) throw Error("TODO")
            const BROK_HELPERS_VERIFIER = process.env.REACT_APP_BROK_HELPERS_VERIFIER;
            const jwt = await signer.request("did_createVerifiableCredential", [{
                type: "CapTableBoardDirector",
                payload: {
                    getUnclaimed: true
                },
                verifier: BROK_HELPERS_VERIFIER
            }])
            // get a jwt
            const unclaimedResponse = await fetchUnclaimedList(jwt)
            console.log("unclaimedResponse,", unclaimedResponse.data)
            if (unclaimedResponse.status === 201 && subscribed) {
                setUnclaimed(unclaimedResponse.data.data)
            }
        };
        doAsync();
        return () => { subscribed = false }
    }, [init, signer, unclaimed.length])


    const handleClaimBalance = async (params: {
        unclaimedId: string,
        partition: string,
        amount: string
    }) => {
        if (!signer) throw Error("TODO")
        if (!("request" in signer)) throw Error("TODO")
        const BROK_HELPERS_VERIFIER = process.env.REACT_APP_BROK_HELPERS_VERIFIER;
        const jwt = await signer.request("did_createVerifiableCredential", [{
            payload: {
                type: "ClaimERC1400",
                ...params
            },
            verifier: BROK_HELPERS_VERIFIER
        }])
        const claimResponse = await claimUnclaimed(jwt, { test: true })
        console.log("claimResponse,", claimResponse)
    }


    return (
        <Box>
            <Heading level="4">Aksjer utstedt til deg</Heading>
            <DataTable
                columns={[
                    {
                        property: "id",
                        primary: true,
                    },
                    {
                        property: "name",
                        header: "Selskap",
                    },
                    {
                        property: "balances",
                        header: "Handlinger",
                        render: (data) => (
                            <Box gap="small">
                                {data.balances.map((balance, i) => (
                                    <Button size="small" onClick={() => handleClaimBalance({ unclaimedId: data.id, amount: balance.balance, partition: balance.partition })} key={i} label={`Gjør krav på ${ethers.utils.formatEther(balance.balance)} - ${ethers.utils.parseBytes32String(balance.partition)} aksjer`}></Button>
                                ))
                                }
                            </Box>
                        )

                    }
                ]}

                data={unclaimed}
            ></DataTable>
        </Box>
    )
}
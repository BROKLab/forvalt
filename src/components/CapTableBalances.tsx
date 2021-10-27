import React, { useContext } from 'react';
import { Box, Button, DataTable, Paragraph, Spinner, Text } from 'grommet';
import { CapTableGraphQL, CapTableGraphQLTypes } from '../utils/CapTableGraphQL.utils';
import { useQuery } from 'graphql-hooks';
import { FormatEthereumAddress } from './FormatEthereumAddress';
import { ethers } from 'ethers';
import { Edit } from 'grommet-icons';
import useInterval from '../utils/useInterval';
import { BrokContext } from '../context/BrokContext';
import { useAsyncEffect } from 'use-async-effect';
import { ExportExcel } from '../utils/ExportExcel';
var debug = require("debug")("component:CapTableBalances");

interface Props {
    capTableAddress: string
    name: string
}

export const CapTableBalances: React.FC<Props> = ({ ...props }) => {
    const { loading, error, data, refetch } =
        useQuery<CapTableGraphQLTypes.BalancesQuery.Response>(CapTableGraphQL.BALANCES_QUERY(props.capTableAddress));

    const { getUnclaimedShares } = useContext(BrokContext)

    useInterval(() => {
        refetch()
    }, 4000)

    useAsyncEffect(async (isMounted) => {
        try {
            const response = await getUnclaimedShares()
            if (response.status === 200) {
                if (isMounted()) {
                    console.log(response.data)
                }
            }
        } catch (error: any) {
            if ("message" in error) {
                debug(error.message)
            } else {
                debug("error in getUnclaimedShares", error)
            }
        }

    }, [])


    return (
        <Box>
            {error && <Paragraph>Noe galt skjedde</Paragraph>}

            {data &&
                <DataTable
                    data={data ? data.balances : []}
                    primaryKey={false}
                    columns={[
                        {
                            property: "address",
                            header: <Text>ID</Text>,
                            render: (data) => (
                                <FormatEthereumAddress address={data.tokenHolder.address}></FormatEthereumAddress>
                            ),
                        },
                        {
                            property: "balance",
                            header: <Text>Aksjer</Text>,
                            render: (data) => ethers.utils.formatEther(data.amount),
                        },
                        {
                            property: "balanceByPartition",
                            header: <Text>Aksjeklasser</Text>,
                            render: (data) => data.partition,
                        },
                        {
                            property: "virtual",
                            header: "",
                            render: (data) => {
                                return (
                                    <Button
                                        icon={<Edit></Edit>}
                                    // onClick={() => setEditEntity(data.tokenHolder.address)}
                                    // disabled={
                                    //     data.capTable.owner.toLowerCase() !== address?.toLowerCase()
                                    // }
                                    ></Button>
                                );
                            },
                        },
                    ]}
                >
                </DataTable>
            }
            {data && <ExportExcel capTableName={props.name} data={data} />}
            <Box margin="small" align="center" height="small">
                {loading &&
                    <Spinner></Spinner>
                }
            </Box>
        </Box>
    )
}
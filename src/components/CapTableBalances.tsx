import React from 'react';
import { Box, Button, DataTable, Paragraph, Spinner, Text } from 'grommet';
import { CapTableGraphQL, CapTableGraphQLTypes } from '../utils/CapTableGraphQL.utils';
import { useQuery } from 'graphql-hooks';
import { FormatEthereumAddress } from './FormatEthereumAddress';
import { ethers } from 'ethers';
import { Edit } from 'grommet-icons';

interface Props {
    capTableAddress: string
}

export const CapTableBalances: React.FC<Props> = ({ ...props }) => {
    const { loading, error, data } =
        useQuery<CapTableGraphQLTypes.BalancesQuery.Response>(CapTableGraphQL.BALANCES_QUERY(props.capTableAddress));
    return (
        <Box>
            {loading && <Spinner></Spinner>}
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
        </Box>
    )
}
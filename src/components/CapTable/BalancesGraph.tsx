import { ethers } from 'ethers';
import { Box, DataTable, Select, Text } from 'grommet';
import React, { useState } from 'react';
import { formatBN } from '../../utils/numbers';
import { FormatAddress } from '../ui/FormatAddress';
import { Loading } from '../ui/Loading';
import { useQuery } from 'graphql-hooks';
import { CapTableTypes } from './CapTable.types';


interface Props {
    capTableAddress: string
}


export const BalancesGraph: React.FC<Props> = ({ ...props }) => {
    const [partitionFilter, setPartitionFilter] = useState<string>();
    const { loading, error, data } = useQuery<CapTableTypes.BalancesQuery.RootObject>(CapTableTypes.Queries.BALANCES_QUERY(props.capTableAddress), {
        variables: {
            limit: 10
        }
    })


    if (loading) {
        return <Loading>Laster Balanser</Loading>
    }
    if (error) {
        return <Loading>En feil skjedde.</Loading>
    }

    return (
        <Box gap="small" >
            {/* <Box direction="row" gap="small">
                <Box gap="small">
                    <Text>Partisjon</Text>
                    <Select
                        size="small"
                        options={data.partitions}
                        labelKey={option => ethers.utils.parseBytes32String(option)}
                        onChange={event => setPartitionFilter(event.option)}
                    ></Select>
                </Box>
            </Box> */}
            <DataTable
                data={data ? data.balances : []}
                primaryKey={false}
                columns={[
                    {
                        property: 'address',
                        header: <Text>ID</Text>,
                        render: data => <FormatAddress address={data.tokenHolder.address}></FormatAddress>

                    },
                    {
                        property: 'balance',
                        header: <Text>Aksjer</Text>,
                        render: data => data.amount
                    },
                    {
                        property: 'balanceByPartition',
                        header: <Text>Aksjeklasser</Text>,
                        render: data => data.partition
                    },
                ]}
            ></DataTable>

        </Box >
    )
}
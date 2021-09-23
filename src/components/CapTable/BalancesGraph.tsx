import { ethers } from 'ethers';
import { useQuery } from 'graphql-hooks';
import { Box, Button, DataTable, Text } from 'grommet';
import { Edit } from 'grommet-icons';
import React, { useContext, useState } from 'react';
import { SymfoniContext } from '../../hardhat/ForvaltContext';
import { FormatAddress } from '../ui/FormatAddress';
import { Loading } from '../ui/Loading';
import { Modal } from '../ui/Modal';
import { EntityUpdate } from '../User/EntityUpdate';
import { CapTableTypes } from './CapTable.types';


interface Props {
    capTableAddress: string
}


export const BalancesGraph: React.FC<Props> = ({ ...props }) => {
    // const [partitionFilter, setPartitionFilter] = useState<string>();
    const [editEntity, setEditEntity] = useState<string>();
    const { loading, error, data } = useQuery<CapTableTypes.BalancesQuery.RootObject>(CapTableTypes.Queries.BALANCES_QUERY(props.capTableAddress.toLowerCase()), {
        variables: {
            limit: 20
        }
    })
    const { address } = useContext(SymfoniContext)
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
                        render: data => ethers.utils.formatEther(data.amount)
                    },
                    {
                        property: 'balanceByPartition',
                        header: <Text>Aksjeklasser</Text>,
                        render: data => data.partition
                    },
                    {
                        property: "virtual",
                        header: "",
                        render: data => {
                            console.log(data.capTable.owner, address)
                            return (
                                <Button icon={<Edit></Edit>} onClick={() => setEditEntity(data.tokenHolder.address)} disabled={data.capTable.owner.toLowerCase() !== address?.toLowerCase()}></Button>
                            )
                        }
                    }
                ]}
            ></DataTable>
            <Modal show={!!editEntity} setShow={() => setEditEntity(undefined)} >
                {!!editEntity &&
                    <EntityUpdate entity={editEntity}></EntityUpdate>
                }
            </Modal>

        </Box >
    )
}
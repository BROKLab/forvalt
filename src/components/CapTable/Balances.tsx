import { BigNumber, BytesLike, ethers } from 'ethers';
import { Box, DataTable, Select, Text } from 'grommet';
import React, { useEffect, useState } from 'react';
import { ERC1400 } from '../../hardhat/typechain/ERC1400';
import { getERC1400Addresses } from '../../utils/erc1400-helpers';
import { formatBN } from '../../utils/numbers';
import { FormatAddress } from '../ui/FormatAddress';

interface Props {
    capTable: ERC1400
}

interface CapTableData {
    name: string
    totalSupply: string
}
interface CapTableRegistryData {
    uuid: string
    active: boolean
}

interface TokenHolder {
    address: string,
    partition: BytesLike,
    balance: BigNumber
}

export const Balances: React.FC<Props> = ({ ...props }) => {
    const [partitions, setPartitions] = useState<string[]>([]);
    const [tokenHolders, setTokenHolders] = useState<TokenHolder[]>();
    const [partitionFilter, setPartitionFilter] = useState<BytesLike>();

    // Get partitions
    useEffect(() => {
        let subscribed = true
        const doAsync = async () => {
            const partitionsBytes32 = await props.capTable.totalPartitions()
            const tokenHolders = await getERC1400Addresses(props.capTable, partitionFilter)
            if (subscribed) {
                setPartitions(partitionsBytes32)
                setTokenHolders(tokenHolders)
            }
        };
        doAsync();
        return () => { subscribed = false }
    }, [props.capTable, partitionFilter])

    return (
        <Box gap="small" >
            <Box direction="row" gap="small">
                <Box gap="small">
                    <Text>Partisjon</Text>
                    <Select
                        size="small"
                        options={partitions}
                        labelKey={option => ethers.utils.parseBytes32String(option)}
                        onChange={event => setPartitionFilter(event.option)}
                    ></Select>
                </Box>
            </Box>
            <DataTable
                data={tokenHolders}
                primaryKey={false}
                columns={[
                    {
                        property: 'address',
                        header: <Text>ID</Text>,
                        render: data => <FormatAddress address={data.address}></FormatAddress>

                    },
                    {
                        property: 'balance',
                        header: <Text>Aksjer</Text>,
                        render: data => (formatBN(data.balance))
                    },
                    {
                        property: 'balanceByPartition',
                        header: <Text>Aksjeklasser</Text>,
                        render: data => (ethers.utils.parseBytes32String(data.partition))
                    },
                    // {
                    //     property: 'collateral',
                    //     header: <Text>Sikkerhet</Text>,
                    // }
                ]}
            ></DataTable>

        </Box>
    )
}
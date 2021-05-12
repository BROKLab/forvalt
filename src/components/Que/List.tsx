import { BigNumber, BytesLike, ethers } from 'ethers';
import { Box, Button, DataTable, Text } from 'grommet';
import { More } from 'grommet-icons';
import React, { useEffect, useState } from 'react';
import { useHistory } from 'react-router-dom';
import { CapTableQue } from '../../hardhat/typechain/CapTableQue';
import { getStatus } from '../../utils/que-helpers';

interface Props {
    capTableQue: CapTableQue
}

interface QueListData {
    status: BigNumber,
    uuid: BytesLike,
    address: string
}

export const List: React.FC<Props> = ({ ...props }) => {
    const history = useHistory();
    const [list, setList] = useState<string[]>([]);
    const [listData, setListData] = useState<QueListData[]>([]);

    // Get list
    useEffect(() => {
        let subscribed = true
        const doAsync = async () => {
            const list = await props.capTableQue.list()
            if (subscribed) {
                const listReveresed = list.slice().reverse()
                setList(listReveresed)
            }
        };
        doAsync();
        return () => { subscribed = false }
    }, [props.capTableQue])

    // get data
    useEffect(() => {
        let subscribed = true
        const doAsync = async () => {
            list.forEach(async address => {
                if (Object.keys(list).indexOf(address) === -1) {
                    const info = await props.capTableQue.info(address)
                    if (subscribed) {
                        setListData(old => [...old, {
                            status: info.status,
                            uuid: info.uuid,
                            address: address
                        }])
                    }
                }
            })
        }
        doAsync();
        return () => { subscribed = false }
    }, [list, props.capTableQue])

    return (
        <Box>
            <DataTable
                data={listData}
                primaryKey={"address"}
                columns={[
                    {
                        property: 'uuid',
                        header: <Text>Orgnr</Text>,
                        render: (data) => ethers.utils.parseBytes32String(data.uuid)
                    },
                    // {
                    //     property: 'address',
                    //     header: <Text truncate>Address</Text>,
                    //     primary: true,
                    //     render: (row) => <FormatAddress address={data[row.]}></FormatAddress>
                    // },
                    {
                        property: 'status',
                        header: <Text>Status</Text>,
                        render: (data) => getStatus(data.status.toNumber())
                    },
                    // {
                    //     property: 'address',
                    //     header: <Text>Identifikator</Text>,
                    //     primary: true,
                    //     render: (data) => FormatAddress({ address: data.address })
                    // },
                    {
                        property: 'actions',
                        header: <Text>...</Text>,
                        render: (data) => <Button size="small" hoverIndicator={true} focusIndicator={false} icon={<More></More>} onClick={() => history.push("/captable/" + data.address)}></Button>
                    },

                ]}

            />
        </Box>
    )
}
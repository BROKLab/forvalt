import { BytesLike, ethers } from 'ethers';
import { Box, Button, DataTable, Text } from 'grommet';
import { More } from 'grommet-icons';
import React, { useEffect, useState } from 'react';
import { useHistory } from 'react-router-dom';
import { CapTableRegistry } from '../../hardhat/typechain/CapTableRegistry';

interface Props {
    capTableRegistry: CapTableRegistry
}

interface QueListData {
    active: boolean,
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
            const list = await props.capTableRegistry.list()
            if (subscribed) {
                const listReveresed = list.slice().reverse()
                setList(listReveresed)
            }
        };
        doAsync();
        return () => { subscribed = false }
    }, [props.capTableRegistry])

    // get data
    useEffect(() => {
        let subscribed = true
        const doAsync = async () => {
            list.forEach(async address => {
                if (Object.keys(list).indexOf(address) === -1) {
                    const info = await props.capTableRegistry.info(address)
                    if (subscribed) {
                        setListData(old => [...old, {
                            active: info.active,
                            uuid: info.uuid,
                            address: address
                        }])
                    }
                }
            })
        }
        doAsync();
        return () => { subscribed = false }
    }, [list, props.capTableRegistry])



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
                        render: (data) => data.active ? "Aktivt" : "Slettet"
                    },
                    // {
                    //     property: 'address',
                    //     header: <Text>Addresse</Text>,
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
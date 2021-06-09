import { BigNumber, BytesLike } from 'ethers';
import { useQuery } from 'graphql-hooks';
import { Box, Button, DataTable, Paragraph, Text } from 'grommet';
import { More } from 'grommet-icons';
import React from 'react';
import { useHistory } from 'react-router-dom';
import { Loading } from '../ui/Loading';

interface Props {
}

interface QueListData {
    status: BigNumber,
    uuid: BytesLike,
    address: string
}


const CAP_TABLES_QUERY = `{
    capTables(where: {status: APPROVED}) {
      name
      orgnr
      status
      id
    }
  }
`

export const List: React.FC<Props> = ({ ...props }) => {
    const history = useHistory();
    const { loading, error, data } = useQuery<{
        capTables: {
            name: string
            orgnr: string
            id: string
            status: string
        }[]

    }>(CAP_TABLES_QUERY, {
        variables: {
            limit: 10
        }
    })

    // TODO: ADD possiblity to retrive list from smart contract also
    // // get data
    // useEffect(() => {
    //     let subscribed = true
    //     const doAsync = async () => {
    //         list.forEach(async address => {
    //             if (Object.keys(list).indexOf(address) === -1) {
    //                 const info = await props.capTableQue.info(address)
    //                 if (subscribed) {
    //                     setListData(old => [...old, {
    //                         status: info.status,
    //                         uuid: info.uuid,
    //                         address: address
    //                     }])
    //                 }
    //             }
    //         })
    //     }
    //     doAsync();
    //     return () => { subscribed = false }
    // }, [list, props.capTableQue])


    if (loading) return <Loading>Laster..</Loading>
    if (error) return <Box><p>Noe galt skjedde</p></Box>

    return (
        <Box>
            {(!data || data.capTables.length === 0) &&
                <Paragraph>Fant ingen aksjeeierbøker</Paragraph>
            }
            {data && data.capTables.length > 0 &&

                <DataTable
                    data={data.capTables}
                    primaryKey={"address"}
                    columns={[
                        {
                            property: 'uuid',
                            header: <Text>Orgnr</Text>,
                            render: (data) => data.orgnr
                        },
                        {
                            property: 'name',
                            header: <Text truncate>Address</Text>,
                            render: (data) => data.name
                        },
                        {
                            property: 'status',
                            header: <Text>Status</Text>,
                            render: (data) => data.status
                        },
                        {
                            property: 'actions',
                            header: <Text>...</Text>,
                            render: (data) => <Button size="small" hoverIndicator={true} focusIndicator={false} icon={<More></More>} onClick={() => history.push("/captable/" + data.id)}></Button>
                        },

                    ]}

                />
            }
        </Box>
    )
}
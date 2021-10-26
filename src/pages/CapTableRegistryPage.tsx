import { useQuery } from "graphql-hooks";
import { Box, Heading, Paragraph, Spinner } from "grommet";
import React from "react";
import { CapTableList } from "../components/CapTableRegistryList";
import useInterval from "../utils/useInterval";


interface Props {}

const CAP_TABLES_QUERY = `{
    capTables(where: {status: APPROVED}) {
      name
      orgnr
      status
      id
    }
  }
`;
export type CapTableListData = {
    name: string;
    orgnr: string;
    id: string;
    status: string;
}

export const CapTableRegistryPage: React.FC<Props> = ({ ...props }) => {
    const { loading, error, data, refetch } = useQuery<{
        capTables: CapTableListData[];
    }>(CAP_TABLES_QUERY, {
        variables: {
            limit: 10,
        },
    });

    useInterval(() => {
        refetch()
    }, 2000)

    return (
        <Box>
            <Heading>Aksjeeierbokregisteret</Heading>
            {loading && <Spinner></Spinner>}
            {error && <Paragraph>Noe galt skjedde</Paragraph>}
            {data &&
                <CapTableList capTables={data.capTables}></CapTableList>
            }
        </Box>
    );
};

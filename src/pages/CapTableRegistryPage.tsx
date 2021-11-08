import { useQuery } from "graphql-hooks";
import { Box, Heading, Paragraph, Spinner } from "grommet";
import React from "react";
import { CapTableList } from "../components/CapTableList";
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
};

export const CapTableRegistryPage: React.FC<Props> = ({ ...props }) => {
    const { loading, error, data, refetch } = useQuery<{
        capTables: CapTableListData[];
    }>(CAP_TABLES_QUERY, {
        variables: {
            limit: 10,
        },
    });

    useInterval(() => {
        refetch();
    }, 5000);

    return (
        <Box>
            <Heading>Aksjeeierbokregisteret</Heading>

            {error && <Paragraph>Noe galt skjedde</Paragraph>}
            {data && <CapTableList capTables={data.capTables}></CapTableList>}
            <Box margin="small" align="center" height="small">
                {loading && <Spinner></Spinner>}
            </Box>
        </Box>
    );
};

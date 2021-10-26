import { useQuery } from "graphql-hooks";
import { Box, Heading, Paragraph, Spinner } from "grommet";
import React from "react";
import { CapTableRegistryList } from "../components/CapTableRegistryList";


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
    const { loading, error, data } = useQuery<{
        capTables: CapTableListData[];
    }>(CAP_TABLES_QUERY, {
        variables: {
            limit: 10,
        },
    });

    return (
        <Box>
            <Heading>Aksjeeierbokregisteret</Heading>
            {loading && <Spinner></Spinner>}
            {error && <Paragraph>Noe galt skjedde</Paragraph>}
            {data &&
                <CapTableRegistryList capTables={data.capTables}></CapTableRegistryList>
            }
        </Box>
    );
};

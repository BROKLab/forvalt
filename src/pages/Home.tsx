import { Heading, Text } from "grommet";
import React from "react";

interface Props {}

export const Home: React.FC<Props> = () => {

    return (
        <>
            <Heading level={3}>
                Velkommen til{" "}
                <Text size="xxlarge" weight="bold" style={{ fontStyle: "italic" }}>
                    Brønnøysundregistrene Aksjeeierbok
                </Text>
            </Heading>
        </>
    );
};

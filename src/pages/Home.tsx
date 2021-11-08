import { Box, Button, Heading, Paragraph, Text } from "grommet";
import { Notes } from "grommet-icons";
import React from "react";
import { Link } from "react-router-dom";

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
            <Box direction="row">
                {[
                    {
                        title: "For selskapseiere",
                        icon: <Notes />,
                        description: "Er du styreleder av et unotert aksjeselskap? Da kan flytte aksjeeierboken din til BRØK.",
                        buttonText: "Opprett aksjeeierbok",
                        link: "/captable/create",
                    },
                    {
                        title: "For aksjonærer",
                        icon: <Notes />,
                        description: "Har du mottatt epost om å sjekke porteføljen? Ett eller flere selskaper du er aksjonær i, har tatt i bruk BRØK",
                        buttonText: "Min portfølje",
                        link: "/me",
                    },
                    {
                        title: "Innsyn",
                        icon: <Notes />,
                        description: "Alle aksjeeierbøkene på BRØK er åpne. Her får du en liste over alle selskaper på plattformen.",
                        buttonText: "Aksjeeierbokregisteret",
                        link: "/register/list",
                    },
                ].map((homeAction) => {
                    return (
                        <Box
                            direction="column"
                            justify="between"
                            style={{ width: 300, height: 300 }}
                            border={{ color: "brand", size: "medium" }}
                            margin="small"
                            pad="medium">
                            <Box direction="column">
                                <Box direction="row" align="center" justify="around">
                                    {homeAction.icon}
                                    <Heading level={4}>{homeAction.title}</Heading>
                                </Box>
                                <Paragraph>{homeAction.description}</Paragraph>
                            </Box>
                            <Box direction="row" justify="end">
                                <Link to={homeAction.link}>
                                    <Button size="small" label={homeAction.buttonText} hoverIndicator focusIndicator={false} />
                                </Link>
                            </Box>
                        </Box>
                    );
                })}
            </Box>
        </>
    );
};

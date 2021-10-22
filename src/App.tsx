import { ClientContext, GraphQLClient } from "graphql-hooks";
import { Box, Footer, Grommet, Main, Paragraph, Text } from "grommet";
import React from "react";
import { BrowserRouter, Route, Switch } from "react-router-dom";
import { Theme } from "./assets/Theme";
import { Navigation } from "./components/ui/Navigation";
import { Symfoni } from "./hardhat/ForvaltContext";
import { CapTableCreatePageV2 } from "./pages/CapTableCreatePageV2";
import { CapTablePage } from "./pages/CapTablePage";
import { CapTableQuePage } from "./pages/CapTableQuePage";
import { CapTableRegistryPage } from "./pages/CapTableRegistryPage";
import { Home } from "./pages/Home";
import { ProfilePage } from "./pages/ProfilePage";
import { Brok } from "./utils/BrokContext";
import { Contact } from "./utils/ContactContext";

function App() {
    if (!process.env.REACT_APP_BROK_CAPTABLE_GRAPHQL) {
        throw Error("Please set process.env.REACT_APP_BROK_CAPTABLE_GRAPHQL");
    }
    const client = new GraphQLClient({
        url: process.env.REACT_APP_BROK_CAPTABLE_GRAPHQL,
    });

    return (
        <BrowserRouter basename={process.env.PUBLIC_URL}>
            <ClientContext.Provider value={client}>
                <Grommet theme={Theme} full={true}>
                    <Symfoni autoInit={true} showLoading={true}>
                        <Brok>
                            <Contact>
                                <Box height={{ min: "100vh" }}>
                                    {/* Navigation */}
                                    <Navigation></Navigation>
                                    {/* Content swtich */}
                                    <Main pad="xlarge" height={{ min: "75vh" }}>
                                        <Switch>
                                            <Route exact path="/" component={Home} />
                                            <Route path="/captable/create" component={CapTableCreatePageV2} />
                                            <Route path="/capTable/:address" component={CapTablePage} />
                                            <Route path="/que" component={CapTableQuePage} />
                                            <Route path="/register" component={CapTableRegistryPage} />
                                            <Route path="/profile" component={ProfilePage} />
                                        </Switch>
                                    </Main>
                                    {/* footer */}
                                    <Footer background="brand" pad="medium" height={{ min: "10vh" }}>
                                        <Box align="center" justify="center" alignContent="center" fill="horizontal">
                                            <Text textAlign="center" size="small">
                                                <Paragraph>Brønnøysundregistrene Aksjeeierbok</Paragraph>
                                                <Paragraph>Del av Brønnøysundregistrene Sandkasse</Paragraph>
                                            </Text>
                                        </Box>
                                    </Footer>
                                </Box>
                            </Contact>
                        </Brok>
                    </Symfoni>
                </Grommet>
            </ClientContext.Provider>
        </BrowserRouter>
    );
}

export default App;

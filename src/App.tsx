import React, { useCallback } from 'react';
// import { ClientContext, GraphQLClient } from "graphql-hooks";
import { Box, Footer, Grommet, Layer, Main, Paragraph, Text } from "grommet";
import { BrowserRouter, Route, Switch, useLocation, useHistory } from "react-router-dom";
import { Theme } from "./assets/Theme";
import { Navigation } from "./components/Navigation";
import { Home } from './pages/Home';
import { SymfoniProvider } from './context/SymfoniContext';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { MePage } from './pages/MePage';
import { CapTableCreatePage } from './pages/CapTableCreatePage';
import { BrokProvider } from './context/BrokContext';
import { CapTableRegistryPage } from './pages/CapTableRegistryPage';
import { ClientContext, GraphQLClient } from "graphql-hooks";
import { CapTableQuePage } from './pages/CapTableQuePage';
import { CapTablePage } from './pages/CapTablePage';
import { LogoutPage } from './pages/LogoutPage';
import { AccessPermissionRequest } from './permissionRequests/AccessPermissionRequest';


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
          <SymfoniProvider>
            <BrokProvider>
              <Box height={{ min: "100vh" }}>
                {/* Navigation */}
                <Navigation></Navigation>
                {/* Content swtich */}
                <Main pad="xlarge" height={{ min: "75vh" }}>
                  <Switch>
                    <Route exact path="/" component={Home} />
                    <Route path="/captable/create" component={CapTableCreatePage} />
                    <Route path="/capTable/:address" component={CapTablePage} />
                    <Route path="/register" component={CapTableRegistryPage} />
                    <Route path="/que" component={CapTableQuePage} />
                    <Route path="/me" component={MePage} />
                    <Route path="/logout" component={LogoutPage} />
                  </Switch>
                </Main>
                {/** Permission request switch */}
                <PermissionRequestSwitch />
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
            </BrokProvider>
          </SymfoniProvider>
          <ToastContainer></ToastContainer>
        </Grommet>
      </ClientContext.Provider>
    </BrowserRouter>
  );
}

function PermissionRequestSwitch() {
  const location = useLocation();
  const history = useHistory();

  /** Callback */
  const onResolve = useCallback(
    () => history.replace(`${location.pathname}${location.search}`),
    [history, location.pathname, location.search]
  );

  /** Callback */
  const onReject = useCallback(
    () => history.replace(`${location.pathname}${location.search}`),
    [history, location.pathname, location.search]
  );

  switch (location.hash) {
    case "#access-permission-request": return (
      <Layer onEsc={onReject} onClickOutside={onReject}>
        <AccessPermissionRequest 
          onResolve={onResolve}
          onReject={onReject}
        />
      </Layer>
    )
    default: return null;
  }
}

export default App;

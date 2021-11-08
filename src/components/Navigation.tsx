import { Box, Button, Header, Image, ResponsiveContext, Text } from "grommet";
import React, { useContext } from "react";
import { Link } from "react-router-dom";
import { SymfoniContext } from "../context/SymfoniContext";
import BRREG_LOGO_SMALL_PNG from "./../assets/images/brreg_logo.png";
import BRREG_LOGO_SVG from "./../assets/images/brreg_logo.svg";

interface Props {}

export const Navigation: React.FC<Props> = () => {
    const { signer } = useContext(SymfoniContext);
    const size = React.useContext(ResponsiveContext);

    return (
        <Header background="brand-contrast" pad="small" height={{ min: "15vh" }}>
            <Box>
                <Link to="/">
                    {size === "small" ? (
                        <Image src={BRREG_LOGO_SMALL_PNG} margin="small" height="37px"></Image>
                    ) : (
                        <Image src={BRREG_LOGO_SVG} margin="small" height="37px"></Image>
                    )}
                </Link>
                <Text size="large" margin={{ left: "3em" }}>
                    Aksjeeierbok
                </Text>
            </Box>
            <Box direction="row" gap="small">
                {signer && (
                    <Link to="/logout">
                        <Button size="small" label="Koble fra" hoverIndicator focusIndicator={false} />
                    </Link>
                )}
                <Link to="/register/list">
                    <Button size="small" label="Aksjeregister" hoverIndicator focusIndicator={false} />
                </Link>
                <Link to="/me">
                    <Button label={"Mine aksjer"} size="small" hoverIndicator focusIndicator={false}></Button>
                </Link>
            </Box>
        </Header>
    );
};

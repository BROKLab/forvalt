import { Box, Button, Header, Image, ResponsiveContext, Text } from 'grommet';
import React, { useContext } from 'react';
import { Link } from 'react-router-dom';
import { SymfoniContext } from '../../hardhat/ForvaltContext';
import BRREG_LOGO_SMALL_PNG from './../../assets/brreg_logo.png';
import BRREG_LOGO_SVG from './../../assets/brreg_logo.svg';




interface Props { }

export const Navigation: React.FC<Props> = () => {
    const size = React.useContext(ResponsiveContext);
    const { init } = useContext(SymfoniContext)
    return (
        <Header background="brand-contrast" pad="small" height={{ min: "15vh" }}>
            <Box>
                <Link to="/">
                    {size === "small"
                        ? <Image src={BRREG_LOGO_SMALL_PNG} margin="small" height="37px"></Image>
                        : <Image src={BRREG_LOGO_SVG} margin="small" height="37px"></Image>
                    }
                </Link>
                <Text size="large" margin={{ "left": "3em" }}>Aksjeeierbok</Text>
            </Box>
            <Box direction="row" gap="small" >
                <Link to="/captable/create">
                    <Button size="small" label="Opprett" hoverIndicator focusIndicator={false} />
                </Link>
                <Link to="/que/list">
                    <Button size="small" label="Kø" hoverIndicator focusIndicator={false} />
                </Link>
                <Link to="/register/list">
                    <Button size="small" label="Register" hoverIndicator focusIndicator={false} />
                </Link>
                <Button label="Loginn" size="small" hoverIndicator focusIndicator={false} onClick={() => init({ forceSigner: true })}></Button>

            </Box>

        </Header>
    )
}
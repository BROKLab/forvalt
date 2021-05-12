import React from 'react';
import { Box, Paragraph, Heading, Text } from 'grommet';
import { BatchIssue } from './BatchIssue';
import { ERC1400 } from '../../hardhat/typechain/ERC1400';
import { Checkmark } from 'grommet-icons';

interface Props {
    capTable: ERC1400
}

export const OnBoard: React.FC<Props> = ({ ...props }) => {

    return (
        <Box>
            <Heading>Opprett aksjeeierbok</Heading>
            <Paragraph fill={true}>Kun selskapets <strong>styreleder</strong> kan flytte aksjeeierboken til Brønnøysundregistrene Aksjeeierbok.
                Når selskapet bruker denne løsningen, vil dette være en offisielle aksjeeierboken,
                og den tidligere aksjeeierboken selskapet hadde er ikke lengre gyldig.</Paragraph>

            <Paragraph fill={true}>Aksjonærer i selskapet vil kunne sende aksjene sine til andre uten styrets samtykke,
            og aksjeeierboken vil automatisk oppdateres fortløpende.
                </Paragraph>

            <Paragraph><Text weight="bold">Ved å fortsette, bekrefter du følgende:</Text></Paragraph>

            <Paragraph fill={true}><Checkmark size="small"></Checkmark> Jeg er styreleder i selskapet jeg valgte i forrige steg.</Paragraph>
            <Paragraph fill={true}><Checkmark size="small"></Checkmark> Jeg er inneforstått med at løsningen ikke automatisk innrapporterer noe til offentlig sektor,
                    og at innrapportering forstatt må gjøres som før.</Paragraph>
            <Paragraph fill={true}><Checkmark size="small"></Checkmark> Jeg er inneforstått med at løsningen er i Brønnøysundregistrene Sandkasse,
                    som betyr at Brønnøysundregistrene kan slutte å drifte løsningen. Det vil da være mulig å laste need aksjeeierboken i csv-format.</Paragraph>
            <Paragraph fill={true}><Checkmark size="small"></Checkmark> Jeg er inneforstått med at løsningen er i Brønnøysundregistrene Sandkasse, som betyr at det kan være feil i løsningen.</Paragraph>
            <Paragraph fill={true}><Checkmark size="small"></Checkmark> Jeg er inneforstått med at aksjeeierboken blir liggende offentlig tilgjengelig på nett.</Paragraph>

            <Box elevation="large" gap="small" pad="small" margin={{ top: "large" }}>
                <BatchIssue capTable={props.capTable}></BatchIssue>
            </Box>
        </Box>
    )
}
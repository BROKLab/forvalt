import { CapTable } from "@brok/captable-contracts";
import { Box, CheckBox, Heading, Text } from "grommet";
import React, { useContext, useEffect, useState } from "react";
import { SymfoniContext } from "../../hardhat/ForvaltContext";
import { ContactContext } from "../../utils/ContactContext";
import { Actions } from "./Actions";
import { BalancesGraph } from "./BalancesGraph";
import { BalancesSmartContract } from "./BalancesSmartContract";
import { Info } from "./Info";

interface Props {
  capTable: CapTable;
}

export const Details: React.FC<Props> = ({ ...props }) => {
  const { signer } = useContext(SymfoniContext);
  const [useSmartContract, setUseSmartContract] = useState(false);
  const { getContractNames } = useContext(ContactContext);

  useEffect(() => {
    getContractNames(props.capTable.address);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <Box>
      <Heading level={3}>Nøkkelopplysninger</Heading>
      <Info capTable={props.capTable}></Info>
      {signer && (
        <>
          <Heading level={3}>Handlinger</Heading>
          <Actions capTable={props.capTable}></Actions>
        </>
      )}
      <Box direction="row" gap="small">
        <Heading level={3}>Aksjeliste</Heading>
        <CheckBox
          toggle={true}
          onChange={(e) => setUseSmartContract(e.target.checked)}
        ></CheckBox>
        <Text size="xsmall" alignSelf="center">
          Rå data
        </Text>
      </Box>
      {useSmartContract ? (
        <BalancesSmartContract
          capTable={props.capTable}
        ></BalancesSmartContract>
      ) : (
        <BalancesGraph capTable={props.capTable}></BalancesGraph>
      )}
    </Box>
  );
};

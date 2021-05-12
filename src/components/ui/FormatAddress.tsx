import React, { useContext, useEffect, useState } from 'react';
import { Box, Text, Button } from 'grommet';
import Copy from "clipboard-copy";
import { Copy as CopyIcon } from 'grommet-icons';
import { AuthContext, NameContext } from '../../utils/AuthContext';

interface Props {
  address: string
  copy?: boolean
  size?: string
}

export const FormatAddress: React.FC<Props> = ({ address, copy = true, size = "medium" }) => {
  const [color, setColor] = useState<string>("black");
  const names = useContext(NameContext)
  const { requestName } = useContext(AuthContext)

  useEffect(() => {
    if (requestName) {
      requestName(address)
    }
    // Because we dont want to rerender when auth context changes on requestName
    // eslint-disable-next-line
  }, [address])

  const formatAddress = () => {
    if (address in names && names[address] !== null) {
      return names[address]
    }
    return address.substr(0, 5) +
      ".." +
      address.substr(address.length - 2, address.length)
  }
  const handleCopy = () => {
    setColor("green")
    Copy(address)
    setTimeout(() => {
      setColor("text")
    }, 300)
  }

  return (
    <Box direction="row">
      <Text size={size}>{formatAddress()}</Text>
      {copy &&
        <Button plain margin={{ left: "5px" }} alignSelf="center" icon={<CopyIcon size="15px" color={color} ></CopyIcon>} onClick={() => handleCopy()} hoverIndicator focusIndicator={false}></Button>
      }
    </Box>
  );
}
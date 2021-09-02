import Copy from "clipboard-copy";
import { ethers } from "ethers";
import { Box, Button, Text } from 'grommet';
import { Copy as CopyIcon } from 'grommet-icons';
import React, { useContext, useState } from 'react';
import { ContactContext } from "../../utils/ContactContext";

interface Props {
  address: string
  copy?: boolean
  size?: string
}

export const FormatAddress: React.FC<Props> = ({ address, copy = true, size = "medium" }) => {
  const [color, setColor] = useState<string>("black");
  const { names } = useContext(ContactContext)

  // useEffect(() => {
  //   if (requestName) {
  //     requestName(address)
  //   }
  //   // Because we dont want to rerender when auth context changes on requestName
  //   // eslint-disable-next-line
  // }, [address])

  const formatAddress = () => {
    const checkedAddress = ethers.utils.getAddress(address)
    if (checkedAddress in names) {
      return names[checkedAddress]
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
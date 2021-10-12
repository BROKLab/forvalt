import React, { useContext, useEffect } from "react";
import { Box } from "grommet";
import { SymfoniContext } from "../../hardhat/ForvaltContext";

interface Props {
    entity: string;
}

export const EntityUpdate: React.FC<Props> = ({ ...props }) => {
    const { signer } = useContext(SymfoniContext);

    useEffect(() => {
        let subscribed = true;
        const doAsync = async () => {
            if (signer && "request" in signer) {
                const BROK_HELPERS_VERIFIER = process.env.REACT_APP_BROK_HELPERS_VERIFIER;
                const jwt = await signer.request("did_createVerifiableCredential", [
                    {
                        payload: {
                            something: "nothing",
                        },
                        verifier: BROK_HELPERS_VERIFIER,
                    },
                ]);
                // TODO
            }

            if (subscribed) {
            }
        };
        doAsync();
        return () => {
            subscribed = false;
        };
    }, []);

    return <Box>{props.entity}</Box>;
};

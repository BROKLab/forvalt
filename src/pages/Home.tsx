import React, { useContext } from "react";
import { Button, Heading, Text } from "grommet";
import { SignatureRequest } from "../utils/SignerRequestHandler";
import { SymfoniContext } from "../hardhat/ForvaltContext";

interface Props {}

export const Home: React.FC<Props> = () => {
    /*     const { init, signer, signatureRequestHandler } = useContext(SymfoniContext);

    const test = async () => {
        console.log(1);
        if (!signer) {
            init({ forceSigner: true });
            return null;
        }
        console.log(2);
        if (!("request" in signer)) return null;
        console.log(3);
        const request: SignatureRequest = {
            message: "Signer dine data i Identitywallet",
            fn: async () =>
                await signer.request("did_createVerifiableCredential", [
                    {
                        verifier: "did:ethr:421611:0x02bde9847ad8569df159b5783df389c2db4d00c25a4c4822eea6fb9963b096e16d",
                        payload: {
                            test: "LOL",
                        },
                    },
                ]),
        };

        signatureRequestHandler.add([request]);
        console.log(4);
        const results = await signatureRequestHandler.results();
        console.log(5);
    }; */

    return (
        <>
            {/* <Button onClick={() => test()}>TEST</Button> */}
            <Heading level={3}>
                Velkommen til{" "}
                <Text size="xxlarge" weight="bold" style={{ fontStyle: "italic" }}>
                    Brønnøysundregistrene Aksjeeierbok
                </Text>
            </Heading>
        </>
    );
};

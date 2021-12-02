import { useSign } from "./useSign";
import { PrivateTokenTransferData } from "../components/PrivateTokenTransferForm";

export function useSignCapTablePrivateTokenTransferVP() {
    const { sign } = useSign();

    const signCapTablePrivateTokenTransferVP = async (capTableAddress: string, orgnr: string, privateUserData: PrivateTokenTransferData) => {
        const BROK_HELPERS_VERIFIER = process.env.REACT_APP_BROK_HELPERS_VERIFIER;

        return sign<{ jwt: string }[]>("symfoniID_capTablePrivateTokenTransferVP", "Godkjenn private aksjeoverførelse via Brønnøysundregistrene", [
            {
                verifier: BROK_HELPERS_VERIFIER,
                toShareholder: {
                    name: privateUserData.name,
                    streetAddress: privateUserData.streetAddress,
                    postalcode: privateUserData.postalcode,
                    email: privateUserData.email,
                    identifier: privateUserData.identifier,
                    orgnr: orgnr,
                    amount: privateUserData.amount,
                    partition: privateUserData.partition,
                    capTableAddress: capTableAddress,
                },
            },
        ]);
    };

    return {
        signCapTablePrivateTokenTransferVP,
    };
}

import { UpdateShareholderData } from "../components/CapTableBalances";
import { useSign } from "./useSign";

export function useSignUpdateShareholderVP() {
    const { sign } = useSign();

    const signUpdateShareholderVP = async (capTableAddress: string, editEntityId: string, updateShareholderData: UpdateShareholderData) => {
        const BROK_HELPERS_VERIFIER = process.env.REACT_APP_BROK_HELPERS_VERIFIER;

        return sign<{ jwt: string }[]>("symfoniID_updateShareholderVP", "Bekreft endring av data", [
            {
                verifier: BROK_HELPERS_VERIFIER,
                capTableAddress: capTableAddress,
                shareholderId: editEntityId,
                shareholderData: {
                    ...updateShareholderData,
                },
            },
        ]);
    };

    return {
        signUpdateShareholderVP,
    };
}

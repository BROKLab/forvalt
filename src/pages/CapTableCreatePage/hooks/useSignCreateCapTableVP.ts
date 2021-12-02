import { useSign } from "../../../hooks/useSign";
import { PrivateTokenTransferData } from "../../../components/PrivateTokenTransferForm";
import { OrgData } from "../../../components/SelectOrg";

export function useSignCreateCapTableVP() {
    const { sign } = useSign();

    const signCreateCapTableVP = async (orgData: OrgData, privateTokenTransfers: PrivateTokenTransferData[]) => {
        const BROK_HELPERS_VERIFIER = process.env.REACT_APP_BROK_HELPERS_VERIFIER;
        return sign<{ jwt: string }[]>("symfoniID_createCapTableVP", "Godkjenn migreringen av aksjeeierboka", [
            {
                verifier: BROK_HELPERS_VERIFIER,
                capTable: {
                    organizationNumber: orgData.orgnr.toString(),
                    shareholders: privateTokenTransfers,
                },
            },
        ]);
    };

    return {
        signCreateCapTableVP,
    };
}

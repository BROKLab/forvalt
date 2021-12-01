import { useContext } from "react";
import { SymfoniContext } from "../context/SymfoniContext";
import { Signer } from "../context/useSymfoni";
import { SignatureRequest } from "../utils/SignerRequestHandler";

export function useSign() {
    const { signatureRequestHandler } = useContext(SymfoniContext);

    const sign = async <T>(method: string, message: string, params: any[]) => {
        const request: SignatureRequest = {
            message: message,
            fn: async (_signer: Signer) => {
                if (!("request" in _signer)) {
                    require("debug")("context:useSign().sign()")(`connect(): !("request" in signer")`);
                    return null;
                }
                return await _signer.request(method, params);
            },
        };
        signatureRequestHandler.add([request]);
        return signatureRequestHandler.resultsNT<T>();
    };

    return {
        sign,
    };
}

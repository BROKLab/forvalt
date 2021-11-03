import { SIGNER_EVENTS, WalletConnectSigner } from "@symfoni/walletconnect-v2-ethers-signer";
import { providers, Signer } from "ethers";
import { CHAIN_ID, DEFAULT_WALLETCONNECT_METHODS, WALLETCONNECT_METADATA } from "../context/defaults";
var debug = require("debug")("utils:walletconnect");

export type GetWalletConnectSignerParams = {
    provider?: providers.Provider;
    handleURI?: (uri?: string) => void;
    lazy: boolean;
    lazyTimeout: number;
};

export function getWalletConnectSigner(params: GetWalletConnectSignerParams) {
    return new Promise<Signer | undefined>(async (resolve) => {
        let resolved = false;
        let _signer = new WalletConnectSigner({
            methods: DEFAULT_WALLETCONNECT_METHODS,
            chainId: CHAIN_ID,
            walletConnectOpts: {
                metadata: WALLETCONNECT_METADATA,
                // relayProvider: "wss://localhost:5555"
            },
        });
        if (params.provider) {
            _signer = _signer.connect(params.provider);
        }
        if (params.lazy) {
            debug("Fetching WalletConnecting singer WITH lazy flag");
            _signer.on(SIGNER_EVENTS.statusUpdate, (session: any) => {
                if (!resolved) {
                    resolved = true;
                    return resolve(_signer);
                }
            });
            setTimeout(() => {
                if (!resolved && params.lazy) {
                    debug(`No signer received within ${params.lazyTimeout / 1000} seconds, proceeding without signer`);
                    resolved = true;
                    return resolve(undefined);
                }
            }, params.lazyTimeout);
        } else {
            debug("Fetching WalletConnecting singer WITHOUT lazy flag");
            _signer.on(SIGNER_EVENTS.uri, (uri: any) => {
                debug("Fetching WalletConnecting singer requires uri approval");
                debug("uri = ", uri);
                if (params.handleURI) {
                    params.handleURI(uri);
                }
            });

            _signer.on(SIGNER_EVENTS.statusUpdate, (uri: any) => {
                if (params.handleURI) {
                    params.handleURI(undefined);
                }
                resolve(_signer);
            });
        }
        _signer.open({ onlyReconnect: params.lazy });
    });
}

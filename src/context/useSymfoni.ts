/* eslint-disable @typescript-eslint/no-unused-vars */
import { WalletConnectSigner } from "@symfoni/walletconnect-v2-ethers-signer";
import { ethers, providers, Signer as EthersSigner, Wallet } from "ethers";
import { useCallback, useState } from "react";
import { toast } from "react-toastify";
import { useAsyncEffect } from "use-async-effect";
import { SignatureRequestHandler } from "../utils/SignerRequestHandler";
import { getWalletConnectSigner } from "../utils/walletconnect.utils";
import { DEFAULT_PROVIDER, PROVIDERS, ProviderTypes, SIGNERS, SignerTypes } from "./defaults";
import { useContracts } from "./useContracts";

var debug = require("debug")("context:symfoni");

type Signer = EthersSigner | WalletConnectSigner;

export enum STATE {
    INITIALIZING,
    READY,
}

export const useSymfoni = () => {
    // status
    const [state, setState] = useState<STATE>(STATE.INITIALIZING);
    const loading = STATE.INITIALIZING;
    const [lazySigner, setLazySigner] = useState(true);
    const [signerRequestAttempts, setSignerRequestAttempts] = useState(0);

    // network
    const [chainId, setChainId] = useState<number>(undefined!);
    const [address, setAddress] = useState<string>();

    // providers
    const [selectedProvider, setSelectedProvider] = useState<ProviderTypes>(DEFAULT_PROVIDER);
    const [provider, setProvider] = useState<providers.Provider>(undefined!);
    const providers = PROVIDERS;

    // signers
    const [selectedSigner, setSelectedSigner] = useState<SignerTypes>("walletConnect");
    const [signer, setSigner] = useState<Signer | undefined>(undefined);
    const signers = SIGNERS;

    // signer spesific state
    const [walletConnectURI, setWalletConnectURI] = useState<string | undefined>(undefined);
    const [signatureRequestHandler, setSignatureRequestHandler] = useState<SignatureRequestHandler>(() => new SignatureRequestHandler());

    // contracts
    const contracts = useContracts();

    const initSigner = useCallback(
        async (opts: { provider?: ProviderTypes } = {}) => {
            if (opts.provider && opts.provider !== selectedProvider) {
                setSelectedProvider(opts.provider);
            }
            debug(`Setting signer reques attempts from ${signerRequestAttempts} to ${signerRequestAttempts + 1}`);
            setSignerRequestAttempts(signerRequestAttempts + 1);
            setLazySigner(false);
        },
        [selectedProvider, signerRequestAttempts, setSignerRequestAttempts, setLazySigner]
    );

    const closeSigner = async () => {
        if (signer) {
            if ("request" in signer) {
                await signer.close();
                setSigner(undefined);
                localStorage.removeItem("permissionBrokToken");
            } else {
                throw Error("TODO - Not handling closing any other signers");
            }
        }
    };

    const getProvider = useCallback(async () => {
        if (provider) {
            return provider;
        }
        if (selectedProvider === "walletConnect") {
            return new ethers.providers.JsonRpcProvider({
                url: "https://arbitrum-rinkeby.infura.io/v3/0771265f174543dca52bbe282a69397d",
            });
        }
        if (selectedProvider === "hardhat") {
            return new ethers.providers.JsonRpcProvider({
                url: "http://127.0.0.1:8545",
            });
        }
        toast("Could not initiate a provider in Symfoni");
    }, [provider, selectedProvider]);

    const getSigner = useCallback(
        async (_provider?: providers.Provider, _forceSigner?: boolean) => {
            return new Promise<Signer | undefined>(async (resolve) => {
                if (selectedSigner === "walletConnect") {
                    const _signer = await getWalletConnectSigner({
                        lazy: lazySigner,
                        lazyTimeout: 1000,
                        handleURI: setWalletConnectURI,
                        provider: _provider,
                    });
                    resolve(_signer);
                } else if (selectedSigner === "prompt") {
                    const pk = prompt("Set your private key");
                    if (pk && _provider) {
                        const _signer = new Wallet(pk).connect(_provider);
                        resolve(_signer);
                    }
                }
            });
        },
        [lazySigner, selectedSigner]
    );

    useAsyncEffect(
        async (isMounted) => {
            debug(`signerRequestAttempts: ${signerRequestAttempts}`);
            const _provider = await getProvider();
            debug(`Provider ${!!_provider ? "found" : "not found"}`);
            if (!_provider) return;
            const _signer = await getSigner(_provider);
            debug(`Signer ${!!_signer ? "found" : "not found"}`);
            const _address = _signer ? await _signer.getAddress() : undefined;
            const network = await _provider.getNetwork();
            const _chainId = network.chainId;
            if (isMounted()) {
                setChainId(_chainId);
                setProvider(_provider);
                setSigner(_signer);
                setAddress(_address ? _address : undefined);
                contracts.setAuthProvider(contracts.getAuthProvider(_provider, _chainId, _signer));
                contracts.setCapTable(contracts.getCapTable(_provider, _chainId, _signer));
                contracts.setCapTableFactory(contracts.getCapTableFactory(_provider, _chainId, _signer));
                contracts.setCapTableRegistry(contracts.getCapTableRegistry(_provider, _chainId, _signer));
                contracts.setERC1820Registry(contracts.getERC1820Registry(_provider, _chainId, _signer));
                contracts.setERC1400AuthValidator(contracts.getERC1400AuthValidator(_provider, _chainId, _signer));
                setState(STATE.READY);
            } else {
                debug(`symfoni init was not subscribed`);
            }
        },
        [lazySigner, signerRequestAttempts]
    );

    return {
        state,
        loading,
        walletConnectURI,
        setWalletConnectURI,
        lazySigner,
        setLazySigner,
        signer,
        signatureRequestHandler,
        initSigner,
        address,
        chainId,
        closeSigner,
        ...contracts,
    };
};

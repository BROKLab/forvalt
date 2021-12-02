import { useSign } from "./useSign";

export function useSignAccessVP() {
    const { sign } = useSign();

    const signAccessVP = async () => {
        const url = process.env.REACT_APP_USE_LOCAL_ENVIROMENT === "true" ? "http://localhost:3004" : process.env.REACT_APP_BROK_HELPERS_URL;
        return sign<{ jwt: string }[]>(
            "symfoniID_accessVP",
            "Gi Brønnøysundregistrene Forvalt applikasjonen tilgang til å gjøre spørringer på dine vegne",
            [
                {
                    verifier: process.env.BROK_HELPERS_VERIFIER,
                    access: {
                        delegatedTo: {
                            id: process.env.REACT_APP_PUBLIC_URL,
                            name: "Brønnøysundregistrene Aksjeeierbok",
                        },
                        scopes: [
                            {
                                id: `${url}/captable/:captableAddress/shareholder/list`,
                                name: "Lese alle aksjonærer",
                            },
                            {
                                id: `${url}/captable/:captableAddress/shareholder/:shareholderId`,
                                name: "Lese detaljer om aksjonærer",
                            },
                            {
                                id: `${url}/unclaimed/list`,
                                name: "Lese alle dine private aksjer",
                            },
                        ],
                    },
                },
            ]
        );
    };

    return {
        signAccessVP,
    };
}

// TODO - Normalize types and responses
import axios, { AxiosError } from "axios";
import { ethers } from "ethers";

// HTTP types
export interface GetAuthChallengeTokenReponse {
  challengeToken: string;
}
export interface GetAuthAuthTokenResponse {
  authToken: string;
}
export interface GetBrregUnclaimedResponse {
  address: string;
}
export interface AuthProviderErrorResponse {
  message: string;
  code: number;
}
export interface GetBrregUnclaimListResponse {
  addresses: AuthProviderAddress[];
}

export interface GetUserNamesResponse {
  names: {
    [address: string]: string;
  };
}

// Types
export interface AuthProviderAddress {
  active: boolean;
  address: string;
  unclaimed?: AuthProviderUnclaimed;
}
export interface AuthProviderUser {
  addresses: AuthProviderAddress[];
  id: number;
  name: string;
  uuid: string;
}

export interface AuthProviderUnclaimed {
  id: number;
  sourceId?: number;
  contract?: string;
  protocol?: string;
  claimed: Date;
  proof?: string;
  addressAddress: string;
}

export function authProviderURL() {
  const AUTH_PROVIDER_URL = process.env.REACT_APP_AUTH_PROVIDER_URL;
  if (!AUTH_PROVIDER_URL) {
    throw Error("Please set REACT_APP_AUTH_PROVIDER_URL in env variable");
  }
  return AUTH_PROVIDER_URL;
}

export async function getChallengeToken(address: string): Promise<string> {
  if (!ethers.utils.isAddress(address)) {
    throw Error("Address provided is not considered an address");
  }
  const challenge = await axios
    .get<GetAuthChallengeTokenReponse>(
      authProviderURL() + "/auth/get-challenge-token",
      {
        params: {
          address,
        },
      }
    )
    .catch((error: AxiosError<AuthProviderErrorResponse>) => {
      if (error.response && error.response.data.message) {
        throw Error(error.response.data.message);
      }
      throw Error(error.message);
    });
  if (challenge.status === 200) {
    if (challenge.data.challengeToken) {
      return challenge.data.challengeToken;
    }
  }
  throw Error("Response did not include an challenge token.");
}

export async function signToken(token: string, signer: ethers.Signer) {
  const tokenHash = ethers.utils.id(token);
  const tokenHashBytes = ethers.utils.arrayify(tokenHash);
  const signature = await signer.signMessage(tokenHashBytes);
  return signature;
}

export async function getAuthToken(
  signature: string,
  challengeToken: string
): Promise<string> {
  const challenge = await axios
    .get<GetAuthAuthTokenResponse>(authProviderURL() + "/auth/get-auth-token", {
      params: {
        signature,
        challengeToken,
      },
    })
    .catch((error: AxiosError<AuthProviderErrorResponse>) => {
      if (error.response && error.response.data.message) {
        throw Error(error.response.data.message);
      }
      throw Error(error.message);
    });
  if (challenge.status === 200) {
    if (challenge.data.authToken) {
      return challenge.data.authToken;
    }
  }
  throw Error("Response did not include an auth token.");
}

export async function signChallengeAndVerify(
  challengeToken: string,
  signer: ethers.Signer
) {
  const signature = await signToken(challengeToken, signer);
  const authToken = await getAuthToken(signature, challengeToken);
  return authToken;
}

export async function getUserMe(authToken: string) {
  const me = await axios
    .get<any>(authProviderURL() + "/auth/me", {
      headers: {
        Authorization: "Bearer " + authToken,
      },
    })
    .catch((error: AxiosError<AuthProviderErrorResponse>) => {
      if (error.response && error.response.data.message) {
        throw Error(error.response.data.message);
      }
      throw Error(error.message);
    });
  if (me.status === 200) {
    if (me.data) {
      return me.data;
    }
  }
  throw Error("Response did not include an auth token.");
}

export async function unclaimed(
  authToken: string,
  contract: string,
  protocol: string,
  uuidHash: string,
  name?: string
) {
  const res = await axios
    .get<GetBrregUnclaimedResponse>(authProviderURL() + "/brreg/unclaimed", {
      headers: {
        Authorization: "Bearer " + authToken,
      },
      params: {
        contract,
        protocol,
        uuidHash,
        name,
      },
    })
    .catch((error: AxiosError<AuthProviderErrorResponse>) => {
      if (error.response && error.response.data.message) {
        throw Error(error.response.data.message);
      }
      throw Error(error.message);
    });
  if (res.status === 200) {
    if (res.data) {
      return res.data;
    }
  }
  throw Error("Response did not include an auth token.");
}

export async function unclaimedList(authToken: string) {
  const res = await axios
    .get<AuthProviderAddress>(authProviderURL() + "/brreg/unclaimed/list", {
      headers: {
        Authorization: "Bearer " + authToken,
      },
    })
    .catch((error: AxiosError<AuthProviderErrorResponse>) => {
      if (error.response && error.response.data.message) {
        throw Error(error.response.data.message);
      }
      throw Error(error.message);
    });
  if (res.status === 200) {
    if (res.data) {
      return res.data;
    }
  }
  throw Error("Response did not include an auth token.");
}

export async function userNames(authToken: string, addresses: string[]) {
  const res = await axios
    .get<GetUserNamesResponse>(authProviderURL() + "/user/names", {
      headers: {
        Authorization: "Bearer " + authToken,
      },
      params: {
        addresses,
      },
    })
    .catch((error: AxiosError<AuthProviderErrorResponse>) => {
      if (error.response && error.response.data.message) {
        throw Error(error.response.data.message);
      }
      throw Error(error.message);
    });
  if (res.status === 200) {
    if (res.data) {
      return res.data;
    }
  }
  throw Error("Response did not include an auth token.");
}

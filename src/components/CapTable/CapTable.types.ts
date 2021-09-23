export module CapTableTypes {
  export module CapTableQuery {
    export interface Balance {
      amount: string;
      id: string;
      partition: string;
    }

    export interface TokenHolder {
      address: string;
      balances: Balance[];
      id: string;
    }

    export interface CapTable {
      controllers: string[];
      id: string;
      minter: string;
      name: string;
      orgnr: string;
      owner: string;
      partitions: string[];
      status: string;
      symbol: string;
      tokenHolders: TokenHolder[];
      totalSupply: string;
    }

    export interface Data {
      capTable: CapTable;
    }
  }
  export module BalancesQuery {
    export interface CapTable {
      partitions: string[];
      totalSupply: string;
      owner: string;
    }

    export interface TokenHolder {
      address: string;
    }

    export interface Balance {
      amount: string;
      capTable: CapTable;
      partition: string;
      tokenHolder: TokenHolder;
    }

    export interface RootObject {
      balances: Balance[];
    }
  }

  export module Queries {
    export const CAP_TABLE_QUERY = (address: string) => `{
        capTable(id: "${address}") {
            id
            name
            orgnr
            symbol
            status
            partitions
            owner
            minter
            controllers
            totalSupply
            tokenHolders {
              id
              address
              balances {
                id
                amount
                partition
              }
            }
          }
      }`;
    export const BALANCES_QUERY = (address: string) => `
      {
          balances(where: {capTable: "${address}"}) {
            amount
            partition
            tokenHolder {
              address
            }
            capTable {
              totalSupply
              owner
              partitions
            }
          }
        }
        `;
  }
}

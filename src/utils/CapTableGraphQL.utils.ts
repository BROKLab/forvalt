export declare module CapTableGraphQLTypes {
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
            boardDirector: string;
        }

        export interface Response {
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

        export interface Response {
            balances: Balance[];
        }
    }
}

export class CapTableGraphQL {
    static CAP_TABLE_QUERY(address: string) {
        return `{
      capTable(id: "${address.toLowerCase()}") {
          id
          name
          orgnr
          symbol
          status
          partitions
          owner
          minter
          controllers
          boardDirector
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
    }
    static BALANCES_QUERY(address: string) {
        return `
    {
        balances(where: {capTable: "${address.toLowerCase()}"}) {
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

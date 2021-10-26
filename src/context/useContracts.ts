import { useState } from "react";
import { SymfoniAuthProvider, getAuthProvider } from "./contracts/AuthProvider";
import { SymfoniCapTable, getCapTable } from "./contracts/CapTable";
import { SymfoniCapTableFactory, getCapTableFactory } from "./contracts/CapTableFactory";
import { SymfoniCapTableRegistry, getCapTableRegistry } from "./contracts/CapTableRegistry";
import { SymfoniERC1400AuthValidator, getERC1400AuthValidator } from "./contracts/ERC1400AuthValidator";
import { SymfoniERC1820Registry, getERC1820Registry } from "./contracts/ERC1820Registry";

export const useContracts = () => {
    const [CapTable, setCapTable] = useState<SymfoniCapTable>(undefined!);
    const [AuthProvider, setAuthProvider] = useState<SymfoniAuthProvider>(undefined!);
    const [ERC1820Registry, setERC1820Registry] = useState<SymfoniERC1820Registry>(undefined!);
    const [CapTableFactory, setCapTableFactory] = useState<SymfoniCapTableFactory>(undefined!);
    const [CapTableRegistry, setCapTableRegistry] = useState<SymfoniCapTableRegistry>(undefined!);
    const [ERC1400AuthValidator, setERC1400AuthValidator] = useState<SymfoniERC1400AuthValidator>(undefined!);

    return {
        CapTable,
        AuthProvider,
        ERC1820Registry,
        CapTableFactory,
        CapTableRegistry,
        ERC1400AuthValidator,
        setCapTable,
        setAuthProvider,
        setERC1820Registry,
        setCapTableFactory,
        setCapTableRegistry,
        setERC1400AuthValidator,
        getCapTable,
        getAuthProvider,
        getERC1820Registry,
        getCapTableFactory,
        getCapTableRegistry,
        getERC1400AuthValidator,
    };
};

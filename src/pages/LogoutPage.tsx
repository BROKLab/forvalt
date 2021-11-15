import React, { useContext, useEffect } from "react";
import { Redirect } from "react-router";
import { BrokContext } from "../context/BrokContext";
import { SymfoniContext } from "../context/SymfoniContext";
var debug = require("debug")("component:LogoutPage");

export function LogoutPage() {
    const { closeSigner } = useContext(SymfoniContext);
    const { setToken } = useContext(BrokContext);

    useEffect(() => {
        debug("Closing WC connection");
        closeSigner();
        setToken("");
    }, [closeSigner, setToken]);

    return <Redirect to={"/"} />;
}

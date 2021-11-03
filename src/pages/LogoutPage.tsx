import React, { useContext, useEffect } from "react";
import { Redirect } from "react-router";
import { SymfoniContext } from "../context/SymfoniContext";
var debug = require("debug")("component:LogoutPage");

export function LogoutPage() {
    const { closeSigner } = useContext(SymfoniContext);

    useEffect(() => {
        debug("Closing WC connection");
        closeSigner();
    }, [closeSigner]);

    return <Redirect to={"/"} />;
}
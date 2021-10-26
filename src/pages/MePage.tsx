import { Heading } from "grommet";
import React, { useContext } from "react";
import { useAsyncEffect } from "use-async-effect";
import { SymfoniContext } from "../context/SymfoniContext";
var debug = require("debug")("page:me");

interface Props {}

export const MePage: React.FC<Props> = () => {
    const { setLazySigner, lazySigner } = useContext(SymfoniContext)
    useAsyncEffect((isMounted) => {
        debug(`lazySigner => ${lazySigner}`)
        setLazySigner(false)
    })
    return (
        <>
            <Heading level={3}>
                Mine aksjer
            </Heading>
        </>
    );
};

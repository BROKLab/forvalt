import { Box, Button, DateInput, FormField, Heading, Layer, TextInput } from "grommet";
import React from "react";
import { Controller, useForm } from "react-hook-form";
import { UpdateShareholderData } from "./CapTableBalances";

var debug = require("debug")("utils:SignatureRequestModal");

interface Props {
    updateShareholderData: UpdateShareholderData;
    onConfirm: (updateShareholderData: UpdateShareholderData) => void;
    onDismiss: () => void;
}

export const EditShareholderModal: React.FC<Props> = ({ ...props }) => {
    const defaultValues = props.updateShareholderData;
    const { getValues, control, register } = useForm({ defaultValues });

    const handleOnSubmit = () => {
        debug("onSubmut", {
            ...getValues(),
            birthdate: new Date(getValues().birthdate).toLocaleDateString("no-NO", {
                year: "numeric",
                month: "2-digit",
                day: "2-digit",
            })
        })
        const updated = {
            ...getValues(),
            birthdate: new Date(getValues().birthdate).toLocaleDateString("no-NO", {
                year: "numeric",
                month: "2-digit",
                day: "2-digit",
            }),
        };
        props.onConfirm(updated);
    };

    const formDateToIsoString = (date: string) => {
        const newDate = new Date(date);
        const dateInEpochMilliseconds = newDate.getTime() + newDate.getTimezoneOffset() * 60 * 1000 * -1;
        const time = new Date(dateInEpochMilliseconds);
        time.setHours(6);
        return time.toISOString();
    };

    return (
        <Layer onEsc={() => props.onDismiss()} onClickOutside={() => props.onDismiss()} animation="slide" modal position="center">
            <Box margin="large" align="center">
                <Heading level="3">Rediger informasjon</Heading>
                <Box>
                    <FormField name="name" label="Navn">
                        <TextInput {...register("name")} type="string" placeholder={defaultValues.name}></TextInput>
                    </FormField>
                    <FormField name="email" label="Epost">
                        <TextInput {...register("email")} type="string" placeholder={defaultValues.email}></TextInput>
                    </FormField>
                    <FormField name="birthday" label="Født">
                        <Controller
                            {...register("birthdate")}
                            control={control}
                            name="birthdate"
                            render={({ field }) => (
                                <DateInput
                                    format="dd.mm.yyyy"
                                    type="datetime"
                                    ref={field.ref}
                                    value={field.value}
                                    placeholder={defaultValues.birthdate}
                                    onChange={(date) => {
                                        field.onChange(formDateToIsoString(date.value as string));
                                    }}></DateInput>
                            )}
                        />
                    </FormField>
                    <FormField name="postcode" label="Postkode">
                        <TextInput {...register("postcode")} type="number" placeholder={defaultValues.postcode}></TextInput>
                    </FormField>
                    <FormField name="By" label="By">
                        <TextInput {...register("city")} type="string" placeholder={defaultValues.city}></TextInput>
                    </FormField>
                </Box>

                <Box margin="medium" direction="row" gap="medium">
                    <Button size="small" label="Lukk" onClick={() => props.onDismiss()} />
                    <Button color="black" label={"Send inn"} style={{ borderRadius: "0px" }} onClick={() => handleOnSubmit()}></Button>
                </Box>
            </Box>
        </Layer>
    );
};

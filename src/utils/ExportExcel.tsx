import { ethers } from "ethers";
import * as FileSaver from "file-saver";
import { Box, Button, RadioButtonGroup } from "grommet";
import React, { useState } from "react";
import * as XLSX from "xlsx";
import { CapTableBalance } from "../context/BrokContext";
import { CapTableGraphQLTypes } from "./CapTableGraphQL.utils";

interface FileType {
    value: string;
    metadata: string;
    bookType: XLSX.BookType;
}

const CSV: FileType = {
    value: "csv",
    metadata: "text/csv;charset=utf-8",
    bookType: "csv",
};
const Excel: FileType = {
    value: "Excel",
    metadata: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet;charset=UTF-8",
    bookType: "xlsx",
};

interface Props {
    data: CapTableBalance[];
    capTableName: string;
}

const getDateString = () => {
    const date = new Date();

    console.log(date);
    const day = date.getDate();
    const month = date.getMonth() + 1;
    const year = date.getFullYear();
    return `${day}-${month}-${year}`;
};

export const ExportExcel: React.FC<Props> = ({ ...props }) => {
    const [fileType, setFileType] = useState<FileType>(Excel);

    const exportToCSV = (balances: CapTableGraphQLTypes.BalancesQuery.Balance[]) => {
        const fileName = `aksjeeierbok_${props.capTableName.replaceAll(" ", "_").toLocaleLowerCase()}_${getDateString()}.`;
        const ws = XLSX.utils.json_to_sheet(
            balances.map((bl) => {
                return {
                    aksjer: ethers.utils.formatEther(bl.amount),
                    adresse: bl.tokenHolder.address,
                    klasse: bl.partition,
                };
            })
        );
        const wb = { Sheets: { data: ws }, SheetNames: ["data"] };
        const excelBuffer = XLSX.write(wb, {
            bookType: fileType.bookType,
            type: "array",
        });
        const data = new Blob([excelBuffer], { type: fileType.metadata });
        FileSaver.saveAs(data, fileName + fileType.bookType);
    };

    const setType = (value: string) => {
        if (value === CSV.value) {
            setFileType(CSV);
        } else if (value === Excel.value) {
            setFileType(Excel);
        }
    };

    return (
        <Box direction="row" alignSelf="end" gap="small" pad="small">
            <RadioButtonGroup
                style={{
                    display: "flex",
                    flexDirection: "row",
                    minWidth: 180,
                    justifyContent: "space-between",
                }}
                name="fileType"
                options={[CSV.value, Excel.value]}
                value={fileType.value}
                onChange={(event) => setType(event.target.value)}
            />
            <Button primary size="small" label="EKSPORTER" onClick={(e) => exportToCSV(props.data)} />
        </Box>
    );
};

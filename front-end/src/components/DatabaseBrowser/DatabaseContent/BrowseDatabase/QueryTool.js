import React, {useEffect, useState} from "react";
import {getCookie} from "../../../getCookie";
import QueryLogger from './QueryLogger';
import Select from '@mui/material/Select';
import {Button, FormControl, InputLabel, MenuItem, OutlinedInput} from "@mui/material";
import Checkbox from '@mui/material/Checkbox';
import ListItemText from '@mui/material/ListItemText';
import TableBrowserNew from "./TableBrowserNew";

const ITEM_HEIGHT = 48;
const ITEM_PADDING_TOP = 8;
const MenuProps = {
    PaperProps: {
        style: {
            maxHeight: ITEM_HEIGHT * 4.5 + ITEM_PADDING_TOP,
            width: 250,
        },
    },
};

async function fetchAvailableDatabases(userName) {
    const response = await fetch(
        "http://localhost:8080/api/databaseinfo/getfoldermap/" + userName
    );
    const data = await response.json();
    const databases = extractDatabaseNames(data);
    const columnsByDatabase = {};

    data.forEach((entry) => {
        const [database, table, column] = entry.split(",", 3);
        if (database && table && column) {
            if (!columnsByDatabase[database]) {
                columnsByDatabase[database] = [];
            }
            columnsByDatabase[database].push(column);
        }
    });

    return { databases, columnsByDatabase };
}

function extractDatabaseNames(data) {
    const databaseNames = new Set();

    data.forEach((entry) => {
        const parts = entry.split(",");
        if (parts.length >= 1) {
            databaseNames.add(parts[0]);
        }
    });

    return Array.from(databaseNames);
}

async function fetchColumnsForTable(userName, database, table) {
    const response = await fetch(
        `http://localhost:8080/api/tableinfo/getColumns/${userName}/${database}/${table}`
    );
    return await response.json();
}

async function fetchPrimaryKeyName(database, table) {
    const url = `http://localhost:8080/api/tableinfo/getKey/${database}/${table}`
    const response = await fetch(url);
    return await response.text();
}

async function runQuery(database, table, columns) {
    try {
        const requestBody = { database, table, columns: [...columns] };

        const url = 'http://localhost:8080/api/tableinfo/getAllFields';
        const startTime = performance.now();
        const response = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(requestBody)
        });
        const endTime = performance.now();
        const fetchTime = endTime - startTime;

        if (!response.ok) {
            throw new Error(`Request failed with status ${response.status}`);
        }

        const result = await response.json();
        return { result, fetchTime };
    } catch (error) {
        console.error(`Error: ${error.message}`);
        return null;
    }
}

const QueryTool = ({selectedDbTable}) => {
    let info;
    info = ["", ""];
    if (selectedDbTable) {
        info = selectedDbTable.split(",");
    }

    const [availableDatabases, setAvailableDatabases] = useState([]);
    const [columnsByDatabase, setColumnsByDatabase] = useState([]);
    const [selectedDatabase, setSelectedDatabase] = useState(info[0]);
    const [selectedTable, setSelectedTable] = useState(info[1]);
    const [tablesForSelectedDatabase, setTablesForSelectedDatabase] = useState([]);
    const [availableColumns, setAvailableColumns] = useState([]);
    const [selectedColumns, setSelectedColumns] = useState([]);
    const [isButtonPressed, setIsButtonPressed] = useState(false);
    const [queryResult, setQueryResult] = useState([]);
    
    const [primaryKeyName, setPrimaryKeyName] = useState("");

    const [tableBrowserKey, setTableBrowserKey] = useState(0);

    const logger = QueryLogger.getInstance();

    const userName = getCookie("userName");

    function handleSelectOne(event) {
        setSelectedDatabase(event.target.value);
    }

    function handleSelectTwo(event) {
        setSelectedTable(event.target.value);
    }

    function handleSelectThree(event) {
        // logger.addLog(`Selected from ${selectedDatabase} database and ${selectedDbTable} fields ${selectedColumns}`);
        setSelectedColumns(event.target.value);
    }

    const handleButtonPress = () => {
        setIsButtonPressed(!isButtonPressed);
    };

    useEffect(() => {
        if (selectedDatabase) {
            fetch(
                `http://localhost:8080/api/tableinfo/getTables/${userName}/${selectedDatabase}`
            )
                .then((response) => response.json())
                .then((data) => setTablesForSelectedDatabase(data))
                .catch((error) =>
                    console.error("Error fetching tables for the selected database:", error)
                );
        }
    }, [userName, selectedDatabase]);

    useEffect(() => {
        setAvailableColumns([]);

        if (selectedTable) {
            fetchColumnsForTable(userName, selectedDatabase, selectedTable)
                .then((response) => {
                    setAvailableColumns(response);
                })
                .catch((error) =>
                    console.error("Error fetching columns for the selected table:", error)
                );
        }
    }, [selectedDatabase, selectedTable, userName]);

    useEffect(() => {
        if (availableColumns.length > 0) {
            setSelectedColumns(availableColumns);
        }
    }, [availableColumns]);

    useEffect(() => {
        if (selectedDatabase && selectedTable) {
            fetchPrimaryKeyName(selectedDatabase, selectedTable)
                .then((response) => {
                    setPrimaryKeyName(response);
                })
                .catch((error) =>
                    console.error("Error fetching columns for the selected table:", error)
                );
        }
    }, [selectedDatabase, selectedTable]);

    useEffect(() => {
        fetchAvailableDatabases(userName)
            .then(({ databases, columnsByDatabase }) => {
                setAvailableDatabases(databases);
                setColumnsByDatabase(columnsByDatabase);
            })
            .catch((error) => console.error("Error fetching databases:", error));
    }, [userName, selectedDbTable]);
    
    return (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}>
            <div style={{ display: 'flex', alignItems: 'center' }}>
                <Select
                    labelId="demo-simple-select-label"
                    id="demo-simple-select"
                    value={selectedDatabase}
                    label="Select Option"
                    onChange={handleSelectOne}
                    variant={"outlined"}
                >
                    {availableDatabases.map((option, index) => (
                        <MenuItem key={index} value={option}>
                            {option}
                        </MenuItem>
                    ))}
                </Select>
                {selectedDatabase && (
                    <Select
                        labelId="demo-simple-select-table"
                        id="demo-simple-table"
                        value={selectedTable}
                        label="Select Table"
                        onChange={handleSelectTwo}
                        variant={"outlined"}
                    >
                        {tablesForSelectedDatabase.map((option, index) => (
                            <MenuItem key={index} value={option}>
                                {option}
                            </MenuItem>
                        ))}
                    </Select>
                )}
                {selectedTable && (
                    <div>
                        <FormControl sx={{ m: 1, width: 300 }}>
                            <InputLabel id="demo-multiple-checkbox-label">All columns selected by default!</InputLabel>
                            <Select
                                labelId="demo-multiple-checkbox-label"
                                id="demo-multiple-checkbox"
                                multiple
                                value={selectedColumns}
                                onChange={handleSelectThree}
                                input={<OutlinedInput label="All columns selected by default!" />}
                                renderValue={(selected) => selected.join(', ')}
                                MenuProps={MenuProps}
                            >
                                {availableColumns.map((name) => (
                                    <MenuItem key={name} value={name}>
                                        <Checkbox checked={selectedColumns.includes(name)} />
                                        <ListItemText primary={name} />
                                    </MenuItem>
                                ))}
                            </Select>
                        </FormControl>
                        <Button
                            variant="contained"
                            style={{ marginLeft: 16 }}
                            onClick={() => {
                                runQuery(selectedDatabase, selectedTable, selectedColumns)
                                    .then(result => {
                                        setQueryResult(result);
                                        setIsButtonPressed(true);
                                        setTableBrowserKey(prevKey => prevKey + 1);
                                    })
                                    .catch(error => {
                                        console.error(error);
                                    });
                            }}
                        >
                            Fetch Data
                        </Button>
                    </div>
                )}
            </div>
            {isButtonPressed && (
                <div style={{ marginTop: '16px' }}>
                    <TableBrowserNew
                        key={tableBrowserKey}
                        data={queryResult.result}
                        fetchTime={-1}
                        tableName={selectedTable}
                        databaseName={selectedDatabase}
                        selectedColumns={selectedColumns}
                        primaryKey={primaryKeyName}
                    />
                </div>
            )}
        </div>
    );

};

export default QueryTool;

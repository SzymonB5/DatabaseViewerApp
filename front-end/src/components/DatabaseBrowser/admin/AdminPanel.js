import React, {useEffect, useState} from "react";
import {getCookie} from "../../getCookie";
import Select from "@mui/material/Select";
import {Button, Grid, List, ListItemButton, ListItemIcon, MenuItem, Paper} from "@mui/material";
import Checkbox from "@mui/material/Checkbox";
import ListItemText from "@mui/material/ListItemText";


const AdminPanel = () => {
    const [selectedSubordinate, setSelectedSubordinate] = useState("");
    const [subordinates, setSubordinates] = useState([]);

    const [availableDatabases, setAvailableDatabases] = useState([]);
    const [selectedDatabase, setSelectedDatabase] = useState("");

    const [availableTables, setAvailableTables] = useState([]);
    const [allowedTables, setAllowedTables] = useState([]);

    const [initialAvailableTables, setInitialAvailableTables] = useState([]);
    const [initialAllowedTables, setInitialAllowedTables] = useState([]);

    const [checked, setChecked] = React.useState([]);

    const leftChecked = intersection(checked, availableTables);
    const rightChecked = intersection(checked, allowedTables);
    const adminName = getCookie("userName");

    const handleToggle = (value) => () => {
        const currentIndex = checked.indexOf(value);
        const newChecked = [...checked];

        if (currentIndex === -1) {
            newChecked.push(value);
        } else {
            newChecked.splice(currentIndex, 1);
        }

        setChecked(newChecked);
    };

    function not(a, b) {
        return a.filter((value) => !b.includes(value));
    }

    function intersection(a, b) {
        return a.filter((value) => b.includes(value));
    }

    const getSubordinates = async () => {
        const response = await fetch(
            `http://localhost:8080/api/userinfo/getsubordinates/${adminName}`
        );
        const data = await response.json();
        console.log(data);
        setSubordinates(data);
    };

    useEffect(() => {
        getSubordinates();
    }, []);

    const getDatabase = async () => {
        const response = await fetch(
            `http://localhost:8080/api/tableinfo/getAvailableDatabasesObject/${adminName}`
        );
        const data = await response.json();
        console.log(data);
        setAvailableDatabases(data);
    };

    useEffect(() => {
        getDatabase();
    }, []);

    const customList = (tablesInfo) => ( // TODO Customize
        <Paper sx={{ width: 300, height: 360, overflow: 'auto' }}>
            <List dense component="div" role="list">
                {tablesInfo.map((val) => {
                    const labelID = `list-${val}`;

                    return (
                        <ListItemButton
                            key={val}
                            onClick={handleToggle(val)}
                            role="listitem"
                        >
                            <ListItemIcon>
                                <Checkbox
                                    checked={checked.includes(val)}
                                    inputProps={{
                                        'aria-labelledby': labelID,
                                    }}
                                    tabIndex={-1}
                                    disableRipple
                                />
                            </ListItemIcon>
                            <ListItemText id={labelID} primary={`Table: ${val}`} />
                        </ListItemButton>
                    );
                })}
            </List>
        </Paper>
    );

    const handleSelect = async () => {
        const response = await fetch(
            `http://localhost:8080/api/tableinfo/getAvailableTablesAndDatabases/${adminName}/${selectedSubordinate}/${selectedDatabase}`
        );
        const availableTables = await response.json();
        console.log(availableTables);

        const response2 = await fetch(
            `http://localhost:8080/api/tableinfo/getAllowedTablesAndDatabases/${adminName}/${selectedSubordinate}/${selectedDatabase}`
        );

        const allowedTables = await response2.json();
        console.log(allowedTables);

        setAvailableTables(availableTables);
        setAllowedTables(allowedTables);
        setInitialAvailableTables(availableTables);
        setInitialAllowedTables(allowedTables);
    };

    const handleSelectDatabase = async (event) => {
        console.log(event.target.value);
        setSelectedDatabase(event.target.value);
    }

    const handleSelectSubordinate = async (event) => {
        console.log(event.target.value)
        setSelectedSubordinate(event.target.value)
    }

    useEffect(() => {
        if (selectedDatabase !== "" && selectedSubordinate !== "") {
            handleSelect().then(r => {});
        }
    }, [selectedSubordinate, selectedDatabase]);

    const handleAllRight = () => {
        setAllowedTables(allowedTables.concat(availableTables));
        setAvailableTables([]);
    };

    const handleCheckedRight = () => {
        console.log(leftChecked);
        setAllowedTables(allowedTables.concat(leftChecked));
        setAvailableTables(not(availableTables, leftChecked));
        setChecked(not(checked, leftChecked));
    };

    const handleCheckedLeft = () => {
        console.log(rightChecked);
        setAvailableTables(availableTables.concat(rightChecked));
        setAllowedTables(not(allowedTables, rightChecked));
        setChecked(not(checked, rightChecked));
    };

    const handleAllLeft = () => {
        setAvailableTables(availableTables.concat(allowedTables));
        setAllowedTables([]);
    };

    function DEBUG() {
        let toRemoveTables = availableTables.filter(item => !initialAllowedTables.includes(item));
        let toInsertTables= initialAllowedTables.filter(item => !availableTables.includes(item));

        toRemoveTables = availableTables.filter(item => !toRemoveTables.includes(item))
        toInsertTables = allowedTables.filter(item => !toInsertTables.includes(item));
        console.log(toRemoveTables);
        console.log(toInsertTables);

        fetch(`http://localhost:8080/api/ownershipdetails/delete/${selectedSubordinate}/${adminName}/${selectedDatabase}?tableNames=${toRemoveTables.join('&tableNames=')} `, {
            method: 'DELETE'
        })
            .then(response => response.text())
            .then(data => console.log(data));

        fetch(`http://localhost:8080/api/ownershipdetails/add/${selectedSubordinate}/${adminName}/${selectedDatabase}?tableNames=${toInsertTables.join('&tableNames=')} `, {
            method: 'POST'
        })
            .then(response => response.text())
            .then(data => console.log(data));
    }

    return (
        <div style={{ marginLeft: '20px' }}>
            <Button
                onClick={DEBUG}
            >
                DEBUG
            </Button>
            <Select
                labelId="demo-simple-select-table"
                id="demo-simple-table"
                label="Select Subordinate"
                variant={"outlined"}

                value={selectedSubordinate}
                onChange={handleSelectSubordinate}
            >
                <option>Select a subordinate</option>
                {subordinates.map((subordinate) => (
                    <MenuItem key={subordinate.id} value={subordinate.username}>
                        {subordinate.username}
                    </MenuItem>
                ))}
            </Select>

            <Select
                labelId="demo-simple-select-table"
                id="demo-simple-table"
                label="Select Table"
                variant={"outlined"}

                value={selectedDatabase}
                onChange={handleSelectDatabase}
            >
                <option>Select a table</option>
                {availableDatabases.map((database) => (
                    <MenuItem key={database.id} value={database.databaseName}>
                        {database.databaseName}
                    </MenuItem>
                ))}
            </Select>
            {
                selectedDatabase !== "" && selectedSubordinate !== "" && (
                    <div>
                        <h1>Select desired database:</h1>
                        <p>Selected subordinate: {selectedSubordinate}</p>
                        <p>Selected subordinate: {selectedDatabase}</p>
                        <Grid
                            container
                            spacing={2}
                            sx={{ justifyContent: 'center', alignItems: 'center' }}
                        >
                            <Grid item>{customList(availableTables)}</Grid>
                            <Grid item>
                                <Grid container direction="column" sx={{ alignItems: 'center' }}>
                                    <Button
                                        sx={{ my: 0.5 }}
                                        variant="outlined"
                                        size="small"
                                        onClick={handleAllRight}
                                        disabled={availableTables.length === 0}
                                        aria-label="move all right"
                                    >
                                        ≫
                                    </Button>
                                    <Button
                                        sx={{ my: 0.5 }}
                                        variant="outlined"
                                        size="small"
                                        onClick={handleCheckedRight}
                                        disabled={leftChecked.length === 0}
                                        aria-label="move selected right"
                                    >
                                        &gt;
                                    </Button>
                                    <Button
                                        sx={{ my: 0.5 }}
                                        variant="outlined"
                                        size="small"
                                        onClick={handleCheckedLeft}
                                        disabled={rightChecked.length === 0}
                                        aria-label="move selected left"
                                    >
                                        &lt;
                                    </Button>
                                    <Button
                                        sx={{ my: 0.5 }}
                                        variant="outlined"
                                        size="small"
                                        onClick={handleAllLeft}
                                        disabled={allowedTables.length === 0}
                                        aria-label="move all left"
                                    >
                                        ≪
                                    </Button>
                                </Grid>
                            </Grid>
                            <Grid item>{customList(allowedTables)}</Grid>
                        </Grid>
                    </div>

                )
            }

        </div>
    );
};

export default AdminPanel;

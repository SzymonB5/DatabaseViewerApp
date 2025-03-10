import { getCookie } from "../../../getCookie";
import React, { useEffect, useState } from "react";
import "./Statictics.css";
import Select from "@mui/material/Select";
import MenuItem from "@mui/material/MenuItem";
import {Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend} from 'recharts';
import {
    Container,
    Dialog, DialogActions,
    DialogContent,
    DialogContentText,
    DialogTitle,
    FormControl, IconButton,
    InputLabel,
    Paper, SnackbarContent,
    TextField
} from '@mui/material';
import ListItem from '@mui/material/ListItem';
import ListItemText from '@mui/material/ListItemText';
import { FixedSizeList } from 'react-window';
import { Typography, Box, Grid2} from '@mui/material';
import Button from "@mui/material/Button";
import { BarChart } from '@mui/x-charts/BarChart';
import { RichTreeView } from '@mui/x-tree-view/RichTreeView';
import {motion} from "framer-motion";
import Snackbar from "@mui/material/Snackbar";
import MuiAlert from "@mui/material/Alert";
import {InfoIcon} from "lucide-react";
import CloseIcon from "@mui/icons-material/Close";
import ErrorIcon from "@mui/icons-material/Error";
import { Brush } from 'recharts';
import html2canvas from 'html2canvas';

const Statistics = () => {
    const [databases, setDatabases] = useState([]);
    const [selectedDatabase, setSelectedDatabase] = useState('');
    const [tables, setTables] = useState([]);
    const [selectedTable, setSelectedTable] = useState('');
    const [databaseStatistics, setDatabaseStatistics] = useState({});

    const [xPlot, setXPlot] = useState([]);
    const [yPlot, setYPlot] = useState([]);

    const [selectedColumn1, setSelectedColumn1] = useState('');
    const [selectedColumn2, setSelectedColumn2] = useState('');

    const [generateGraphClicked, setGenerateGraphClicked] = useState(false);
    const [generateHistogramClicked, setGenerateHistogramClicked] = useState(false);

    const [description, setDescription] = useState('');
    const [openDialog, setOpenDialog] = useState(false);

    const [openSnackbar, setOpenSnackbar] = useState(false);
    const [message, setMessage] = useState("");

    const [errorMessage, setErrorMessage] = useState("");
    const [openErrorSnackbar, setOpenErrorSnackbar] = useState("");

    const [showPlot, setShowPlot] = useState(false);

    const [isReady, setIsReady] = useState(false);

    const handleCloseErrorSnackbar = () => {
        setOpenErrorSnackbar(false);
    };

    function handleCloseSnackbar() {
        setOpenSnackbar(false);
    }

    const handleCloseDialog = () => {
        setOpenDialog(false);
    };

    async function GetDatabases() {
        const userName = getCookie("userName");
        const token = localStorage.getItem("jwtToken");
        try {
            const response = await fetch(
                "http://localhost:8080/api/tableinfo/getAvailableDatabases/" + userName, {
                    headers: {
                        'Authorization': `Bearer ${token}`
                    }
                }
            );
            const data = await response.json();
            setDatabases(data);
        } catch (e) {
            setDatabases([]);
            setErrorMessage("Failed to fetch available databases");
            setOpenErrorSnackbar(true);
        }

    }

    async function GetXPlot() {
        try {
            const token = localStorage.getItem("jwtToken");
            const response = await fetch(
                "http://localhost:8080/api/fieldinfo/getColumns/" + selectedDatabase + '/' + selectedTable + '/' + selectedColumn1, {
                    headers: {
                        'Authorization': `Bearer ${token}`
                    }
                }
            );
            const data = await response.json();
            setXPlot(data);
            console.log(data);
        } catch (e) {
            setXPlot([]);
            setErrorMessage("Failed to fetch columns for selected table");
            setOpenErrorSnackbar(true);
        }
    }

    async function GetYPlot() {
        try {
            const token = localStorage.getItem("jwtToken");
            const response = await fetch(
                "http://localhost:8080/api/fieldinfo/getColumns/" + selectedDatabase + '/' + selectedTable + '/' + selectedColumn2, {
                    headers: {
                        'Authorization': `Bearer ${token}`
                    }
                }
            );
            const data = await response.json();
            setYPlot(data);
            console.log(data);
        } catch (e) {
            setYPlot([]);
            setErrorMessage("Failed to fetch columns for selected table");
            setOpenErrorSnackbar(true);
        }
    }

    useEffect(() => {
        setShowPlot(false);
        if (selectedColumn1) {
            GetXPlot();
        }
    }, [selectedColumn1]);

    useEffect(() => {
        setShowPlot(false);
        if (selectedColumn2) {
            GetYPlot();
        }
    }, [selectedColumn2]);

    useEffect(() => {
        setShowPlot(false);
    }, [databases]);

    useEffect(() => {
        GetDatabases().then(() => {

        }).catch((error) => {
            console.error(error);
        });
    }, []);

    const handleDatabaseChange = (event) => {
        setSelectedDatabase(event.target.value);
        getTables(event.target.value);
        getDatabaseStatistics(event.target.value);
    };

    async function getTables(databaseName) {
        try {
            const userName = getCookie("userName");
            const token = localStorage.getItem("jwtToken");

            const response = await fetch(
                `http://localhost:8080/api/tableinfo/getTables/${userName}/${databaseName}`, {
                    headers: {
                        'Authorization': `Bearer ${token}`
                    }
                }
            );
            const data = await response.json();
            setTables(data);
        } catch (e) {
            setTables([]);
            setErrorMessage("Failed to fetch tables for selected database");
            setOpenErrorSnackbar(true);
        }
    }

    async function getDatabaseStatistics(databaseName) {
        try {
            const userName = getCookie("userName");

            const token = localStorage.getItem("jwtToken");
            const response = await fetch(
                `http://localhost:8080/api/databaseinfo/getStatistics/${databaseName}/${userName}`, {
                    headers: {
                        'Authorization': `Bearer ${token}`
                    }
                }
            );
            const data = await response.json();
            setDatabaseStatistics(data);
            setDescription(data.databaseDescription);
        } catch (e) {
            setErrorMessage("Failed to fetch database statistics");
            setOpenErrorSnackbar(true);
            setDatabases([]);
            setDescription("");
        }
        finally {
            setIsReady(true);
        }
    }

    function isValidInput(input) {
        const SAFE_INPUT_REGEX = /^[a-zA-Z0-9 .,!@#$%^&*()_\-+=]+$/;

        if (typeof input !== "string" || input.trim() === "") {
            return false;
        }

        return SAFE_INPUT_REGEX.test(input);
    }

    const handleLog = (databaseName) => {
        console.log(databaseStatistics);
        const userName = getCookie("userName");
        const url = `http://localhost:8080/api/databaseinfo/updateDatabaseDescription/${databaseName}/${userName}`;
        if (isValidInput(description) === false) {
            setOpenDialog(true);
            return;
        }

        fetch(url, {
            method: "PUT",
            headers: {
                "Content-Type": "application/json",
                'Authorization': `Bearer ${localStorage.getItem("jwtToken")}`,
            },
            body: JSON.stringify(description).replace(/^"|"$/g, ''),
        })
            .then((response) => {
                if (!response.ok) {
                    throw new Error("Failed to update database description");
                }
                return response.text();
            })
            .then((data) => {
                console.log("Response:", data);
                setMessage("Database description updated successfully!");
                setOpenSnackbar(true);
            })
            .catch((error) => {
                console.error("Error:", error);
                setMessage("Error updating database description");
                setOpenSnackbar(true);
            });
    };

    const handleTableChange = (event) => {
        setSelectedTable(event.target.value);
    };

    const handleColumn1Change = (event) => {
        setSelectedColumn1(event.target.value);
    };

    const handleColumn2Change = (event) => {
        setSelectedColumn2(event.target.value);
    };

    function flipGraph() {
        setGenerateGraphClicked(true);
        setGenerateHistogramClicked(false);
    }

    const confirmLeave = () => {
        setOpenDialog(false);
    };

    function isColumnCountZero(database, tableName) {
        const table = database.tableStatistics.find(table => table.tableName === tableName);
        return table ? table.columnCounts === 0 : false;
    }

    return (
        <Paper sx={{ width: 'calc(80vw)', height: 'calc(86vh)', overflow: 'auto' }} elevation={3} style={{ padding: '10px', margin: '10px', borderRadius: '8px' }}>

            <Box sx={{ padding: 2 }}>
                <Box sx={{ padding: 2 }}>
                    <Grid2 container spacing={2} alignItems="center">
                        <Grid2 item>
                            <Typography variant="h4" gutterBottom>
                                Available Databases:
                            </Typography>
                        </Grid2>
                        <Grid2 item>
                            <FormControl variant="outlined">
                                <InputLabel id="database-select-label">Select a Database</InputLabel>
                                <Select
                                    labelId="database-select-label"
                                    id="database-select"
                                    value={selectedDatabase}
                                    onChange={handleDatabaseChange}
                                    variant="outlined"
                                    style={{width: '175px'}}
                                >
                                    {databases.map((database, index) => (
                                        <MenuItem key={index} value={database}>
                                            {database}
                                        </MenuItem>
                                    ))}
                                </Select>
                            </FormControl>
                        </Grid2>
                    </Grid2>

                    {selectedDatabase && isReady && (
                        <motion.div
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            transition={{ duration: 0.2 }}
                        >
                        <Grid2>
                            <Grid2 container spacing={2} alignItems="center" sx={{ marginTop: 1 }}>
                                <TextField
                                    label="Description"
                                    variant="outlined"
                                    fullWidth
                                    value={description}
                                    onChange={(e) => setDescription(e.target.value)}
                                    style={{ marginBottom: "1rem", width: '20%' }}
                                />
                                <Button variant="contained" color="primary" onClick={() => handleLog(selectedDatabase)}>
                                    Update Description
                                </Button>
                            </Grid2>
                            <Grid2 container spacing={2} alignItems="center" sx={{ marginTop: 1 }}>
                                <Typography variant="h5">
                                    Select from {databaseStatistics.tableCount} tables:
                                </Typography>
                                <Select
                                    labelId="table-select-label"
                                    id="table-select"
                                    value={selectedTable}
                                    onChange={handleTableChange}
                                    className="database-select"
                                    sx={{ width: '200px' }}
                                    variant="outlined"
                                >
                                    <MenuItem value="">
                                        <em>Select a table</em>
                                    </MenuItem>
                                    {tables.map((table, index) => (
                                        <MenuItem key={index} value={table}>
                                            {table}
                                        </MenuItem>
                                    ))}
                                </Select>
                            </Grid2>
                        </Grid2>
                        </motion.div>

                    )}
                </Box>

                {selectedTable && (
                    <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        transition={{ duration: 0.2 }}
                    >
                        <Box>
                            {databaseStatistics.tableStatistics
                                .filter((stats) => stats.tableName === selectedTable)
                                .map((stats) => (
                                    <Box key={stats.tableName}>
                                        <TableStatistics stats={stats} />
                                    </Box>
                                ))}
                        </Box>

                    </motion.div>

                )}

                {selectedTable && isColumnCountZero(databaseStatistics, selectedTable) !== true && (
                    <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        transition={{ duration: 0.2 }}
                    >
                        <Box sx={{ display: 'flex', gap: 2, marginTop: 2 }}>
                            <Button onClick={flipGraph}>
                                Generate Graph
                            </Button>
                        </Box>
                    </motion.div>

                )}

                {selectedTable && generateGraphClicked && (
                    <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        transition={{ duration: 0.2 }}
                    >
                    <Box>
                        {databaseStatistics.tableStatistics
                            .filter((stats) => stats.tableName === selectedTable)
                            .map((stats) => (
                                <Box key={stats.tableName} sx={{ marginBottom: 1 }}>
                                    <Box sx={{ display: 'flex', gap: 2, marginTop: 2 }}>
                                        <Select
                                            value={selectedColumn1}
                                            onChange={handleColumn1Change}
                                            className="column-select"
                                            variant="outlined"
                                            sx={{ height: '40px', flex: 1 }}
                                        >
                                            <MenuItem value="">
                                                <em>Select column 1</em>
                                            </MenuItem>
                                            {stats.rowNames.map((rowName, index) => (
                                                <MenuItem key={index} value={rowName.columnName}>
                                                    {rowName.columnName}
                                                </MenuItem>
                                            ))}
                                        </Select>

                                        <Select
                                            value={selectedColumn2}
                                            onChange={handleColumn2Change}
                                            className="column-select"
                                            variant="outlined"
                                            sx={{ height: '40px', flex: 1 }}
                                        >
                                            <MenuItem value="">
                                                <em>Select column 2</em>
                                            </MenuItem>
                                            {stats.rowNames
                                                .filter(rowName => rowName.columnType === "Long" || rowName.columnType === "Numeric" || rowName.columnType === "Integer")
                                                .map((rowName, index) => (
                                                    <MenuItem key={index} value={rowName.columnName}>
                                                        {rowName.columnName}
                                                    </MenuItem>
                                                ))}
                                        </Select>
                                        <Button onClick={() => setShowPlot(true)}>
                                            Generate Plot
                                        </Button>
                                    </Box>

                                    {selectedColumn1 && selectedColumn2 && showPlot && (
                                        <Box sx={{ marginTop: 1 }}>
                                           <MyPlot
                                                xPlot={xPlot}
                                                yPlot={yPlot}
                                                xPlotName={selectedColumn1}
                                                yPlotName={selectedColumn2}
                                                selectedTable={selectedTable}
                                                selectedDatabase={selectedDatabase}
                                            />
                                        </Box>
                                    )}
                                </Box>
                            ))}
                    </Box>
                    </motion.div>
                )}

                {selectedTable && generateHistogramClicked && (

                    <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        transition={{ duration: 0.2 }}
                    >
                        <Box>
                            <h1>Histogram</h1>
                            {databaseStatistics.tableStatistics
                                .filter((stats) => stats.tableName === selectedTable)
                                .map((stats) => (
                                    <Box key={stats.tableName} sx={{ marginBottom: 1 }}>
                                            <Select
                                                value={selectedColumn1}
                                                onChange={handleColumn1Change}
                                                className="column-select"
                                                variant="outlined"
                                                sx={{ height: '40px', flex: 1 }}
                                            >
                                                <MenuItem value="">
                                                    <em>Select column 1</em>
                                                </MenuItem>
                                                {stats.rowNames.map((rowName, index) => (
                                                    <MenuItem key={index} value={rowName.columnName}>
                                                        {rowName.columnName}
                                                    </MenuItem>
                                                ))}
                                            </Select>

                                            {selectedColumn1 && (
                                                <Box sx={{ marginTop: 1 }}>
                                                    {MyHistogram(xPlot, selectedColumn1, selectedTable, selectedDatabase)}
                                                </Box>
                                            )}
                                    </Box>
                                ))}
                        </Box>

                    </motion.div>
                )}
            </Box>
            <Dialog
                open={openDialog}
                onClose={handleCloseDialog}
            >
                <DialogTitle>Unsaved Changes</DialogTitle>
                <DialogContent>
                    <DialogContentText>
                        Remove characters such as \" - or ; from the description.
                    </DialogContentText>
                </DialogContent>
                <DialogActions>
                    <Button onClick={confirmLeave} color="secondary">
                        Leave
                    </Button>
                </DialogActions>
            </Dialog>

            <Snackbar
                open={openSnackbar}
                autoHideDuration={6000}
                onClose={handleCloseSnackbar}
            >
                <SnackbarContent
                    style={{ backgroundColor: '#4365da' }}
                    message={
                        <span style={{ display: 'flex', alignItems: 'center' }}>
                            <InfoIcon style={{ marginRight: 8 }} />
                            {message}
                        </span>
                    }
                    action={[
                        <IconButton
                            key="close"
                            aria-label="close"
                            color="inherit"
                            onClick={handleCloseSnackbar}
                        >
                            <CloseIcon />
                        </IconButton>,
                    ]}
                />
            </Snackbar>

            <Snackbar
                open={openErrorSnackbar}
                autoHideDuration={6000}
                onClose={handleCloseErrorSnackbar}
            >
                <SnackbarContent
                    style={{ backgroundColor: '#ff0000' }}
                    message={
                        <span style={{ display: 'flex', alignItems: 'center' }}>
                            <ErrorIcon style={{ marginRight: 8 }} />
                            {errorMessage}
                        </span>
                    }
                    action={[
                        <IconButton
                            key="close"
                            aria-label="close"
                            color="inherit"
                            onClick={handleCloseErrorSnackbar}
                        >
                            <CloseIcon />
                        </IconButton>,
                    ]}
                />
            </Snackbar>
        </Paper>
    );
};


function PrepareTree(stats) {
    let tree = [{
        id: 'tree',
        label: 'Browse column statistics for ' + stats.stats.tableName,
        children: []
    }];

    stats.stats.rowNames.forEach((rowName, index) => {
        const treeNode = {
            id: rowName.columnName,
            label: rowName.columnName,
        }
        tree[0].children.push(treeNode);
    });

    if (tree[0]["children"].length === 0) {
        return (
            <Box>
                <Typography variant="h6">No columns to display statistics for.</Typography>
            </Box>
        );
    }
    return (
        <RichTreeView items={tree} />
    );
}

const TableStatistics = ({ stats }) => {
    return (
        <Box key={stats.tableName} sx={{ marginBottom: 1 }}>
            <Typography variant="h5">Statistics for {stats.tableName}:</Typography>
            <Typography variant="body1">Row Count: {stats.columnCounts}</Typography>
            <Typography variant="body1">Column Count: {stats.rowCount}</Typography>
            <PrepareTree stats={stats} />
        </Box>
    );
};

export default Statistics;

const MyHistogram = (xPlot, xPlotName, selectedTable, selectedDatabase) => {
    console.log(xPlot);

    const categories = xPlot.map(item => item.category);
    const dataSeries = xPlot.map(item => item.value);

    return (
        <div>
            <h1>{xPlotName}</h1>
            <BarChart
                xAxis={[{ scaleType: 'band', data: categories }]}
                series={[{ data: dataSeries }]}
                width={500}
                height={300}
            />
        </div>
    );
}

const MyPlot = ({xPlot, yPlot, xPlotName, yPlotName, selectedTable, selectedDatabase}) => {
        let finalData = [];
        if (xPlot.length > 0 && yPlot.length > 0) {
            for (let i = 0; i < xPlot.length; i++) {
                finalData.push({ name: xPlot[i], value1: yPlot[i] });
            }
        }

        const sortedData = finalData.sort((a, b) => Number(a.name) - Number(b.name));
        const text = `Plotting ${xPlotName} with ${yPlotName} for ${selectedTable} in ${selectedDatabase}`;
        console.log(sortedData);

        const minValue = Math.min(...sortedData.map(item => item.value1));
        const maxValue = Math.max(...sortedData.map(item => item.value1));

        const handleExport = () => {
            const chartElement = document.querySelector('.chart-container');
            if (chartElement) {
                html2canvas(chartElement).then((canvas) => {
                    const link = document.createElement('a');
                    link.href = canvas.toDataURL('image/png');
                    link.download = 'chart.png';
                    link.click();
                });
            } else {
                console.error('Chart element not found');
            }
        };

    return (
        <div>
            <Container>
                <div className="chart-container">
                    <LineChart width={1100} height={400} data={sortedData}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="name" />
                        <YAxis domain={[minValue, maxValue]} />
                        <Tooltip />
                        <Legend
                            align="right"
                            verticalAlign="top"
                            height={36}
                            wrapperStyle={{ paddingBottom: '20px' }}
                        />
                        <Line type="monotone" dataKey="value1" stroke="#8884d8" name={text} />
                        <Brush dataKey="name" height={30} stroke="#8884d8" />
                    </LineChart>
                </div>
            </Container>
            <Button onClick={handleExport} style={{ marginBottom: '20px' }} variant={"contained"}>
                Export as Image
            </Button>
        </div>
    );
};

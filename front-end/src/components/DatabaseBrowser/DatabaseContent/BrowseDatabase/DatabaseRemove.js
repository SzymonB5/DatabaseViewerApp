import {getCookie} from ".././.././../getCookie";
import React, {useEffect, useState} from "react";
import {
    Dialog,
    DialogActions,
    DialogContent, DialogContentText,
    DialogTitle,
    FormControl,
    IconButton,
    InputLabel,
    MenuItem,
    Snackbar,
    SnackbarContent
} from "@mui/material";
import Select from "@mui/material/Select";
import Button from "@mui/material/Button";
import {InfoIcon} from "lucide-react";
import CloseIcon from "@mui/icons-material/Close";


async function fetchAvailableDatabases() {
    const userName = getCookie("userName");
    const token = localStorage.getItem("jwtToken");
    const tables = await fetch(
        "http://localhost:8080/api/tableinfo/getAvailableDatabases/" + userName, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        }
    );
    return await tables.json();
}




function DatabaseRemove({setMessage, setOpenSnackbar}) {
    const [selectedDatabase, setSelectedDatabase] = useState("");
    const [availableDatabases, setAvailableDatabases] = useState([]);

    useEffect(() => {
        const loadDatabases = async () => {
            const availableDBs = await fetchAvailableDatabases();
            setAvailableDatabases(availableDBs);
        };

        loadDatabases();
    }, []);


    const handleCloseSnackbar = () => {
        setOpenSnackbar(false);
    }

    async function deleteDatabase(selectedDatabase) {
        const userName = getCookie("userName");

        const token = localStorage.getItem("jwtToken");
        try {
            const response = await fetch(`http://localhost:8080/api/databaseinfo/delete/${selectedDatabase}/${userName}`, {
                method: "DELETE",
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (response.ok) {
                const message = await response.text();
                setMessage(message);
                setOpenSnackbar(true);
            } else {
                setMessage("Failed to delete the database:");
                setOpenSnackbar(true);
            }
        } catch (error) {
            console.error("Error occurred while deleting the database:", error);
        }
    }

    const [openDialog, setOpenDialog] = useState(false);


    const handleDeleteClick = () => {
        setOpenDialog(true);
    };

    const handleCloseDialog = () => {
        setOpenDialog(false);
    };

    const confirmDelete = () => {
        deleteDatabase(selectedDatabase);
        setOpenDialog(false);
        setMessage(`Database ${selectedDatabase} deleted successfully.`);
        setOpenSnackbar(true);
    };

    return (
        <div>
            <h6>Delete database structure</h6>
            <FormControl variant="outlined">
                <InputLabel id="demo-simple-select-table">Select a Database</InputLabel>
                <Select
                    labelId="demo-simple-select-table"
                    id="demo-simple-table"
                    value={selectedDatabase}
                    label="Select Table"
                    onChange={(event) => setSelectedDatabase(event.target.value)}
                    variant={"outlined"}
                    style={{width: "200px", marginBottom: "10px"}}
                >
                    {availableDatabases.map((option, index) => (
                        <MenuItem key={index} value={option}>
                            {option}
                        </MenuItem>
                    ))}
                </Select>
            </FormControl>

            {selectedDatabase !== "" && (
                <div>
                    <Button
                        variant="contained"
                        onClick={handleDeleteClick}
                    >
                        Delete a database
                    </Button>
                </div>
            )}

            <Dialog
                open={openDialog}
                onClose={handleCloseDialog}
            >
                <DialogTitle>Confirm Deletion</DialogTitle>
                <DialogContent>
                    <DialogContentText>
                        Are you sure you want to delete the database "{selectedDatabase}"? This action cannot be undone.
                    </DialogContentText>
                </DialogContent>
                <DialogActions>
                    <Button onClick={handleCloseDialog} color="primary">
                        Cancel
                    </Button>
                    <Button onClick={confirmDelete} color="secondary">
                        Delete
                    </Button>
                </DialogActions>
            </Dialog>

        </div>

    );
}

export default DatabaseRemove;

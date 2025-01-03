import React, { useEffect, useState } from "react";
import { getCookie } from "../getCookie";
import "./Header.css";

function getUserName() {
    return getCookie("userName");
}

async function fetchAvailableDatabases(userName) {
    const tables = await fetch(
        "http://localhost:8080/api/tableinfo/getAvailableDatabases/" + userName
    );
    return await tables.json();
}

function Header() {
    const userName = getUserName();
    const [tablesData, setTablesData] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchAvailableDatabases(userName)
            .then((data) => {
                setTablesData(data);
                setLoading(false);
            })
            .catch((error) => {
                console.error("Error fetching data:", error);
                setLoading(false);
            });
    }, [userName]);

    return (
        <header>
            <h3 align={"center"}>Available databases for {userName}:</h3>
            {loading ? (
                <p align={"center"}>Loading...</p>
            ) : (
                <h4 align={"center"}>{tablesData}</h4>
            )}
        </header>
    );
}

export default Header;

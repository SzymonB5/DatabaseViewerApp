/**
 * This class defines a Rest API controller for table information.
 *
 * @author Szymon Bigoszewski
 * @version 1.0
 */
package project.BackEnd.Table;

import lombok.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import project.BackEnd.DatabaseInfo.DatabaseInfo;
import project.BackEnd.DatabaseInfo.DatabaseInfoRepository;
import project.BackEnd.FieldInfo.FieldInfo;
import project.BackEnd.FieldInfo.FieldInfoRepository;
import project.BackEnd.OwnershipDetails.OwnershipDetailsPayload;
import project.BackEnd.OwnershipDetails.OwnershipDetailsRepository;
import project.BackEnd.OwnershipDetails.OwnershipDetailsService;
import project.BackEnd.User.UserInfoRepository;

import java.util.*;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/tableinfo")
@CrossOrigin(origins = "http://localhost:3000")
public class TableInfoController {

    @Autowired
    TableInfoService tableInfoService;

    @Autowired
    TableInfoRepository tableInfoRepository;

    @Autowired
    FieldInfoRepository fieldInfoRepository;

    @Autowired
    TableStructureRepository tableStructureRepository;

    @Autowired
    UserInfoRepository userInfoRepository;

    @Autowired
    private DatabaseInfoRepository databaseInfoRepository;

    @Autowired
    private OwnershipDetailsRepository ownershipDetailsRepository;

    @Autowired
    private OwnershipDetailsService ownershipDetailsService;

    @GetMapping("/getall")
    public List<TableInfo> getAllTableInfos() {
        return tableInfoService.getAllTableInfo();
    }

    @PostMapping("/add")
    public Long saveInfo(@RequestParam("tableInfo") String tableName, @RequestParam("databaseID") Long databaseID, @RequestParam("primaryKey") String primaryKey) {

        TableInfo tableInfo = new TableInfo();
        tableInfo.setDatabaseInfo(databaseInfoRepository.getReferenceById(databaseID));
        tableInfo.setTableName(tableName);
        tableInfo.setPrimary_key(primaryKey);
        TableInfo newTable = tableInfoService.saveTableInfo(tableInfo);
        return newTable.getId();
    }

    @PostMapping("/addenhanced")
    public ResponseEntity<String> saveInfoEnhanced(@RequestBody TableInfoRequestPayload payload) {
        String tableName = payload.getTableName();
        String databaseName = payload.getDatabaseName();
        String primaryKey = payload.getPrimaryKey();
        String username = payload.getUsername();

        System.out.println(username);
        boolean isPresent = tableInfoRepository.checkIfTableExists(databaseName, username, tableName).isPresent();
        if (isPresent) {
            return ResponseEntity.status(HttpStatus.OK)
                    .body("Table with that name already exists");
        }

        TableInfo tableInfo = new TableInfo();
        tableInfo.setDatabaseInfo(databaseInfoRepository.getDistinctDatabaseInfoByDatabaseName(databaseName, username).get(0));
        tableInfo.setTableName(tableName);
        tableInfo.setPrimary_key(primaryKey);

        Long tableID = tableInfoService.saveTableInfo(tableInfo).getId();
        Long userID = userInfoRepository.findByUsername(username).getId();

        OwnershipDetailsPayload ownershipDetailsPayload = new OwnershipDetailsPayload(userID, tableID);
        ownershipDetailsService.addOwnershipDetails(ownershipDetailsPayload);

        TableStructure tableStructure = new TableStructure(primaryKey, "Long", tableInfo);
        tableStructureRepository.save(tableStructure);

        return ResponseEntity.status(HttpStatus.CREATED)
                .body("Table created successfully");
    }

    @Getter
    @Setter
    @AllArgsConstructor
    @NoArgsConstructor
    @ToString
    public static class TableInfoRequestPayload {
        private String tableName;
        private String databaseName;
        private String primaryKey;
        private String username;
    }

    @DeleteMapping("/deletetable")
    public ResponseEntity<String> deleteTable(@RequestBody Long id) {
        try {
            tableStructureRepository.deleteTableStructureByTableInfo(id);
            tableInfoRepository.deleteTableInfoById(id);
        }
        catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.status(HttpStatus.CONFLICT)
                    .body("Cannot delete table that is not empty");
        }

        return ResponseEntity.status(HttpStatus.OK)
                .body("Table deleted successfully");
    }

    @DeleteMapping("/deletetableindexes")
    public ResponseEntity<String> deleteTable(@RequestBody Long[] id) {
        try {
            tableInfoRepository.deleteTableInfoByIds(Arrays.asList(id));
        }
        catch (Exception e) {
            return ResponseEntity.status(HttpStatus.CONFLICT)
                    .body("Cannot delete table that is not empty");
        }

        return ResponseEntity.status(HttpStatus.OK)
                .body("Table deleted successfully");
    }

    @PutMapping("/updateTable")
    public String updateTable(@RequestBody UpdateTableRequest tableRequest) {
        TableInfo tableInfo = tableInfoRepository.findTableInstanceByTableNameAndDatabaseName(tableRequest.getTableName(), tableRequest.getDatabaseName());
        tableInfo.setPrimary_key(tableRequest.getPrimaryKey());
        tableInfo.setTableName(tableRequest.getNewTableName());

        tableInfoRepository.save(tableInfo);

        return "OK";
    }

    @Getter
    @Setter
    @NoArgsConstructor
    @AllArgsConstructor
    @ToString
    static class UpdateTableRequest {
        private String tableName;
        private String newTableName;
        private String databaseName;
        private String primaryKey;
        private String username;
    }


    @PostMapping("/addtable/{username}/{databasename}/{tableName}")
    public String addTable(@PathVariable("username") String username, @PathVariable("databasename") String databasename, @PathVariable("tableName") String tableName) {
        Long userID = userInfoRepository.findByUsername(username).getId();
        DatabaseInfo databaseInfo = databaseInfoRepository.getDistinctDatabaseInfoByDatabaseName(databasename, username).get(0);

        TableInfo tableInfo = new TableInfo(databaseInfo, tableName, "primaryKey");
        Long tableID = tableInfoService.saveTableInfo(tableInfo).getId();

        OwnershipDetailsPayload ownershipDetailsPayload = new OwnershipDetailsPayload(userID, tableID);
        ownershipDetailsService.addOwnershipDetails(ownershipDetailsPayload);
        return "OK";
    }

    @GetMapping("/getAvailableDatabases/{username}")
    public List<String> getAvailableTablesByUserName(@PathVariable("username") String userName) {
        return tableInfoRepository.findDatabasesByUserName(userName);
    }

    @GetMapping("/getAvailableTables/{username}/{database}")
    public List<String> getAvailableTables(@PathVariable("username") String userName, @PathVariable("database") String database) {
        return tableInfoRepository.findAvailableTableNames(database, userName);
    }

    @GetMapping("/getAvailableDatabasesObject/{username}")
    public List<DatabaseInfo> getAvailableDatabasesByUserName(@PathVariable("username") String userName) {
        return tableInfoRepository.findDatabasesObjectsByUserName(userName);
    }

    @GetMapping("/getTableStructure/{username}/{databasename}/{tableName}")
    public List<FieldInfoDTO> getAvailableDatabasesByUserName(
            @PathVariable("username") String userName,
            @PathVariable("databasename") String databasename,
            @PathVariable("tableName") String tableName) {

        List<TableStructure> tableStructures = tableInfoRepository.findTableInstanceByTableNameAndDatabaseNameAndUserName(tableName, databasename, userName).getTableStructure();

        return tableStructures.stream()
                .map(ts -> new FieldInfoDTO(ts.getId(), ts.getColumnName(), ts.getColumnType()))
                .collect(Collectors.toList());
    }

    @PostMapping("/addFieldInformation/{databaseName}/{tableName}/{userName}")
    public String receiveFieldInfo(@RequestBody FieldInfoDTO[] fieldInfoArray,
                                   @PathVariable("databaseName") String databaseName,
                                   @PathVariable("tableName") String tableName,
                                   @PathVariable("userName") String userName
    ) {
        for (FieldInfoDTO fieldInfo : fieldInfoArray) {

            TableStructure ts = tableStructureRepository.findTableStructuresByColumnNameAndTableName(fieldInfo.columnName, tableName, userName);
            if (ts != null) {
                continue;
            }

            if (fieldInfo.getId() > 0) {
                TableStructure tableStructure = tableStructureRepository.getReferenceById(fieldInfo.getId());
                tableStructure.setColumnName(fieldInfo.getColumnName());
                tableStructure.setColumnType(fieldInfo.getColumnType());

                tableStructureRepository.save(tableStructure);
            }
            else {
                TableStructure tableStructure = new TableStructure();
                tableStructure.setColumnName(fieldInfo.getColumnName());
                tableStructure.setColumnType(fieldInfo.getColumnType());
                tableStructureRepository.save(tableStructure);

                TableInfo tableInfo = tableInfoRepository.findTableInstanceByTableNameAndDatabaseName(tableName, databaseName);
                tableInfo.getTableStructure().add(tableStructure);

                tableStructureRepository.save(tableStructure);
            }

        }

        return "Field information received successfully";
    }


    @DeleteMapping("/deleteFieldInfo")
    public String deleteFieldInfoByIds(@RequestBody List<Long> ids) {
        tableStructureRepository.deleteAllById(ids);
        return "OK";
    }

    @PostMapping("/addFieldInfo/{datatype}/{columnName}/{tableid}/{userName}")
    public String addFieldInformation(
            @PathVariable("datatype") String datatype,
            @PathVariable("columnName") String columnName,
            @PathVariable("userName") String userName,
            @PathVariable("tableid") Long tableid
    ) {
        TableStructure tableStructure = new TableStructure();
        tableStructure.setColumnName(columnName);
        tableStructure.setColumnType(datatype);

        TableInfo tableInfoInstance = tableInfoRepository.getTableInfoById(tableid);
        String tableName = tableInfoInstance.getTableName();

        TableStructure ts = tableStructureRepository.findTableStructuresByColumnNameAndTableName(columnName, tableName, userName);

        if (ts == null) {
            return "Table already exists";
        }

        if (tableInfoInstance.getTableStructure() == null) {
            tableInfoInstance.setTableStructure(new ArrayList<>());
        }
        tableInfoInstance.getTableStructure().add(tableStructure);

        tableStructureRepository.save(tableStructure);

        tableInfoRepository.save(tableInfoInstance);

        return "Field information received successfully";
    }

    @PostMapping("/addTableStructure/{tableName}/{userName}/{databaseName}")
    public ResponseEntity<String> addTableStructure(
            @RequestBody FieldInfoDTO[] fieldInfoArray,
            @PathVariable("userName") String userName,
            @PathVariable("tableName") String tableName,
            @PathVariable("databaseName") String databaseName
    ) {

        TableInfo tableInfo = tableInfoRepository.findTableInstanceByTableNameAndDatabaseNameAndUserName(tableName, databaseName, userName);
        if (tableInfo == null) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body("Table not found");
        }

        if (tableInfo.getTableStructure() == null) {
            tableInfo.setTableStructure(new ArrayList<>());
        }
        try {
            for (FieldInfoDTO fieldInfo : fieldInfoArray) {
                if (fieldInfo.getColumnName() == null || fieldInfo.getColumnType() == null) {
                    return ResponseEntity.badRequest().body("Column name and type must not be null");
                }
                TableStructure tableStructure = new TableStructure();
                tableStructure.setColumnName(fieldInfo.getColumnName());
                tableStructure.setColumnType(fieldInfo.getColumnType());
                tableStructure.setTableInfo(tableInfo);
                tableStructureRepository.save(tableStructure);
            }
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body("An error occurred while adding table structure");
        }

        return ResponseEntity.status(HttpStatus.CREATED).body("Table structure defined successfully");
    }

    @Getter
    @AllArgsConstructor
    @NoArgsConstructor
    public static class FieldInfoDTO {
        private Long id;
        private String columnName;
        private String columnType;
    }

    @GetMapping("/getAvailableTablesToAdd/{adminName}/{username}")
    public List<List<String>> getAvailableTablesByUserName(@PathVariable("username") String userName,
                                                   @PathVariable("adminName") String adminName) {

        List<String> adminTables = tableInfoRepository.findTableInfoAndDatabasesByUserName(adminName);
        List<String> userTables = tableInfoRepository.findTableInfoAndDatabasesByUserName(userName);


        List<String> availableTables = new ArrayList<>(adminTables);
        availableTables.removeAll(userTables);

        LinkedList<List<String>> retList = new LinkedList<>();
        retList.add(availableTables);
        retList.add(userTables);

        return retList;
    }


    @GetMapping("/getAvailableTablesAndDatabases/{adminName}/{username}/{databaseName}")
    public List<String> getAvailableTablesAndDatabasesByUserName(@PathVariable("username") String userName,
                                                                 @PathVariable("adminName") String adminName,
                                                                 @PathVariable("databaseName") String databaseName) {

        List<String> adminTables = tableInfoRepository.findTableInfoAndByUserName(adminName, databaseName);
        List<String> userTables = tableInfoRepository.findTableInfoAndByUserName(userName, databaseName);

        List<String> availableTables = new ArrayList<>(adminTables);
        availableTables.removeAll(userTables);

        return availableTables;
    }

    @GetMapping("/getAllowedTablesAndDatabases/{adminName}/{username}/{databaseName}")
    public List<String> getAllowedTablesAndDatabasesByAdminName(@PathVariable("username") String userName,
                                                                @PathVariable("adminName") String adminName,
                                                                @PathVariable("databaseName") String databaseName) {

        List<String> adminTables = tableInfoRepository.findTableInfoAndByUserName(adminName, databaseName);
        List<String> userTables = tableInfoRepository.findTableInfoAndByUserName(userName, databaseName);

        List<String> commonTables = new ArrayList<>(adminTables);
        commonTables.retainAll(userTables);

        return commonTables;
    }

    @GetMapping("/getalljoined")
    public List<TableInfo> getAllODJoined() {
        return tableInfoRepository.findWithUsersAndTables();
    }

    @GetMapping("/getalltablenames")
    public List<String> getAllTableNames() {
        return tableInfoRepository.findDistinctTableNames();
    }

    @GetMapping("/getTables/{user}/{databasename}")
    public List<String> getTablesForUserAndDatabase(@PathVariable("user") String userName, @PathVariable("databasename") String databaseName) {
        return tableInfoRepository.findDatabasesByUserNameAndUsername(databaseName, userName);
    }

    @GetMapping("/getKey/{databasename}/{tableName}/{userName}")
    public String getPrimaryKeyName(@PathVariable("tableName") String tableName,
                                    @PathVariable("databasename") String databaseName,
                                    @PathVariable("userName") String userName) {
        return tableInfoRepository.findKeyNameByTable(tableName, databaseName, userName);
    }

    @GetMapping("/getColumns/{user}/{databasename}/{tableName}")
    public List<String> getTablesForUserAndDatabase(@PathVariable("user") String userName, @PathVariable("databasename") String databaseName, @PathVariable("tableName") String tableName) {
        List<TableStructure> tableStructures =  tableInfoRepository.findColumnNamesByUserAndDatabaseAndTablenameFromStructure(databaseName, userName, tableName);
        return tableStructures.stream()
                .map(TableStructure::getColumnName)
                .collect(Collectors.toList());
    }

    @GetMapping("/getColumnsWithTypes/{user}/{databaseName}/{tableName}")
    public List<TableStructure> getColumnsWithTypes(@PathVariable("user") String userName, @PathVariable("databaseName") String databaseName, @PathVariable("tableName") String tableName) {
        return tableInfoRepository.findColumnNamesByUserAndDatabaseAndTablenameFromStructure(databaseName, userName, tableName);
    }

    @GetMapping("/getFields/{user}/{databasename}/{tableName}")
    public List<FieldInfo> getFields(@PathVariable("user") String userName, @PathVariable("databasename") String databaseName, @PathVariable("tableName") String tableName) {
        return tableInfoRepository.getFields(databaseName, userName, tableName);
    }

    @GetMapping("/getStructure/{user}/{databasename}/{tableName}")
    public List<TableStructure> getTableStructure(
            @PathVariable("user") String userName,
            @PathVariable("databasename") String databaseName,
            @PathVariable("tableName") String tableName) {
        return tableInfoRepository.findTableInstanceByTableNameAndDatabaseName(tableName, databaseName).getTableStructure();
    }

    @GetMapping("/checkIfTaken/{user}/{databasename}/{tableName}")
    public Boolean checkIfTaken(
            @PathVariable("user") String userName,
            @PathVariable("databasename") String databaseName,
            @PathVariable("tableName") String tableName) {
        return tableInfoRepository.findWithUsersAndTables(userName, tableName, databaseName).isPresent();
    }

    @GetMapping("/getFields/{databasename}/{tableName}")
    public List<String> getTableInfo( @PathVariable("databasename") String databaseName, @PathVariable("tableName") String tableName) {
        return tableInfoRepository.getTableInformation(databaseName, tableName);
    }

    @GetMapping("/checkIfTableEmpty/{databaseName}/{tableName}")
    public ResponseEntity<Boolean> checkIfTableEmpty(@PathVariable("databaseName") String databaseName, @PathVariable("tableName") String tableName) {
        Long fieldCount = tableInfoRepository.getFieldCount(databaseName, tableName);
        boolean isEmpty = (fieldCount == null || fieldCount == 0);
        return ResponseEntity.ok(isEmpty);
    }

    @GetMapping("/getDatabaseStructure/{databaseName}/{userName}")
    public List<TableStructureInformationDTO> getDatabaseStructure(@PathVariable("databaseName") String databaseName,
                                                                   @PathVariable("userName") String userName) {
        List<TableInfo> list = tableInfoRepository.getTableStructure(databaseName, userName);

        return list.stream()
                .map(node -> new TableStructureInformationDTO(node.getTableStructure(), node.getTableName()))
                .collect(Collectors.toList());
    }

    @ToString
    @Getter
    public class TableStructureInformationDTO {
        String tableName;
        List<TableStructure> tableStructures;

        public TableStructureInformationDTO(List<TableStructure> tableStructures, String tableName) {
            this.tableStructures = tableStructures;
            this.tableName = tableName;
        }
    }

    @PostMapping("/getAllFields/{userName}")
    public List<List<FieldInfo>> getFields(@RequestBody TableInfoRequest request, @PathVariable("userName") String userName) {
        List<Object[]> results = fieldInfoRepository.findFieldInfoByColumnNameInAndTableNameByUserName(request.getColumns(), request.getTable(), userName);

        Map<Long, List<FieldInfo>> fieldInfoMap = results.stream()
                .collect(Collectors.groupingBy(o -> (Long) o[0], Collectors.mapping(o -> (FieldInfo) o[1], Collectors.toList())));

        return (List<List<FieldInfo>>) new ArrayList<List<FieldInfo>>(fieldInfoMap.values());
    }

    @PostMapping("/getAllFieldsForTable/{userName}")
    public ResponseEntity<?> getAllFieldsForTable(@RequestBody TableInfoRequest request,
                                                  @PathVariable("userName") String userName) {
        try {
            List<Object[]> results = fieldInfoRepository.findFieldInfoByColumnNameInAndTableNameByUserName(
                    request.getColumns(), request.getTable(), userName);

            Map<Long, List<FieldInfo>> fieldInfoMap = results.stream()
                    .collect(Collectors.groupingBy(o -> (Long) o[0],
                            Collectors.mapping(o -> (FieldInfo) o[1], Collectors.toList())));

            List<List<FieldInfoResultDTO>> response = fieldInfoMap.values().stream()
                    .map(fieldInfoList -> fieldInfoList.stream()
                            .map(field -> new FieldInfoResultDTO(
                                    field.getDataValue(),
                                    field.getColumnName(),
                                    String.valueOf(field.getColumnId())))
                            .collect(Collectors.toList()))
                    .collect(Collectors.toList());
            return ResponseEntity.ok(response);

        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Collections.singletonMap("error", "Failed to retrieve field information for table."));
        }
    }

    @Getter
    @Setter
    @ToString
    @AllArgsConstructor
    public static class FieldInfoResultDTO {
        String dataValue;
        String columnName;
        String columnId;
    }


    @PostMapping("/getAllFieldsAllColumns")
    public List<List<FieldInfo>> getFields(@RequestBody TableInfoBasicRequest request) {
        List<Object[]> results = fieldInfoRepository.findFieldInfoTableName(request.getTable());

        Map<Long, List<FieldInfo>> fieldInfoMap = results.stream()
                .collect(Collectors.groupingBy(o -> (Long) o[0], Collectors.mapping(o -> (FieldInfo) o[1], Collectors.toList())));

        return (List<List<FieldInfo>>) new ArrayList<List<FieldInfo>>(fieldInfoMap.values());
    }

    @DeleteMapping("/deleteArray")
    public String deleteFieldInfo(@RequestBody Long[] columnIds) {
        try {
            tableInfoRepository.deleteTableInfoByIds(Arrays.asList(columnIds));
            return "OK";
        } catch (Exception e) {
            return e.toString();
        }
    }


    @Setter
    @Getter
    @NoArgsConstructor
    @AllArgsConstructor
    public static class TableInfoRequest {
        private String database;
        private String table;
        private List<String> columns;
    }


    @Setter
    @Getter
    @NoArgsConstructor
    @AllArgsConstructor
    public static class TableInfoBasicRequest {
        private String database;
        private String table;
    }


    @Setter
    @Getter
    @NoArgsConstructor
    @AllArgsConstructor
    public static class TableStructureDTO {
        private String columnName;
        private String table;
    }



}

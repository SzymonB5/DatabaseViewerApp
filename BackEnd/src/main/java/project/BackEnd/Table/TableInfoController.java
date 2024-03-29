package project.BackEnd.Table;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;
import project.BackEnd.FieldInfo.FieldInfo;
import project.BackEnd.OwnershipDetails.OwnershipDetails;

import java.util.List;

@RestController
@RequestMapping("/api/tableinfo")
@CrossOrigin
public class TableInfoController {

    @Autowired
    TableInfoService tableInfoService;

    @Autowired
    TableInfoRepository tableInfoRepository;

    @GetMapping("/getall")
    public List<TableInfo> getAllTableInfos() {
        return tableInfoService.getAllTableInfo();
    }

    @PostMapping("/add")
    public String saveInfo(@RequestParam("userInfo") TableInfo tableInfo) {
        tableInfoService.saveTableInfo(tableInfo);
        return "OK";
    }

//    @GetMapping("/getAvailableDatabases/{username}")
//    public List<String> getAvailableTablesByUserName(@PathVariable("username") String userName) {
//        return tableInfoRepository.findDatabasesByUserName(userName);
//    }

    @GetMapping("/getalljoined")
    public List<TableInfo> getAllODJoined() {
        return tableInfoRepository.findWithUsersAndTables();
    }

    @GetMapping("/getalltablenames")
    public List<String> getAllTableNames() {
        return tableInfoRepository.findDistinctTableNames();
    }

//    @GetMapping("/getTables/{user}/{databasename}")
//    public List<String> getTablesForUserAndDatabase(@PathVariable("user") String userName, @PathVariable("databasename") String databaseName) {
//        return tableInfoRepository.findDatabasesByUserNameAndUsername(databaseName, userName);
//    }
//
//    @GetMapping("/getColumns/{user}/{databasename}/{tablename}")
//    public List<String> getTablesForUserAndDatabase(@PathVariable("user") String userName, @PathVariable("databasename") String databaseName, @PathVariable("tablename") String tablename) {
//        return tableInfoRepository.findColumnNamesByUserAndDatabaseAndTablename(databaseName, userName, tablename);
//    }

    @GetMapping("/getFields/{user}/{databasename}/{tablename}")
    public List<FieldInfo> getFields(@PathVariable("user") String userName, @PathVariable("databasename") String databaseName, @PathVariable("tablename") String tablename) {
        return tableInfoRepository.getFields(databaseName, userName, tablename);
    }

}

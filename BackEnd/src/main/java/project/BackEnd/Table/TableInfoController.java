package project.BackEnd.Table;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;
import project.BackEnd.OwnershipDetails.OwnershipDetails;

import java.util.List;

@RestController
@RequestMapping("/api/tableinfo")
@CrossOrigin
public class TableInfoController {

    @Autowired
    TableInfoService tableInfoService;

    @GetMapping("/getall")
    public List<TableInfo> getAllTableInfos() {
        return tableInfoService.getAllTableInfo();
    }

    @PostMapping("/add")
    public String saveInfo(@RequestParam("userInfo") TableInfo tableInfo) {
        tableInfoService.saveTableInfo(tableInfo);
        return "OK";
    }

//    @GetMapping("/getbyusername")
//    public List<String> getAvailableTablesByUserName(@RequestParam("username") String userName) {
//        return tableInfoService.getByUserName();
//    }

}
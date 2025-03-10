/**
 * This class defines a Rest API field controller.
 *
 * @author Szymon Bigoszewski
 * @version 1.0
 */
package project.BackEnd.FieldInfo;

import lombok.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import project.BackEnd.Table.TableInfoRepository;
import project.BackEnd.Table.TableStructureRepository;
import project.BackEnd.TableConnections.TableConnection;
import project.BackEnd.TableConnections.TableConnectionRepository;

import java.util.*;
import java.util.stream.Collectors;

@RestController
@RequestMapping("api/fieldinfo")
@CrossOrigin(origins = "http://localhost:3000")
public class FieldInfoController {

    @Autowired
    FieldInfoService fieldInfoService;

    @Autowired
    FieldInfoRepository fieldInfoRepository;

    @Autowired
    TableInfoRepository tableInfoRepository;
    @Autowired
    private TableStructureRepository tableStructureRepository;
    @Autowired
    private TableConnectionRepository tableConnectionRepository;

    @GetMapping
    public List<FieldInfo> getAll() {
        return fieldInfoService.getAllFieldInfos();
    }

    @GetMapping("/getColumns/{databasename}/{tablename}/{columnname}")
    public List<String> getSingleColumnData(@PathVariable("databasename") String databasename, @PathVariable("tablename") String tablename, @PathVariable("columnname") String columnname) {

        List<String> rows = fieldInfoRepository.getSingleRow(tablename, columnname, databasename);

        return rows.stream()
                .map(s -> s.split(",", 2)[0])
                .collect(Collectors.toList());
    }

    @GetMapping("/getColumnsForPlot/{databasename}/{tablename}/{columnname}")
    public List<String> getSingleColumnDataForPlot(@PathVariable("databasename") String databasename, @PathVariable("tablename") String tablename, @PathVariable("columnname") String columnname) {

        return fieldInfoRepository.getSingleRow(tablename, columnname, databasename);
    }

    public Integer getSmallestFreeKey(String databasename, String tablename, String userName) {

        String primaryKeyName = tableInfoRepository.findKeyNameByTable(tablename, databasename, userName);
        List<Integer> numbers = new ArrayList<>();

        List<String> keys = fieldInfoRepository.findFirstFreeKeyFieldWithUsersAndTables(tablename, primaryKeyName, userName);

        for (String key : keys) {
            try {
                int num = Integer.parseInt(key);
                if (num > 0) {
                    numbers.add(num);
                }
            } catch (NumberFormatException e) {
                System.out.println("Invalid number format: " + key);
            }
        }
        Collections.sort(numbers);

        int smallestMissing = 1;
        for (int num : numbers) {
            if (num == smallestMissing)
                smallestMissing++;
            else if (num > smallestMissing)
                break;

        }

        return smallestMissing;
    }


    @PostMapping("/insertvalues/{databasename}/{userName}")
    public List<insertResultDTO>  insertValues(@PathVariable("databasename") String databasename,
                                               @PathVariable("userName") String userName,
                                               @RequestBody List<List<InsertPayload>> fieldInfos) {
        List<insertResultDTO> insertResultDTOArrayList = new ArrayList<>();
        for (List<InsertPayload> fieldInfoList : fieldInfos) {
            Long locFieldID = Long.valueOf(fieldInfoList.get(0).getDataValue());
            List<InsertPayload> correct = fieldInfoList.subList(1, fieldInfoList.size());
            insertResultDTOArrayList.add(insertValuesBuff(databasename, correct, locFieldID, userName));
        }

        return insertResultDTOArrayList;
    }


    public insertResultDTO insertValuesBuff(String databasename, List<InsertPayload> fieldInfos, Long fieldID, String username) {

        Long newID = getFreeColumnID();

        Integer smallestKey = getSmallestFreeKey(databasename, fieldInfos.get(0).getTableName(), username);
        String primaryKey = tableInfoRepository.findKeyNameByTable(fieldInfos.get(0).tableName, databasename, username);

        FieldInfo insertPayloadPrimaryKey = new FieldInfo();
        String datatype = fieldInfoRepository.findDatatype(fieldInfos.get(0).columnName, fieldInfos.get(0).tableName).get(0);
        insertPayloadPrimaryKey.setDataType(datatype);
        insertPayloadPrimaryKey.setColumnName(tableInfoRepository.findKeyNameByTable(fieldInfos.get(0).tableName, databasename, username));
        insertPayloadPrimaryKey.setDataValue(String.valueOf(smallestKey));
        insertPayloadPrimaryKey.setTableInfo(tableInfoRepository.findByTableName(fieldInfos.get(0).tableName));
        insertPayloadPrimaryKey.setColumnId(newID);
        fieldInfoRepository.save(insertPayloadPrimaryKey);
        Long newColumnID = 0L;
        for (InsertPayload fieldInfo : fieldInfos) {
            if (!Objects.equals(fieldInfo.columnName, primaryKey)) {
                newColumnID = insertValueHelper(fieldInfo, newID);
            }
        }
        return new insertResultDTO(newColumnID, fieldID, Long.valueOf(smallestKey));
    }

    private Long insertValueHelper(InsertPayload fieldInfo, Long newID) {
        String datatype = fieldInfoRepository.findDatatype(fieldInfo.columnName, fieldInfo.tableName).get(0);
        FieldInfo fieldInfoToSave = new FieldInfo();
        fieldInfoToSave.setDataType(datatype);
        fieldInfoToSave.setColumnName(fieldInfo.columnName);
        fieldInfoToSave.setDataValue(fieldInfo.dataValue);
        fieldInfoToSave.setColumnId(newID);
        fieldInfoToSave.setTableInfo(tableInfoRepository.findByTableName(fieldInfo.tableName));
        FieldInfo newFieldInfo = fieldInfoRepository.save(fieldInfoToSave);
        return newFieldInfo.getColumnId();
    }

    @Getter
    @Setter
    @AllArgsConstructor
    @ToString
    @NoArgsConstructor
    static class insertResultDTO {
        Long newColumnID;
        Long previousColumnID;
        Long newPrimaryKeyID;
    }

    private Long getFreeColumnID() {
        return fieldInfoRepository.findMaxColumnID();
    }

    @PutMapping("/update")
    public String updateFieldInfo(@RequestBody List<UpdatePayload> updatePayloads) {
        try {
            for (UpdatePayload updatePayload : updatePayloads) {
                fieldInfoRepository.updateFieldInfoByColumnIdAndColumnName(updatePayload.newDataValue, updatePayload.rowIndex, updatePayload.columnName);
            }
            return "Success";
        } catch (Exception e) {
            System.out.println(e.getCause().toString());
            return "Error";
        }
    }

    @DeleteMapping("/delete/{databaseName}/{tableName}/{primaryKey}")
    public ResponseEntity<String> deleteFieldInfo(@RequestBody Long columnID,
                                  @PathVariable("databaseName") String databaseName,
                                  @PathVariable("primaryKey") String primaryKey,
                                  @PathVariable("tableName") String tableName) {
        Boolean isRemovable = checkIfRemoveAble(columnID, databaseName, tableName, primaryKey);

        if (isRemovable) {
            fieldInfoRepository.deleteByColumnId(columnID);
            return ResponseEntity.status(HttpStatus.OK).body("Ok");
        }
        return ResponseEntity.status(HttpStatus.OK).body("Failed to remove");

    }

    @DeleteMapping("/deleteArray/{databaseName}/{tableName}/{primaryKey}/{userName}")
    public ResponseEntity<List<Long>> deleteFieldInfos(@RequestBody Long[] columnIds,
                                                   @PathVariable("databaseName") String databaseName,
                                                   @PathVariable("primaryKey") String primaryKey,
                                                   @PathVariable("tableName") String tableName,
                                                    @PathVariable("userName") String userName
    ) {
        boolean isAllRemoved = true;
        boolean isSomethingRemoved = false;

        List<Long> removed = new ArrayList<>();

        for (Long columnId : columnIds) {
            Boolean isRemovable = checkIfRemoveAble(columnId, databaseName, tableName, primaryKey);
            if (isRemovable) {
                isSomethingRemoved = true;
                removed.add(columnId);
                fieldInfoRepository.deleteByColumnId(columnId);
            }
            else {
                isAllRemoved = false;
            }
        }

        if (isAllRemoved && isSomethingRemoved) {
            return ResponseEntity.status(HttpStatus.OK).body(removed);
        }
        else if (!isSomethingRemoved && !isAllRemoved) {
            return ResponseEntity.status(HttpStatus.OK).body(removed);
        }
        else {
            return ResponseEntity.status(HttpStatus.OK).body(removed);
        }

    }

    private Boolean checkIfRemoveAble(Long columnID, String databaseName, String tableName, String primaryKey) {
        FieldInfo fieldInfo = fieldInfoRepository.findDistinctFieldInfoByTableInfo_TableNameAndColumnNameAndTableInfo_DatabaseInfo_DatabaseNameAndColumnId(
               tableName,
               primaryKey,
               databaseName,
               columnID);
        List<TableConnection> tableConnection = tableConnectionRepository.getTableConnectionByParamsStrings(
                databaseName, "user1", tableName, primaryKey);

        for (TableConnection tc : tableConnection) {
            String connectedTableName = tc.getMany().getTableName();
            String connectedColumnName = tc.getManyColumnName();

            List<FieldInfo> finfo = fieldInfoRepository.getFieldsByColumnName(databaseName, "user1", connectedTableName, connectedColumnName, fieldInfo.getDataValue());

            if (!finfo.isEmpty()) {
                return Boolean.FALSE;
            }

        }

        return Boolean.TRUE;
    }

}


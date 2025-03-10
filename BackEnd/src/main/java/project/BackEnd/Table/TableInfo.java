/**
 * This class defines a table in a database.
 *
 * @author Szymon Bigoszewski
 * @version 1.0
 */
package project.BackEnd.Table;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import lombok.*;
import project.BackEnd.DatabaseInfo.DatabaseInfo;
import project.BackEnd.FieldInfo.FieldInfo;
import project.BackEnd.OwnershipDetails.OwnershipDetails;

import java.sql.Timestamp;
import java.util.Date;
import java.util.List;

@Entity
@Table(name = "table_info")
@Getter
@Setter
@AllArgsConstructor
@NoArgsConstructor
public class TableInfo {
    @Override
    public String toString() {
        return "TableInfo{" +
                "id=" + id +
                ", tableName='" + tableName + '\'' +
                ", createdAt=" + createdAt +
                '}';
    }

    public TableInfo(DatabaseInfo databaseInfo, String tableName, String primary_key) {
        this.databaseInfo = databaseInfo;
        this.tableName = tableName;
        this.primary_key = primary_key;
    }

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "table_info_id")
    private Long id;

    @OneToMany(mappedBy = "tableInfo", cascade = CascadeType.ALL, orphanRemoval = true)
    @JsonIgnore
    private List<OwnershipDetails> ownershipDetails;

    @JoinColumn(name = "database_id")
    @ManyToOne
    @JsonIgnore
    private DatabaseInfo databaseInfo;

    @OneToMany(mappedBy = "tableInfo", cascade = CascadeType.ALL, orphanRemoval = true)
    @JsonIgnore
    private List<FieldInfo> fields;

    @OneToMany(cascade = CascadeType.ALL, orphanRemoval = true)
    @JoinColumn(name = "table_info_id")
    @JsonIgnore
    private List<TableStructure> tableStructure;

    @Column(name = "table_name", length = 255, nullable = false)
    private String tableName;

    @Column(name = "primary_key", length = 255, nullable = true)
    private String primary_key;

    @Column(name = "created_at")
    private Timestamp createdAt;

    @PrePersist
    public void setDefaultCreatedAt() {
        this.createdAt = new Timestamp(new Date().getTime());
    }

}

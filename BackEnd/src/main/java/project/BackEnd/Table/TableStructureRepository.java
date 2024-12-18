package project.BackEnd.Table;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

public interface TableStructureRepository extends JpaRepository<TableStructure, Long> {

    @Modifying
    @Transactional
    void deleteById(Long id);

}

package com.carpooling.repository;

import com.carpooling.entity.Complaint;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface ComplaintRepository extends JpaRepository<Complaint, Long> {
    List<Complaint> findByStatus(Complaint.ComplaintStatus status);
    long countByStatus(Complaint.ComplaintStatus status);
    List<Complaint> findByComplainantId(Long complainantId);

    List<Complaint> findByRespondentId(Long respondentId);
}

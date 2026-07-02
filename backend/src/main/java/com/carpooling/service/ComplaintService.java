package com.carpooling.service;

import com.carpooling.dto.ComplaintRequest;
import com.carpooling.dto.ComplaintResponse;
import com.carpooling.entity.Complaint;
import com.carpooling.entity.Ride;
import com.carpooling.entity.User;
import com.carpooling.repository.ComplaintRepository;
import com.carpooling.repository.RideRepository;
import com.carpooling.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.stream.Collectors;

@Service
public class ComplaintService {

    @Autowired
    private ComplaintRepository complaintRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private RideRepository rideRepository;

    public ComplaintResponse createComplaint(Long complainantId,
                                             ComplaintRequest request) {

        User complainant = userRepository.findById(complainantId)
                .orElseThrow(() -> new RuntimeException("Complainant not found"));

        User respondent = userRepository.findById(request.getRespondentId())
                .orElseThrow(() -> new RuntimeException("Respondent not found"));

        Ride ride = null;

        if (request.getRideId() != null) {
            ride = rideRepository.findById(request.getRideId()).orElse(null);
        }

        Complaint complaint = new Complaint();
        complaint.setComplainant(complainant);
        complaint.setRespondent(respondent);
        complaint.setRide(ride);
        complaint.setSubject(request.getSubject());
        complaint.setDescription(request.getDescription());
        complaint.setStatus(Complaint.ComplaintStatus.PENDING);

        Complaint savedComplaint = complaintRepository.save(complaint);

        return mapToResponse(savedComplaint);
    }

    public List<ComplaintResponse> getUserComplaints(Long userId) {

        return complaintRepository.findAll()
                .stream()
                .filter(c ->
                        c.getComplainant().getId().equals(userId) ||
                                c.getRespondent().getId().equals(userId))
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    private ComplaintResponse mapToResponse(Complaint complaint) {

        return new ComplaintResponse(
                complaint.getId(),
                complaint.getSubject(),
                complaint.getDescription(),
                complaint.getStatus().name().toLowerCase(),
                complaint.getRespondent().getFullName(),
                complaint.getRide() != null ? complaint.getRide().getId() : null,
                complaint.getResolution(),
                complaint.getCreatedAt()
        );
    }
}
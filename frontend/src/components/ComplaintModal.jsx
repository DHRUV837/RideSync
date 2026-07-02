import { useState } from "react";
import { useApp } from "../context/AppContext";
import { complaintService } from "../services/apiService";

export default function ComplaintModal({
  open,
  onClose,
  respondentId,
  rideId,
  respondentName,
}) {
  const { addNotification } = useApp();

  const [subject, setSubject] = useState("");
  const [description, setDescription] = useState("");
  const [loading, setLoading] = useState(false);

  if (!open) return null;

  const handleSubmit = async () => {
    if (!subject.trim() || !description.trim()) {
      addNotification({
        title: "Missing Information",
        message: "Please fill all fields.",
        type: "warning",
      });
      return;
    }

    try {
      setLoading(true);

      await complaintService.createComplaint({
        respondentId,
        rideId,
        subject,
        description,
      });

      addNotification({
        title: "Complaint Submitted",
        message: "Your complaint has been submitted successfully.",
        type: "success",
      });

      setSubject("");
      setDescription("");
      onClose();
    } catch (err) {
      console.error(err);

      addNotification({
        title: "Submission Failed",
        message:
          err.response?.data?.error ||
          "Unable to submit complaint.",
        type: "danger",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay">
      <div className="modal" style={{ maxWidth: 550 }}>

        <div className="modal-header">
          <h2>🚨 Report User</h2>

          <button
            className="modal-close"
            onClick={onClose}
          >
            ✕
          </button>
        </div>

        <div className="modal-body">

          <p
            style={{
              marginBottom: 18,
              color: "var(--text-muted)",
            }}
          >
            Reporting:
            <strong> {respondentName}</strong>
          </p>

          <div className="input-group">
            <label>Subject</label>

            <input
              className="input-field"
              value={subject}
              onChange={(e) =>
                setSubject(e.target.value)
              }
              placeholder="Complaint subject"
            />
          </div>

          <div className="input-group">

            <label>Description</label>

            <textarea
              rows={5}
              className="input-field"
              value={description}
              onChange={(e) =>
                setDescription(e.target.value)
              }
              placeholder="Describe the issue..."
            />

          </div>

          <div
            style={{
              display: "flex",
              justifyContent: "flex-end",
              gap: 12,
              marginTop: 24,
            }}
          >
            <button
              className="btn btn-secondary"
              onClick={onClose}
            >
              Cancel
            </button>

            <button
              className="btn btn-danger"
              onClick={handleSubmit}
              disabled={loading}
            >
              {loading
                ? "Submitting..."
                : "Submit Complaint"}
            </button>
          </div>

        </div>
      </div>
    </div>
  );
}
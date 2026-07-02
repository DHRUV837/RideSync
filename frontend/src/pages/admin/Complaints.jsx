import { useEffect, useMemo, useState } from "react";
import { adminService } from "../../services/apiService";
import { useApp } from "../../context/AppContext";

const STATUS = {
  pending: { label: "🟡 Pending", cls: "badge-warning" },
  under_review: { label: "🔵 Under Review", cls: "badge-primary" },
  resolved: { label: "✅ Resolved", cls: "badge-success" },
  rejected: { label: "❌ Rejected", cls: "badge-danger" },
};

export default function Complaints() {
  const { addNotification } = useApp();
  const [complaints,setComplaints]=useState([]);
  const [loading,setLoading]=useState(true);
  const [filter,setFilter]=useState("all");
  const [search,setSearch]=useState("");
  const [selected,setSelected]=useState(null);
  const [resolution,setResolution]=useState("");

  useEffect(()=>{
    load();
  },[]);

  async function load(){
    try{
      const res=await adminService.getComplaints();
      setComplaints(res.data||[]);
    }catch(e){
      addNotification({title:"Error",message:"Unable to load complaints",type:"danger"});
    }finally{
      setLoading(false);
    }
  }

  async function updateStatus(status){
    if(!selected) return;
    const res=await adminService.updateComplaintStatus(selected.id,{
      status,
      resolution
    });
    setComplaints(prev=>prev.map(c=>c.id===selected.id?res.data:c));
    setSelected(null);
    setResolution("");
  }

  const filtered=useMemo(()=>{
    return complaints.filter(c=>{
      const okFilter=filter==="all"||c.status===filter;
      const q=search.toLowerCase();
      const okSearch=
      !q||
      c.subject?.toLowerCase().includes(q)||
      c.complainantName?.toLowerCase().includes(q)||
      c.respondentName?.toLowerCase().includes(q);
      return okFilter&&okSearch;
    });
  },[complaints,filter,search]);

  if(loading) return <div className="page-content">Loading complaints...</div>;

  return (
    <div className="page-content">
      <h1>Complaint Management</h1>

      <div style={{display:"flex",gap:12,marginBottom:20}}>
        <input
          className="input-field"
          placeholder="Search..."
          value={search}
          onChange={e=>setSearch(e.target.value)}
        />

        {["all","pending","under_review","resolved","rejected"].map(f=>(
          <button
            key={f}
            className={`btn ${filter===f?"btn-primary":"btn-secondary"}`}
            onClick={()=>setFilter(f)}>
            {f}
          </button>
        ))}
      </div>

      {filtered.map(c=>(
        <div key={c.id} className="card" style={{marginBottom:16}}>
          <h3>{c.subject}</h3>
          <p><b>Complainant:</b> {c.complainantName}</p>
          <p><b>Against:</b> {c.respondentName}</p>
          <p>{c.description}</p>

          <span className={`badge ${STATUS[c.status]?.cls}`}>
            {STATUS[c.status]?.label}
          </span>

          <div style={{marginTop:12}}>
            <button className="btn btn-primary"
              onClick={()=>{
                setSelected(c);
                setResolution(c.resolution||"");
              }}>
              View / Update
            </button>
          </div>
        </div>
      ))}

      {selected && (
        <div className="modal-overlay">
          <div className="card" style={{maxWidth:650,margin:"40px auto"}}>
            <h2>Complaint #{selected.id}</h2>

            <p><b>Subject:</b> {selected.subject}</p>
            <p><b>Description:</b></p>
            <p>{selected.description}</p>

            <textarea
              className="input-field"
              rows={5}
              value={resolution}
              onChange={e=>setResolution(e.target.value)}
              placeholder="Resolution..."
            />

            <div style={{display:"flex",gap:10,marginTop:20}}>
              <button className="btn btn-secondary"
                onClick={()=>updateStatus("UNDER_REVIEW")}>
                Under Review
              </button>

              <button className="btn btn-primary"
                onClick={()=>updateStatus("RESOLVED")}>
                Resolve
              </button>

              <button className="btn btn-danger"
                onClick={()=>updateStatus("REJECTED")}>
                Reject
              </button>

              <button className="btn"
                onClick={()=>setSelected(null)}>
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

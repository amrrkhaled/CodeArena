import React, { useState, useEffect } from "react";
import { useContext } from "react";
import 'katex/dist/katex.min.css';
import renderMathInElement from 'katex/contrib/auto-render';
import api from "../api";
import { ContestContext } from "../context/ContextCreation";

export const DropProblemsFile = () => {
  const [file, setFile] = useState(null);
  const [isDragging, setIsDragging] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [problems, setProblems] = useState([]);
  const { selectedContestId } = useContext(ContestContext);
  const contestId = selectedContestId;
  const isUploadDisabled = !contestId || !file;

  const handleFileChange = (e) => {
    setFile(e.target.files[0] || null);
  };

  const handleRemoveFile = () => {
    setFile(null);
    setError("");
    setSuccess("");
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    const droppedFile = e.dataTransfer.files?.[0];
    if (droppedFile) {
      setFile(droppedFile);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (!file) {
      setError("Please select a file to upload.");
      return;
    }
    if (!contestId) {
      setError("Please choose a contest first.");
      return;
    }

    const formData = new FormData();
    formData.append("file", file);

    try {
      const adminToken = localStorage.getItem('adminToken');
      const response = await api.post(
        `/problems/admin/${contestId}`,
        formData,
        {
          headers: {
            "Content-Type": "multipart/form-data",
            Authorization: `Bearer ${adminToken}`,
          },
        }
      );

      if (response.status === 201) {
        setSuccess("Problems uploaded.");
        setProblems(response.data.problems || response.data);
        setFile(null);
      } else {
        setError("Failed to upload problems. Please try again.");
      }
    } catch (error) {
      console.error("Error uploading problems:", error);
      if (error.response?.data?.message) {
        setError(`Upload failed: ${error.response.data.message}`);
      } else {
        setError("Upload failed due to a server error.");
      }
    }
  };

  useEffect(() => {
      problems.forEach((problem) => {
        const el = document.getElementById(`uploaded-problem-${problem.id}`);
        if (el) {
          renderMathInElement(el, {
            delimiters: [
              { left: "$$", right: "$$", display: true },
              { left: "$", right: "$", display: false },
            ],
          });
        }
      });
    }, [problems]);

  return (
    <div className="drop-container">
      <div className="drop-card">
        <form onSubmit={handleSubmit} className="drop-form">
          <div
            className={`drop-zone ${file ? "has-file" : ""} ${isDragging ? "dragging" : ""}`}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
          >
            <div className="drop-zone-copy">
              <h3>{file ? "Ready to upload" : "Upload file"}</h3>
              <p>{contestId ? "Drag and drop or select a file." : "Choose a contest first."}</p>
            </div>
            <input
              type="file"
              className="drop-input"
              id="file"
              onChange={handleFileChange}
              accept=".json"
              hidden
              required
            />
          </div>

          <div className="drop-info-card">
            <div className="drop-file-summary">
              <span className="drop-summary-label">File</span>
              <span className={`drop-summary-name ${file ? "has-file" : ""}`}>
                {file ? file.name : "No file selected"}
              </span>
            </div>

            <div className="drop-file-actions">
              <label htmlFor="file" className="drop-file-button">
                {file ? "Change File" : "Select File"}
              </label>
              {file && (
                <button type="button" className="drop-remove-button" onClick={handleRemoveFile}>
                  Remove File
                </button>
              )}
            </div>
          </div>

          <div className="drop-footer">
            <button type="submit" className="drop-button" disabled={isUploadDisabled}>
              Upload Problems
            </button>
          </div>
        </form>

        {error && <div className="drop-alert error">{error}</div>}
        {success && <div className="drop-alert success">{success}</div>}

        {problems.length > 0 && (
          <div className="problems-list">
            <h2>Uploaded Problems</h2>
            <ul>
              {problems.map((problem) => (
                <li key={problem.id} className="problem-card">
                  <h5>{problem.title}</h5>
                  <div id={`uploaded-problem-${problem.id}`} className="problem-description">
                    <div style={{ whiteSpace: "pre-wrap" }}>{problem.description}</div>
                    <h6>Input</h6>
                    <div style={{ whiteSpace: "pre-wrap" }}>{problem.input_description}</div>
                    <h6>Output</h6>
                    <div style={{ whiteSpace: "pre-wrap" }}>{problem.output_description}</div>
                  </div>
                  <small>Time Limit: {problem.time_limit_ms} ms</small>
                  <br />
                  <small>Memory Limit: {problem.memory_limit_mb} MB</small>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
};

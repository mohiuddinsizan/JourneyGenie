import React, { useState } from "react";
import axios from "axios";

const LandmarkUploader = () => {
  const [file, setFile] = useState(null);
  const [result, setResult] = useState(null); // store object { location, link }
  const [loading, setLoading] = useState(false);

  const API_BASE = import.meta.env.REACT_APP_API_URL || "http://localhost:8080";

  const handleFileChange = (e) => {
    setFile(e.target.files[0]);
    setResult(null); // reset previous result
  };

  const handleUpload = async () => {
    if (!file) return alert("Please select an image first!");
    const formData = new FormData();
    formData.append("file", file);

    try {
      setLoading(true);
      const res = await axios.post(`${API_BASE}/api/landmark/predict`, formData, {
        headers: { "Content-Type": "multipart/form-data" },
        withCredentials: true,
      });
      setResult(res.data);
    } catch (err) {
      console.error(err);
      if (err.response && err.response.status === 401) {
        setResult({ error: "Authentication failed. Please login first!" });
      } else {
        setResult({ error: "Error predicting landmark" });
      }
    } finally {
      setLoading(false);
    }
  };

  // --- CSS Styles ---
  const styles = {
    container: {
      backgroundColor: "#121212",
      color: "#fff",
      padding: "30px",
      borderRadius: "12px",
      maxWidth: "450px",
      margin: "40px auto",
      fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif",
      boxShadow: "0 0 20px rgba(0,0,0,0.5)",
    },
    title: {
      textAlign: "center",
      marginBottom: "20px",
      color: "#00e0ff",
    },
    input: {
      display: "block",
      width: "100%",
      padding: "10px",
      borderRadius: "8px",
      border: "1px solid #444",
      backgroundColor: "#1e1e1e",
      color: "#fff",
      marginBottom: "15px",
    },
    button: {
      width: "100%",
      padding: "12px",
      backgroundColor: "#00e0ff",
      color: "#000",
      border: "none",
      borderRadius: "8px",
      fontWeight: "bold",
      cursor: "pointer",
      transition: "all 0.3s",
    },
    buttonDisabled: {
      backgroundColor: "#555",
      cursor: "not-allowed",
    },
    resultBox: {
      marginTop: "25px",
      padding: "15px",
      backgroundColor: "#1e1e1e",
      borderRadius: "10px",
      border: "1px solid #333",
    },
    link: {
      color: "#00e0ff",
      textDecoration: "none",
    },
    error: {
      color: "#ff4c4c",
      fontWeight: "bold",
    },
  };

  return (
    <div style={styles.container}>
      <h2 style={styles.title}>Upload a Landmark Image</h2>
      <input type="file" accept="image/*" onChange={handleFileChange} style={styles.input} />
      <button
        onClick={handleUpload}
        disabled={loading}
        style={{ ...styles.button, ...(loading ? styles.buttonDisabled : {}) }}
      >
        {loading ? "Predicting..." : "Predict"}
      </button>

      {result && (
        <div style={styles.resultBox}>
          {result.error ? (
            <div style={styles.error}>{result.error}</div>
          ) : (
            <>
              <div><strong>Location:</strong> {result.location}</div>
              <div>
                <strong>Link:</strong>{" "}
                <a href={result.link} target="_blank" rel="noopener noreferrer" style={styles.link}>
                  {result.link}
                </a>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
};

export default LandmarkUploader;

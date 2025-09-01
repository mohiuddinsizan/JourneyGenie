import React from "react";
import LandmarkUploader from "../components/LandmarkUploader.jsx";

const landmarks = [
  { id: 0, name: "Qutb Minar", link: "http://commons.wikimedia.org/wiki/Category:Qutb_Minar_and_its_monuments,_Delhi" },
  { id: 1, name: "Angkor Wat", link: "http://commons.wikimedia.org/wiki/Category:Angkor_Wat" },
  { id: 2, name: "Zvartnots", link: "http://commons.wikimedia.org/wiki/Category:Zvartnots" },
  { id: 3, name: "Chichén Itzá", link: "http://commons.wikimedia.org/wiki/Category:Chich%C3%A9n_Itz%C3%A1" },
  { id: 4, name: "Masada", link: "http://commons.wikimedia.org/wiki/Category:Masada" },
  { id: 5, name: "Eiffel Tower", link: "http://commons.wikimedia.org/wiki/Category:Eiffel_Tower" },
  { id: 6, name: "Victoria Memorial", link: "http://commons.wikimedia.org/wiki/Category:Victoria_Memorial,_Kolkata" },
  { id: 7, name: "Rohtas Fort", link: "http://commons.wikimedia.org/wiki/Category:Rohtas_Fort" },
  { id: 8, name: "Itmad-Ud-Daulah's Tomb", link: "http://commons.wikimedia.org/wiki/Category:Itmad-Ud-Daulah's_Tomb" },
  { id: 9, name: "Faisal Mosque", link: "http://commons.wikimedia.org/wiki/Category:Faisal_Mosque" },
];

const SearchPlacePage = () => {
  // --- Inline Styles ---
  const styles = {
    container: {
      padding: "40px",
      backgroundColor: "#0d0d0d",
      color: "#fff",
      fontFamily: "'Segoe UI', sans-serif",
      minHeight: "100vh",
    },
    header: {
      textAlign: "center",
      marginBottom: "40px",
    },
    headerTitle: {
      color: "#00e0ff",
      fontSize: "2.2rem",
      marginBottom: "10px",
    },
    headerDesc: {
      fontSize: "1rem",
      color: "#ccc",
      maxWidth: "600px",
      margin: "0 auto",
    },
    modelInfo: {
      background: "#1e1e1e",
      padding: "20px",
      borderRadius: "12px",
      marginBottom: "40px",
      border: "1px solid #333",
    },
    sectionTitle: {
      fontSize: "1.5rem",
      color: "#00e0ff",
      marginBottom: "15px",
    },
    landmarksList: {
      marginBottom: "40px",
    },
    badges: {
      display: "flex",
      flexWrap: "wrap",
      gap: "10px",
    },
    badge: {
      background: "#1a1a1a",
      border: "1px solid #333",
      padding: "8px 14px",
      borderRadius: "20px",
      color: "#00e0ff",
      fontSize: "0.9rem",
      textDecoration: "none",
      transition: "all 0.3s",
    },
    badgeHover: {
      background: "#00e0ff",
      color: "#000",
    },
    uploaderSection: {
      marginTop: "40px",
    },
  };

  return (
    <div style={styles.container}>
      {/* --- Header --- */}
      <header style={styles.header}>
        <h1 style={styles.headerTitle}>Landmark Detection AI</h1>
        <p style={styles.headerDesc}>
          Upload an image of a landmark and let our AI detect it.
        </p>
      </header>

      {/* --- Model Info --- */}
      <section style={styles.modelInfo}>
        <h2 style={styles.sectionTitle}>About the Model</h2>
        <p><strong>Architecture:</strong> ResNet18 (transfer learning)</p>
        <p><strong>Validation Accuracy:</strong> ~85%</p>
      </section>

      {/* --- Supported Landmarks --- */}
      <section style={styles.landmarksList}>
        <h2 style={styles.sectionTitle}>Currently Supported Landmarks</h2>
        <div style={styles.badges}>
          {landmarks.map((lm) => (
            <a
              key={lm.id}
              href={lm.link}
              target="_blank"
              rel="noopener noreferrer"
              style={styles.badge}
              onMouseEnter={(e) =>
                (e.currentTarget.style.background = "#00e0ff", e.currentTarget.style.color = "#000")
              }
              onMouseLeave={(e) =>
                (e.currentTarget.style.background = "#1a1a1a", e.currentTarget.style.color = "#00e0ff")
              }
            >
              {lm.name}
            </a>
          ))}
        </div>
      </section>

      {/* --- Uploader Section --- */}
      <section style={styles.uploaderSection}>
        <LandmarkUploader />
      </section>
    </div>
  );
};

export default SearchPlacePage;

import axios from "axios";

// API base URL
const API_BASE_URL = "http://localhost:8000/api/v1";

// Get token from localStorage
const getToken = () => {
  return localStorage.getItem("access_token");
};

// Create axios instance with default config
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

// Request interceptor to add token
api.interceptors.request.use(
  (config) => {
    const token = getToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  },
);

// Employee API endpoints
export const employeeApi = {
  // Get employee matricule
  getMatricule: async () => {
    try {
      const token = getToken();

      console.log("Token : " + token )

      const response = await api.get("http://192.168.5.151:8000/api/v1/employe/matricule/", {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });
      return response.data;
    } catch (error) {
      console.error("Error fetching employee matricule:", error);
      throw error;
    }
  },
};

// Fiche paie API endpoints (existing)
export const fichePaieApi = {
  getFolders: async () => {
    try {
      const token = getToken();
      const response = await fetch("http://localhost:8001/folders", {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });
      if (!response.ok)
        throw new Error("Erreur lors de la récupération des dossiers");
      return await response.json();
    } catch (error) {
      console.error("Error fetching folders:", error);
      throw error;
    }
  },

  getFiles: async (folderName) => {
    try {
      const token = getToken();
      const response = await fetch(
        `http://localhost:8001/list_files/${folderName}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        },
      );
      if (!response.ok)
        throw new Error("Erreur lors de la récupération des fichiers");
      return await response.json();
    } catch (error) {
      console.error("Error fetching files:", error);
      throw error;
    }
  },
};

export default api;

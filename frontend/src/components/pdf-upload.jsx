import React, { useState } from 'react';
import axios from 'axios';

const API_BASE_URL = 'http://localhost:8001';

const PdfUpload = () => {
  const [selectedFile, setSelectedFile] = useState(null);
  const [taskId, setTaskId] = useState(null);
  const [status, setStatus] = useState(null);
  const [processedPaths, setProcessedPaths] = useState([]);
  const [loading, setLoading] = useState(false);

  const handleFileSelect = (event) => {
    setSelectedFile(event.target.files[0]);
  };

  const handleUpload = async () => {
    if (!selectedFile) {
      alert('Please select a PDF file first');
      return;
    }

    setLoading(true);
    const formData = new FormData();
    formData.append('file', selectedFile);

    try {
      const response = await axios.post(`${API_BASE_URL}/process`, formData);
      setTaskId(response.data.task_id);
      setStatus('Processing...');
      pollTaskStatus(response.data.task_id);
    } catch (error) {
      console.error('Upload error:', error);
      alert('Upload failed. Please try again.');
      setLoading(false);
    }
  };

  const pollTaskStatus = async (taskId) => {
    const interval = setInterval(async () => {
      try {
        const response = await axios.get(`${API_BASE_URL}/task/${taskId}`);
        setStatus(response.data.status);

        if (response.data.status === 'Completed') {
          clearInterval(interval);
          setLoading(false);

          // Get the folder structure
          const downloadResponse = await axios.get(`${API_BASE_URL}/download/${taskId}`);
          const structure = downloadResponse.data.folder_structure;
          const outputDir = downloadResponse.data.output_dir;

          // Collect all paths
          const paths = [];
          for (const [employeeDir, files] of Object.entries(structure)) {
            for (const file of files) {
              paths.push(`${outputDir}/${employeeDir}/${file}`);
            }
          }
          setProcessedPaths(paths);
        }
      } catch (error) {
        console.error('Status check error:', error);
        clearInterval(interval);
        setLoading(false);
        alert('Error checking task status. Please try again.');
      }
    }, 2000); // Poll every 2 seconds
  };

  return (
    <div className="max-w-4xl mx-auto p-6 bg-white shadow-lg rounded-lg">
      <h2 className="text-2xl font-bold mb-6 text-center">PDF Upload & Processing</h2>

      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Select PDF File:
        </label>
        <input
          type="file"
          accept=".pdf"
          onChange={handleFileSelect}
          className="block w-full text-sm text-gray-500
                     file:mr-4 file:py-2 file:px-4
                     file:rounded-full file:border-0
                     file:text-sm file:font-semibold
                     file:bg-blue-50 file:text-blue-700
                     hover:file:bg-blue-100"
        />
      </div>

      <button
        onClick={handleUpload}
        disabled={!selectedFile || loading}
        className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed"
      >
        {loading ? 'Processing...' : 'Upload & Process PDF'}
      </button>

      {status && (
        <p className="mt-4 text-center text-lg">
          Status: <span className={status === 'Completed' ? 'text-green-600' : 'text-blue-600'}>{status}</span>
        </p>
      )}

      {processedPaths.length > 0 && (
        <div className="mt-8">
          <h3 className="text-xl font-semibold mb-4">Processed PDF Paths:</h3>
          <div className="overflow-x-auto">
            <table className="min-w-full bg-white border border-gray-300">
              <thead className="bg-gray-50">
                <tr>
                  <th className="py-2 px-4 border-b text-left">#</th>
                  <th className="py-2 px-4 border-b text-left">PDF Path</th>
                </tr>
              </thead>
              <tbody>
                {processedPaths.map((path, index) => (
                  <tr key={index} className="hover:bg-gray-50">
                    <td className="py-2 px-4 border-b text-sm font-mono">{index + 1}</td>
                    <td className="py-2 px-4 border-b font-mono text-sm break-all">{path}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default PdfUpload;

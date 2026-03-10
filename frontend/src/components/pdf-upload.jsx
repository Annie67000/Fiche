import React, { useState, useCallback } from 'react';
import axios from 'axios';
import { useDropzone } from 'react-dropzone';
import { Viewer } from '@react-pdf-viewer/core';
import { defaultLayoutPlugin } from '@react-pdf-viewer/default-layout';
import { X } from 'lucide-react';
import '@react-pdf-viewer/core/lib/styles/index.css';
import '@react-pdf-viewer/default-layout/lib/styles/index.css';

const API_BASE_URL = import.meta.env.VITE_PDF_PROCESSOR_URL;

const PdfUpload = () => {
  const [selectedFile, setSelectedFile] = useState(null);
  const [taskId, setTaskId] = useState(null);
  const [status, setStatus] = useState(null);
  const [processedPaths, setProcessedPaths] = useState([]);
  const [loading, setLoading] = useState(false);
  const [viewingPdf, setViewingPdf] = useState(null);
  const [processDetail, setProcessDetail] = useState(null);

  const onDrop = useCallback((acceptedFiles, rejectedFiles) => {
    if (rejectedFiles.length > 0) {
      alert('Seuls les fichiers PDF sont acceptés. Veuillez sélectionner un fichier PDF valide.');
      return;
    }
    if (acceptedFiles.length > 0) {
      setSelectedFile(acceptedFiles[0]);
    }
  }, []);

  const { getRootProps, getInputProps, isDragActive, isDragAccept, isDragReject } = useDropzone({
    onDrop,
    accept: {
      'application/pdf': ['.pdf']
    },
    maxFiles: 1,
    maxSize: 50 * 1024 * 1024, // 50MB
  });

  const handleUpload = async () => {
    if (!selectedFile) {
      alert('Veuillez d\'abord sélectionner un fichier PDF');
      return;
    }

    setLoading(true);
    const formData = new FormData();
    formData.append('file', selectedFile);

    try {
      const response = await axios.post(`${API_BASE_URL}/process`, formData);
      setTaskId(response.data.task_id);
      setStatus('Traitement en cours…');
      pollTaskStatus(response.data.task_id);
    } catch (error) {
      console.error('Upload error:', error);
      alert('Échec du téléversement. Veuillez réessayer.');
      setLoading(false);
    }
  };

  const removeFile = () => {
    setSelectedFile(null);
  };

  const pollTaskStatus = async (taskId) => {
    const interval = setInterval(async () => {
      try {
        const response = await axios.get(`${API_BASE_URL}/task/${taskId}`);
        setStatus(response.data.status);
        setProcessDetail(response.data.detail || null);

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
        alert('Erreur lors de la vérification du statut de la tâche. Veuillez réessayer.');
      }
    }, 100); // Poll every 2 seconds
  };

  return (
    <div className="max-w-4xl mx-auto p-6 bg-white shadow-lg rounded-lg">
      <h2 className="text-2xl font-bold mb-6 text-center">Téléversement et traitement de PDF</h2>

      <div className="mb-6">
        <div
          {...getRootProps()}
          className={`
            border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors
            ${isDragActive && isDragAccept ? 'border-green-400 bg-green-50' : ''}
            ${isDragActive && isDragReject ? 'border-red-400 bg-red-50' : ''}
            ${!isDragActive ? 'border-gray-300 hover:border-blue-400 hover:bg-blue-50' : ''}
          `}
        >
          <input {...getInputProps()} />
          <div className="space-y-4">
            <div className="mx-auto w-16 h-16 text-gray-400">
              <svg fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z" clipRule="evenodd"></path>
              </svg>
            </div>
            <div>
              {isDragActive ? (
                <p className="text-lg font-medium">
                  {isDragAccept ? (
                    <span className="text-green-600">Déposez le fichier PDF ici...</span>
                  ) : (
                    <span className="text-red-600">Seuls les fichiers PDF sont autorisés</span>
                  )}
                </p>
              ) : (
                <div>
                  <p className="text-lg font-medium text-gray-900">
                    Glissez-déposez un fichier PDF ici, ou cliquez pour sélectionner
                  </p>
                  <p className="text-sm text-gray-500 mt-1">
                    Seuls les fichiers PDF sont acceptés (max 50 Mo)
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>

        {selectedFile && (
          <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-red-500 rounded text-white flex items-center justify-center">
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4zm2 6a1 1 0 011-1h6a1 1 0 110 2H7a1 1 0 01-1-1zm1 3a1 1 0 100 2h6a1 1 0 100-2H7z" clipRule="evenodd"></path>
                  </svg>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-900">{selectedFile.name}</p>
                  <p className="text-xs text-gray-500">{(selectedFile.size / 1024 / 1024).toFixed(2)} MB</p>
                </div>
              </div>
              <button
                onClick={removeFile}
                className="text-red-500 hover:text-red-700 p-1"
                title="Supprimer le fichier"
              >
                <X className="w-5 h-5 cursor-pointer" />
              </button>
            </div>
          </div>
        )}
      </div>

      <button
        onClick={handleUpload}
        disabled={!selectedFile || loading}
        className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed"
      >
        {loading ? 'Traitement en cours…' : 'Téléverser et traiter le PDF'}
      </button>

      {status && (
        <p className="mt-4 text-center text-lg">
          Statut : <span className={status === 'Completed' ? 'text-green-600' : 'text-blue-600'}>{status === 'Completed' ? 'Terminé' : status}</span>
        </p>
      )}

      {processDetail && (
        <div className="mt-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
          <h3 className="text-lg font-semibold mb-2">Détails du traitement :</h3>
          <p className="text-sm text-yellow-800 whitespace-pre-wrap">{processDetail}</p>
        </div>
      )}

      {processedPaths.length > 0 && (
        <div className="mt-8">
          <h3 className="text-xl font-semibold mb-4">Chemins des PDF traités :</h3>
          <div className="overflow-x-auto">
            <table className="min-w-full bg-white border border-gray-300">
              <thead className="bg-gray-50">
                <tr>
                  <th className="py-2 px-4 border-b text-left">#</th>
                  <th className="py-2 px-4 border-b text-left">Chemin du PDF</th>
                  <th className="py-2 px-4 border-b text-left">Actions</th>
                </tr>
              </thead>
              <tbody>
                {processedPaths.map((path, index) => (
                  <tr key={index} className="hover:bg-gray-50">
                    <td className="py-2 px-4 border-b text-sm font-mono">{index + 1}</td>
                    <td className="py-2 px-4 border-b font-mono text-sm break-all">{path}</td>
                    <td className="py-2 px-4 border-b text-sm">
                      <button
                        onClick={() => setViewingPdf(path)}
                        className="mr-2 px-3 py-1 bg-blue-500 text-white rounded text-xs hover:bg-blue-600"
                      >
                        Voir
                      </button>
                      <button
                        onClick={() => {
                          const link = document.createElement('a');
                          link.href = `${API_BASE_URL}/media/${path}`;
                          link.download = path.split('/').pop();
                          link.click();
                        }}
                        className="px-3 py-1 bg-green-500 text-white rounded text-xs hover:bg-green-600"
                      >
                        Télécharger
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {viewingPdf && (
        <div className="mt-8 p-4 bg-gray-100 rounded">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-semibold">Visualisation : {viewingPdf.split('/').pop()}</h3>
            <button
              onClick={() => setViewingPdf(null)}
              className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600"
            >
              Fermer
            </button>
          </div>
          <div className="border h-[600px]">
            <Viewer
              fileUrl={`${API_BASE_URL}/media/${viewingPdf}`}
              plugins={[defaultLayoutPlugin()]}
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default PdfUpload;

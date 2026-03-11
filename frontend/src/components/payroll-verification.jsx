import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  Box,
  Text,
  ScrollArea,
  TextInput,
  Button,
  Group,
  Alert,
  Divider,
  Paper,
  Modal,
  Stack,
  Loader,
  Card,
  Grid,
  Badge,
  LoadingOverlay,
  Pagination,
} from '@mantine/core';
import { useDebouncedValue } from '@mantine/hooks';
import { 
  IconSearch, 
  IconEye, 
  IconDownload, 
  IconRefresh, 
  IconFolder, 
  IconX,
  IconFile,
  IconAlertCircle,
} from '@tabler/icons-react';

const ITEMS_PER_PAGE = 10;
const API_URL = import.meta.env.VITE_PDF_PROCESSOR_URL;

const PayrollVerificationPage = () => {
  const [fiches, setFiches] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearch] = useDebouncedValue(searchTerm, 300);
  const [error, setError] = useState(null);
  const [selectedPdf, setSelectedPdf] = useState(null);
  const [pdfModalOpen, setPdfModalOpen] = useState(false);
  const [pdfLoading, setPdfLoading] = useState(false);
  const [loading, setLoading] = useState(false);
  const [selectedFolder, setSelectedFolder] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);

  const extractMatricule = useCallback((fileName) => {
    const match = fileName.match(/^(\d+)_/);
    return match ? match[1] : 'inconnu';
  }, []);

  const groupedData = useMemo(() => {
    const groups = {};
    fiches.forEach(fiche => {
      const folderName = fiche.folderName;
      if (!groups[folderName]) {
        groups[folderName] = [];
      }
      groups[folderName].push(fiche);
    });

    const sortedFolders = Object.keys(groups).sort();
    const sortedGroups = {};
    sortedFolders.forEach(folder => {
      sortedGroups[folder] = groups[folder].sort((a, b) =>
        a.matricule.localeCompare(b.matricule)
      );
    });
    return sortedGroups;
  }, [fiches]);

  const currentFolderSlips = useMemo(() => {
    if (!selectedFolder || !groupedData[selectedFolder]) {
      return [];
    }
    return groupedData[selectedFolder];
  }, [groupedData, selectedFolder]);

  const filteredSlips = useMemo(() => {
    if (!debouncedSearch) return currentFolderSlips;
    const search = debouncedSearch.toLowerCase();
    return currentFolderSlips.filter(fiche => 
      fiche.matricule.toLowerCase().includes(search)
    );
  }, [currentFolderSlips, debouncedSearch]);

  const totalPages = Math.ceil(filteredSlips.length / ITEMS_PER_PAGE);
  const paginatedSlips = filteredSlips.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  useEffect(() => {
    setCurrentPage(1);
  }, [selectedFolder, debouncedSearch]);

  const loadFichesFromAPI = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`${API_URL}/folders`);
      if (!response.ok) throw new Error('Erreur lors de la récupération des dossiers');
      const data = await response.json();
      const folders = data.folders;

      const allFiches = [];
      let id = 1;

      const folderPromises = folders.map(async (folderPath) => {
        const folderName = folderPath.split('/').pop();
        const filesResponse = await fetch(`${API_URL}/list_files/${folderName}`);
        if (!filesResponse.ok) return [];
        const filesData = await filesResponse.json();
        
        return filesData.files.map(relPath => ({
          id: id++,
          matricule: extractMatricule(relPath.split('/').pop()),
          fileName: relPath,
          folderName: folderName,
          encryptedFileName: relPath.replace('.pdf', '.enc'),
        }));
      });

      const results = await Promise.all(folderPromises);
      results.forEach(fiches => allFiches.push(...fiches));
      setFiches(allFiches);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [extractMatricule]);

  const getSecureFileUrl = useCallback((fiche) => {
    const baseName = fiche.fileName.split('/').pop();
    const cleanFileName = baseName.replace('.pdf', '.enc');
    return `${API_URL}/secure_file/${fiche.folderName}/${encodeURIComponent(cleanFileName)}`;
  }, []);

  const getAuthHeaders = useCallback(() => {
    const token = localStorage.getItem('access_token');
    return token ? { Authorization: `Bearer ${token}` } : {};
  }, []);

  const handleDisplay = useCallback((fiche) => {
    setPdfLoading(true);
    const url = getSecureFileUrl(fiche);
    
    fetch(url, { headers: getAuthHeaders() })
      .then(response => {
        if (!response.ok) {
          if (response.status === 401 || response.status === 403) {
            throw new Error('Non autorisé. Veuillez vous connecter.');
          }
          throw new Error('Erreur lors du chargement du PDF');
        }
        return response.blob();
      })
      .then(blob => {
        const blobUrl = URL.createObjectURL(blob);
        setSelectedPdf(blobUrl);
        setPdfModalOpen(true);
      })
      .catch(err => {
        setError(err.message);
        setPdfLoading(false);
      });
  }, [getSecureFileUrl, getAuthHeaders]);

  const handleDownload = useCallback((fiche) => {
    const url = getSecureFileUrl(fiche);
    
    fetch(url, { headers: getAuthHeaders() })
      .then(response => {
        if (!response.ok) {
          if (response.status === 401 || response.status === 403) {
            throw new Error('Non autorisé. Veuillez vous connecter.');
          }
          throw new Error('Erreur lors du téléchargement');
        }
        return response.blob();
      })
      .then(blob => {
        const blobUrl = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = blobUrl;
        link.download = fiche.fileName;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(blobUrl);
      })
      .catch(err => {
        setError(err.message);
      });
  }, [getSecureFileUrl, getAuthHeaders]);

  const handleClosePdfModal = useCallback(() => {
    if (selectedPdf && selectedPdf.startsWith('blob:')) {
      URL.revokeObjectURL(selectedPdf);
    }
    setPdfModalOpen(false);
    setSelectedPdf(null);
  }, [selectedPdf]);

  const handleFolderClick = useCallback((folderName) => {
    setSelectedFolder(prev => prev === folderName ? null : folderName);
    setCurrentPage(1);
  }, []);

  useEffect(() => {
    loadFichesFromAPI();
  }, [loadFichesFromAPI]);

  return (
    <Box p="xl" style={{ height: '100vh', display: 'flex', flexDirection: 'column', position: 'relative' }}>
      <LoadingOverlay visible={loading} overlayProps={{ blur: 2 }} />
      
      {/* Fixed Header */}
      <Box mb="md">
        <Text size="xl" weight={700} align="center">
          Vérification des Fiches de Paie
        </Text>
        <Divider my="sm" />
        
        <Group position="center" mb="md">
          <Button
            leftSection={<IconRefresh size={16} />}
            onClick={loadFichesFromAPI}
            loading={loading}
          >
            Recharger les bulletins
          </Button>
        </Group>

        {fiches.length > 0 && (
          <Box w="100%" mx="auto" style={{ maxWidth: '500px' }}>
            <TextInput
              placeholder="Rechercher par matricule"
              leftSection={<IconSearch size={16} />}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              clearable
            />
          </Box>
        )}

        {error && (
          <Alert color="red" icon={<IconAlertCircle size={16} />} title="Erreur" onClose={() => setError(null)} withCloseButton>
            {error}
          </Alert>
        )}
      </Box>

      {/* Scrollable Content */}
      <ScrollArea style={{ flex: 1 }} scrollbarSize={8}>
        <Box>
          {loading && fiches.length === 0 ? (
            <Group position="center" mt="xl">
              <Loader size="lg" />
              <Text>Chargement des bulletins...</Text>
            </Group>
          ) : Object.keys(groupedData).length === 0 ? (
            <Text color="dimmed" align="center" mt="xl">
              Aucun bulletin disponible. Cliquez sur "Recharger les bulletins".
            </Text>
          ) : (
            <Grid cols={{ base: 2, sm: 3, md: 4, lg: 5 }} spacing="md">
              {Object.entries(groupedData).map(([folderName, slips]) => (
                <Grid.Col key={folderName} span={1}>
                  <Card
                    shadow="sm"
                    padding="lg"
                    radius="md"
                    onClick={() => handleFolderClick(folderName)}
                    withBorder
                    sx={{
                      cursor: 'pointer',
                      transition: 'all 0.2s ease',
                      '&:hover': {
                        transform: 'translateY(-2px)',
                        boxShadow: '0 4px 20px rgba(0, 0, 0, 0.1)',
                      },
                    }}
                  >
                    <Stack align="center" gap="xs">
                      <IconFolder size={32} color="#228be6" />
                      <Text weight={600} size="sm" color="#228be6" lineClamp={1}>
                        {folderName}
                      </Text>
                      <Badge color="blue" variant="light" size="sm" radius="xl">
                        {slips.length} bulletins
                      </Badge>
                    </Stack>
                  </Card>
                </Grid.Col>
              ))}
            </Grid>
          )}

          {selectedFolder && (
            <Box mt="lg">
              <Divider my="md" />
              <Group position="apart" mb="md">
                <Group gap="sm">
                  <IconFolder size={20} color="#228be6" />
                  <Text size="lg" weight={600}>Dossier: {selectedFolder}</Text>
                  <Badge variant="light">{filteredSlips.length} bulletins</Badge>
                </Group>
                <Button 
                  variant="subtle" 
                  size="sm" 
                  leftSection={<IconX size={16} />} 
                  onClick={() => setSelectedFolder(null)}
                >
                  Fermer
                </Button>
              </Group>
              <Paper shadow="sm" padding="md" radius="md" withBorder>
                {paginatedSlips.length === 0 ? (
                  <Text size="sm" color="dimmed" align="center" p="md">
                    {debouncedSearch 
                      ? `Aucun résultat pour "${debouncedSearch}"` 
                      : `Aucun bulletin disponible dans le dossier ${selectedFolder}`}
                  </Text>
                ) : (
                  <Stack gap="sm">
                    {paginatedSlips.map((fiche) => (
                      <Paper 
                        key={fiche.id} 
                        p="sm" 
                        shadow="xs" 
                        withBorder
                        sx={{ 
                          transition: 'background-color 0.15s ease',
                          '&:hover': { backgroundColor: '#f8f9fa' }
                        }}
                      >
                        <Group position="apart" wrap="nowrap">
                          <Box style={{ flex: 1, minWidth: 0 }}>
                            <Group gap="xs" mb={4}>
                              <IconFile size={14} color="#868e96" />
                              <Text size="sm" weight={500}>
                                Matricule: <strong>{fiche.matricule}</strong>
                              </Text>
                            </Group>
                            <Text size="xs" color="dimmed" lineClamp={1}>
                              {fiche.fileName}
                            </Text>
                          </Box>
                          <Group gap="xs" wrap="nowrap">
                            {/* <Button
                              size="xs"
                              variant="light"
                              leftSection={<IconEye size={14} />}
                              onClick={() => handleDisplay(fiche)}
                            >
                              Afficher
                            </Button> */}
                            <Button
                              size="xs"
                              variant="light"
                              color="blue"
                              leftSection={<IconDownload size={14} />}
                              onClick={() => handleDownload(fiche)}
                            >
                              Télécharger
                            </Button>
                          </Group>
                        </Group>
                      </Paper>
                    ))}
                  </Stack>
                )}
              </Paper>
            </Box>
          )}
        </Box>
      </ScrollArea>

      {/* Fixed Footer with Pagination */}
      <Box mt="md" pb="md">
        {totalPages > 1 && (
          <Group position="center" gap="md">
            <Pagination
              total={totalPages}
              value={currentPage}
              onChange={setCurrentPage}
              size="sm"
              withEdges
            />
          </Group>
        )}
        {totalPages > 0 && (
          <Text size="sm" color="dimmed" align="center" mt="xs">
            Affichage de {(currentPage - 1) * ITEMS_PER_PAGE + 1} à {Math.min(currentPage * ITEMS_PER_PAGE, filteredSlips.length)} sur {filteredSlips.length} bulletins
          </Text>
        )}
      </Box>

      <Modal
        opened={pdfModalOpen}
        onClose={handleClosePdfModal}
        title="Aperçu du Bulletin de Paie"
        size="100%"
        fullScreen
        padding={0}
        withCloseButton
      >
        {selectedPdf && (
          <Box style={{ position: 'relative', height: '100%' }}>
            <LoadingOverlay visible={pdfLoading} overlayProps={{ blur: 2 }} />
            <iframe
              src={selectedPdf}
              width="100%"
              height="100%"
              style={{ border: 'none', display: 'block' }}
              title="PDF Viewer"
              onLoad={() => setPdfLoading(false)}
              onError={() => {
                setPdfLoading(false);
                setError('Erreur lors du chargement du PDF');
              }}
            />
          </Box>
        )}
      </Modal>
    </Box>
  );
};

export default PayrollVerificationPage;

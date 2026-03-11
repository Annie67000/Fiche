import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  Box,
  Text,
  ScrollArea,
  TextInput,
  Button,
  Group,
  Alert,
  Paper,
  Modal,
  Stack,
  Loader,
  Card,
  Grid,
  Badge,
  LoadingOverlay,
  Pagination,
  ThemeIcon,
  Title,
  SegmentedControl,
  Tooltip,
  ActionIcon,
  Collapse,
  RingProgress,
  SimpleGrid,
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
  IconFileTypePdf,
  IconLayoutGrid,
  IconList,
  IconChevronDown,
  IconChevronUp,
  IconCheck,
  IconClock,
  IconStack,
} from '@tabler/icons-react';

import PayrollHeader from './payroll-header';

const ITEMS_PER_PAGE = 6;
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
  const [viewMode, setViewMode] = useState('grid');
  const [statsExpanded, setStatsExpanded] = useState(true);
  const [downloadingId, setDownloadingId] = useState(null);

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
      fiche.matricule.toLowerCase().includes(search) ||
      fiche.fileName.toLowerCase().includes(search)
    );
  }, [currentFolderSlips, debouncedSearch]);

  const totalPages = Math.ceil(filteredSlips.length / ITEMS_PER_PAGE);
  const paginatedSlips = filteredSlips.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  const stats = useMemo(() => {
    const totalFolders = Object.keys(groupedData).length;
    const totalFiches = fiches.length;
    const avgPerFolder = totalFolders > 0 ? Math.round(totalFiches / totalFolders) : 0;
    return { totalFolders, totalFiches, avgPerFolder };
  }, [groupedData, fiches]);

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
    setDownloadingId(fiche.id);
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
      })
      .finally(() => {
        setDownloadingId(null);
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
    <Box style={{ height: '100vh', display: 'flex', flexDirection: 'column', position: 'relative', backgroundColor: '#f8fafc' }}>
      <LoadingOverlay visible={loading} overlayProps={{ blur: 3, opacity: 0.5 }} />
      
      {/* Header */}
      <PayrollHeader 
        loading={loading} 
        loadFichesFromAPI={loadFichesFromAPI} 
        stats={stats} 
        statsExpanded={statsExpanded} 
        setStatsExpanded={setStatsExpanded} 
      />

      {/* Search & Controls */}
      <Box px="lg" py="md" bg="white" style={{ borderBottom: '1px solid #e2e8f0' }}>
        <Group justify="space-between">
          <Group gap="md">
            <TextInput
              placeholder="Rechercher par matricule ou nom de fichier..."
              leftSection={<IconSearch size={18} />}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              clearable
              w={350}
              styles={{
                input: {
                  borderRadius: 8,
                  '&:focus': {
                    borderColor: '#3b82f6',
                  }
                }
              }}
            />
            {selectedFolder && (
              <Badge size="lg" variant="light" color="blue" radius="sm">
                {filteredSlips.length} résultat{filteredSlips.length !== 1 ? 's' : ''}
              </Badge>
            )}
          </Group>
          <SegmentedControl
            value={viewMode}
            onChange={setViewMode}
            data={[
              { label: <Group gap={4}><IconLayoutGrid size={16} /></Group>, value: 'grid' },
              { label: <Group gap={4}><IconList size={16} /></Group>, value: 'list' },
            ]}
            size="sm"
          />
        </Group>
      </Box>

      {error && (
        <Box px="lg" pt="md">
          <Alert color="red" icon={<IconAlertCircle size={16} />} title="Erreur" onClose={() => setError(null)} withCloseButton>
            {error}
          </Alert>
        </Box>
      )}

      {/* Scrollable Content */}
      <ScrollArea scrollbarSize={8} p="lg">
        <Box>
          {loading && fiches.length === 0 ? (
            <Group position="center" mt="4xl" gap="md">
              <Loader size="lg" color="blue" />
              <Text c="dimmed">Chargement des bulletins...</Text>
            </Group>
          ) : Object.keys(groupedData).length === 0 ? (
            <Paper p="4xl" radius="lg" bg="gray.0" withBorder>
              <Stack align="center" gap="md">
                <ThemeIcon size={64} radius="xl" variant="light" color="gray">
                  <IconFolder size={32} />
                </ThemeIcon>
                <Text size="lg" fw={500} c="dimmed">Aucun bulletin disponible</Text>
                <Text size="sm" c="dimmed">Cliquez sur "Actualiser" pour charger les bulletins</Text>
              </Stack>
            </Paper>
          ) : !selectedFolder ? (
            <Box>
              <Text size="sm" fw={500} c="dimmed" mb="md" tt="uppercase">Sélectionnez un dossier</Text>
              <Grid cols={{ base: 2, sm: 3, md: 4, lg: 5 }} gutter="md">
                {Object.entries(groupedData).map(([folderName, slips]) => (
                  <Grid.Col key={folderName} span={2}>
                    <Card
                      shadow="sm"
                      padding="lg"
                      radius="lg"
                      onClick={() => handleFolderClick(folderName)}
                      withBorder
                      sx={{
                        cursor: 'pointer',
                        transition: 'all 0.2s ease',
                        backgroundColor: 'white',
                        '&:hover': {
                          transform: 'translateY(-4px)',
                          boxShadow: '0 12px 24px -8px rgba(0, 0, 0, 0.15)',
                          borderColor: '#3b82f6',
                        },
                      }}
                    >
                      <Stack align="center" gap="sm">
                        <ThemeIcon size={48} radius="xl" variant="light" color="blue">
                          <IconFolder size={24} />
                        </ThemeIcon>
                        <Text fw={600} size="sm" c="#1e293b" lineClamp={1} ta="center">
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
            </Box>
          ) : (
            <Box>
              <Group justify="space-between" mb="lg">
                <Group gap="sm">
                  <ActionIcon variant="light" color="blue" onClick={() => setSelectedFolder(null)}>
                    <IconChevronDown size={16} style={{ transform: 'rotate(90deg)' }} />
                  </ActionIcon>
                  <Title order={4}>{selectedFolder}</Title>
                  <Badge variant="light">{filteredSlips.length} bulletins</Badge>
                </Group>
                <Button 
                  variant="subtle" 
                  size="sm" 
                  leftSection={<IconX size={16} />} 
                  onClick={() => setSelectedFolder(null)}
                  color="gray"
                >
                  Fermer
                </Button>
              </Group>

              {paginatedSlips.length === 0 ? (
                <Paper p="xl" radius="lg" bg="gray.0" withBorder>
                  <Stack align="center" gap="md">
                    <IconSearch size={32} color="#94a3b8" />
                    <Text c="dimmed">
                      {debouncedSearch 
                        ? `Aucun résultat pour "${debouncedSearch}"` 
                        : 'Aucun bulletin disponible'}
                    </Text>
                  </Stack>
                </Paper>
              ) : viewMode === 'grid' ? (
                <Grid cols={{ base: 1, sm: 2, md: 3, lg: 3 }} gutter="lg">
                  {paginatedSlips.map((fiche) => (
                    <Grid.Col key={fiche.id} span={2}>
                      <Card
                        padding="lg"
                        radius="lg"
                        withBorder
                        sx={{
                          transition: 'all 0.2s ease',
                          '&:hover': {
                            transform: 'translateY(-4px)',
                            boxShadow: '0 12px 24px -8px rgba(0, 0, 0, 0.15)',
                          },
                        }}
                      >
                        <Stack gap="md" align="center">
                          <ThemeIcon size={56} radius="xl" variant="light" color="red">
                            <IconFileTypePdf size={28} />
                          </ThemeIcon>
                          <Text size="md" fw={700} ta="center" lineClamp={1}>
                            {fiche.matricule}
                          </Text>
                          <Text size="sm" c="dimmed" ta="center" lineClamp={2}>
                            {fiche.fileName.split('/').pop()}
                          </Text>
                          <Group gap="sm" justify="center" mt="md">
                            <Button 
                              variant="light" 
                              color="blue" 
                              size="md"
                              leftSection={downloadingId === fiche.id ? <Loader size={14} color="blue" /> : <IconDownload size={18} />}
                              onClick={() => handleDownload(fiche)}
                              loading={downloadingId === fiche.id}
                            >
                              {downloadingId === fiche.id ? 'Chargement...' : 'Télécharger'}
                            </Button>
                          </Group>
                        </Stack>
                      </Card>
                    </Grid.Col>
                  ))}
                </Grid>
              ) : (
                <Stack gap="sm">
                  {paginatedSlips.map((fiche) => (
                    <Card
                      key={fiche.id}
                      padding="md"
                      radius="md"
                      withBorder
                      sx={{
                        transition: 'all 0.15s ease',
                        '&:hover': {
                          backgroundColor: '#f8fafc',
                          borderColor: '#cbd5e1',
                        },
                      }}
                    >
                      <Group justify="space-between" wrap="nowrap">
                        <Group gap="md" wrap="nowrap" style={{ flex: 1, minWidth: 0 }}>
                          <ThemeIcon size="lg" radius="md" variant="light" color="red">
                            <IconFileTypePdf size={18} />
                          </ThemeIcon>
                          <Box style={{ flex: 1, minWidth: 0 }}>
                            <Group gap="xs">
                              <Text size="sm" fw={600}>
                                Matricule: {fiche.matricule}
                              </Text>
                              {fiche.matricule !== 'inconnu' && (
                                <Badge size="xs" variant="light" color="green" leftSection={<IconCheck size={10} />}>
                                  Valide
                                </Badge>
                              )}
                            </Group>
                            <Text size="xs" c="dimmed" lineClamp={1}>
                              {fiche.fileName}
                            </Text>
                          </Box>
                        </Group>
                        <Group gap="sm" wrap="nowrap">
                          {/* <Tooltip label="Voir">
                            <ActionIcon 
                              variant="light" 
                              color="gray"
                              onClick={() => handleDisplay(fiche)}
                            >
                              <IconEye size={16} />
                            </ActionIcon>
                          </Tooltip> */}
                          <Tooltip label={downloadingId === fiche.id ? 'Chargement...' : 'Télécharger'}>
                            <ActionIcon 
                              variant="light" 
                              color="blue"
                              onClick={() => handleDownload(fiche)}
                              loading={downloadingId === fiche.id}
                            >
                              {downloadingId === fiche.id ? <Loader size={14} color="blue" /> : <IconDownload size={16} />}
                            </ActionIcon>
                          </Tooltip>
                        </Group>
                      </Group>
                    </Card>
                  ))}
                </Stack>
              )}
            </Box>
          )}
        </Box>
      </ScrollArea>

      {/* Footer with Pagination */}
      {selectedFolder && totalPages > 0 && (
        <Box p="md" bg="white" style={{ borderTop: '1px solid #e2e8f0' }}>
          <Group justify="space-between">
            <Text size="sm" c="dimmed">
              Affichage de {(currentPage - 1) * ITEMS_PER_PAGE + 1} à {Math.min(currentPage * ITEMS_PER_PAGE, filteredSlips.length)} sur {filteredSlips.length} bulletins
            </Text>
            <Pagination
              total={totalPages}
              value={currentPage}
              onChange={setCurrentPage}
              size="sm"
              withEdges
              siblings={1}
            />
          </Group>
        </Box>
      )}

      <Modal
        opened={pdfModalOpen}
        onClose={handleClosePdfModal}
        title={
          <Group gap="sm">
            <ThemeIcon size="sm" variant="light" color="red">
              <IconFileTypePdf size={14} />
            </ThemeIcon>
            <Text fw={600}>Aperçu du Bulletin de Paie</Text>
          </Group>
        }
        size="100%"
        fullScreen
        padding={0}
        withCloseButton
      >
        {selectedPdf && (
          <Box style={{ position: 'relative', height: '100%', backgroundColor: '#1e293b' }}>
            <LoadingOverlay visible={pdfLoading} overlayProps={{ blur: 2, opacity: 0.3 }} />
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

import React, { useState, useEffect, useMemo } from 'react';
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
  Collapse,
  Pagination,
  Card,
  Grid,
  Badge,
} from '@mantine/core';
import { IconSearch, IconEye, IconDownload, IconRefresh, IconChevronDown, IconChevronRight, IconFolder, IconX } from '@tabler/icons-react';

const ITEMS_PER_PAGE = 10;

const PayrollVerificationPage = () => {
  const [fiches, setFiches] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [error, setError] = useState(null);
  const [selectedPdf, setSelectedPdf] = useState(null);
  const [pdfModalOpen, setPdfModalOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  // States for folder-based navigation
  const [selectedFolder, setSelectedFolder] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);

  // Extract matricule from filename
  const extractMatricule = (fileName) => {
    const match = fileName.match(/^(\d+)_/);
    return match ? match[1] : 'inconnu';
  };

  // Group data by folder name
  const groupedData = useMemo(() => {
    const groups = {};

    fiches.forEach(fiche => {
      const folderName = fiche.folderName;
      if (!groups[folderName]) {
        groups[folderName] = [];
      }
      groups[folderName].push(fiche);
    });

    // Sort folders alphabetically and sort files within each folder by matricule
    const sortedFolders = Object.keys(groups).sort();

    const sortedGroups = {};
    sortedFolders.forEach(folder => {
      sortedGroups[folder] = groups[folder].sort((a, b) =>
        a.matricule.localeCompare(b.matricule)
      );
    });

    return sortedGroups;
  }, [fiches]);

  // Get current folder's pay slips with pagination
  const currentFolderSlips = useMemo(() => {
    if (!selectedFolder || !groupedData[selectedFolder]) {
      return [];
    }
    return groupedData[selectedFolder];
  }, [groupedData, selectedFolder]);

  const totalPages = Math.ceil(currentFolderSlips.length / ITEMS_PER_PAGE);
  const paginatedSlips = currentFolderSlips.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  // Reset pagination when folder changes
  useEffect(() => {
    setCurrentPage(1);
  }, [selectedFolder]);

  // Load fiches from API
  const loadFichesFromAPI = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`${import.meta.env.VITE_PDF_PROCESSOR_URL}/folders`);
      if (!response.ok) throw new Error('Erreur lors de la récupération des dossiers');
      const data = await response.json();
      const folders = data.folders;

      const allFiches = [];
      let id = 1;

      for (const folderPath of folders) {
        const folderName = folderPath.split('/').pop();
        const filesResponse = await fetch(`${import.meta.env.VITE_PDF_PROCESSOR_URL}/list_files/${folderName}`);
        if (!filesResponse.ok) continue;
        const filesData = await filesResponse.json();
        const files = filesData.files;

        for (const relPath of files) {
          const baseName = relPath.split('/').pop();

          allFiches.push({
            id: id++,
            matricule: extractMatricule(baseName),
            fileName: relPath,
            folderName: folderName,
            url: `${import.meta.env.VITE_PDF_PROCESSOR_URL}/media/${folderName}/${relPath}`,
          });
        }
      }

      setFiches(allFiches);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Handle folder selection
  const handleFolderClick = (folderName) => {
    setSelectedFolder(selectedFolder === folderName ? null : folderName);
    setCurrentPage(1);
  };

  const handleDisplay = (fiche) => {
    setSelectedPdf(fiche.url);
    setPdfModalOpen(true);
  };

  const handleDownload = (fiche) => {
    const link = document.createElement('a');
    link.href = fiche.url;
    link.download = fiche.fileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleVerify = (fiche, isValid) => {
    const status = isValid ? 'correspond' : 'ne correspond pas';
    alert(`Matricule ${fiche.matricule} : ${status}`);
  };

  useEffect(() => {
    loadFichesFromAPI();
  }, []);

  return (
    <Box p="xl" h="100vh" style={{ overflow: 'hidden' }}>
      <Stack h="100%">
        {/* Header */}
        <Box>
          <Text size="xl" weight={700} align="center">
            Vérification des Fiches de Paie
          </Text>
          <Divider my="sm" />
        </Box>

        {/* Reload Button */}
        <Group position="center" mb="md">
          <Button
            leftSection={<IconRefresh size={16} />}
            onClick={loadFichesFromAPI}
            loading={loading}
          >
            Recharger les bulletins
          </Button>
        </Group>

        {/* Search */}
        {fiches.length > 0 && (
          <Box w="100%" mx="auto" style={{ maxWidth: '500px' }}>
            <TextInput
              placeholder="Rechercher par matricule"
              leftSection={<IconSearch size={16} />}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </Box>
        )}

        {error && <Alert color="red" title="Erreur">{error}</Alert>}

        {/* Folder-based Navigation */}
        <ScrollArea h="100%" scrollbarSize={8}>
          <Box mt="md">
            {loading ? (
              <Group position="center" mt="xl">
                <Loader size="lg" />
                <Text>Chargement des bulletins...</Text>
              </Group>
            ) : Object.keys(groupedData).length === 0 ? (
              <Text color="dimmed" align="center" mt="xl">
                Aucun bulletin disponible. Cliquez sur "Recharger les bulletins".
              </Text>
            ) : (
              <Grid cols={{ base: 1, sm: 2, md: 3, lg: 4 }} spacing="md">
                {Object.entries(groupedData).map(([folderName, slips]) => (
                  <Grid.Col key={folderName} span={2}>
                    <Card
                      shadow="sm"
                      padding="lg"
                      radius="md"
                      onClick={() => handleFolderClick(folderName)}
                      className='min-w-[130px] w-auto'
                      sx={{
                        cursor: 'pointer',
                        backgroundColor: '#f8f9fa',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'center',
                        textAlign: 'center',
                        height: '140px',
                        '&:hover': {
                          transform: 'scale(1.02)',
                          boxShadow: '0 4px 20px rgba(0, 0, 0, 0.1)',
                          transition: 'all 0.2s ease',
                        },
                      }}
                    >
                      <IconFolder size={32} color="#228be6" style={{ marginBottom: '8px' }} />
                      <Text weight={600} size="md" color="#228be6" style={{ marginBottom: '8px' }}>
                        {folderName}
                      </Text>
                      <Badge color="blue" variant="light" size="sm" radius="xl">
                        {slips.length} bulletins
                      </Badge>
                    </Card>
                  </Grid.Col>
                ))}
              </Grid>
            )}

            {selectedFolder && (
              <Box mt="lg">
                <Divider my="md" />
                <Group position="apart" mb="md">
                  <Text size="lg" weight={600}>Contenu du dossier: {selectedFolder}</Text>
                  <Button variant="subtle" size="sm" leftSection={<IconX size={16} />} onClick={() => setSelectedFolder(null)}>
                    Fermer
                  </Button>
                </Group>
                <Card shadow="sm" padding="md" radius="md" withBorder>
                  {paginatedSlips.length === 0 ? (
                    <Text size="sm" color="dimmed" align="center" p="md">
                      Aucun bulletin disponible dans le dossier {selectedFolder}
                    </Text>
                  ) : (
                    <Stack spacing="xs">
                      {paginatedSlips
                        .filter((fiche) =>
                          fiche.matricule.toLowerCase().includes(searchTerm.toLowerCase())
                        )
                        .map((fiche) => (
                          <Paper key={fiche.id} p="sm" shadow="xs" withBorder>
                            <Text size="sm" weight={500}>
                              Matricule : <strong>{fiche.matricule}</strong>
                            </Text>
                            <Text size="xs" color="dimmed" mt={2}>
                              {fiche.fileName}
                            </Text>
                            <Group mt="xs" spacing="xs">
                              <Button
                                size="xs"
                                variant="outline"
                                leftSection={<IconEye size={14} />}
                                onClick={() => handleDisplay(fiche)}
                              >
                                Afficher
                              </Button>
                              <Button
                                size="xs"
                                variant="outline"
                                leftSection={<IconDownload size={14} />}
                                onClick={() => handleDownload(fiche)}
                              >
                                Télécharger
                              </Button>
                            </Group>
                          </Paper>
                        ))}
                      {totalPages > 1 && (
                        <Group position="center" mt="md">
                          <Pagination
                            total={totalPages}
                            value={currentPage}
                            onChange={setCurrentPage}
                            size="sm"
                          />
                        </Group>
                      )}
                    </Stack>
                  )}
                </Card>
              </Box>
            )}
          </Box>
        </ScrollArea>
      </Stack>

      {/* PDF Modal */}
      <Modal
        opened={pdfModalOpen}
        onClose={() => {
          setPdfModalOpen(false);
          setSelectedPdf(null);
        }}
        title="Aperçu du Bulletin de Paie"
        size="100%"
        fullScreen
        padding={0}
        withCloseButton={false}
      >
        {selectedPdf ? (
          <Box
            style={{
              width: '100%',
              height: '100vh',
              overflow: 'hidden',
              background: '#fff',
            }}
          >
            <iframe
              src={selectedPdf}
              width="100%"
              height="100%"
              style={{
                border: 'none',
                display: 'block',
                margin: 0,
                padding: 0,
              }}
              title="PDF Viewer"
            />
          </Box>
        ) : (
          <Text p="xl" align="center">Impossible de charger le PDF.</Text>
        )}
      </Modal>
    </Box>
  );
};

export default PayrollVerificationPage;

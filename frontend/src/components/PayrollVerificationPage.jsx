import React, { useState, useEffect, useRef } from 'react';
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
} from '@mantine/core';
import { IconSearch, IconEye, IconDownload, IconRefresh } from '@tabler/icons-react';

const PayrollVerificationPage = () => {
  const [fiches, setFiches] = useState([]);
  const [filteredFiches, setFilteredFiches] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [error, setError] = useState(null);
  const [selectedPdf, setSelectedPdf] = useState(null);
  const [pdfModalOpen, setPdfModalOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  // Filtrage en temps réel
  useEffect(() => {
    const filtered = fiches.filter((fiche) =>
      fiche.matricule.toLowerCase().includes(searchTerm.toLowerCase())
    );
    setFilteredFiches(filtered);
  }, [searchTerm, fiches]);

  // Charger les fiches depuis l'API
  useEffect(() => {
    loadFichesFromAPI();
  }, []);

  // Extraire le matricule du nom de fichier (ex: "1266_NOM_PRENOM.pdf" → "1266")
  const extractMatricule = (fileName) => {
    const match = fileName.match(/^(\d+)_/);
    return match ? match[1] : 'inconnu';
  };

  // Charger les fiches depuis l'API
  const loadFichesFromAPI = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch('http://localhost:8001/folders');
      if (!response.ok) throw new Error('Erreur lors de la récupération des dossiers');
      const data = await response.json();
      const folders = data.folders;

      const allFiches = [];
      let id = 1;

      for (const folderPath of folders) {
        const folderName = folderPath.split('/').pop(); // extraire le nom du dossier
        const filesResponse = await fetch(`http://localhost:8001/list_files/${folderName}`);
        if (!filesResponse.ok) continue;
        const filesData = await filesResponse.json();
        const files = filesData.files;

        for (const relPath of files) {
          const baseName = relPath.split('/').pop();
          allFiches.push({
            id: id++,
            matricule: extractMatricule(baseName),
            fileName: relPath,
            url: `http://localhost:8001/media/${folderName}/${relPath}`,
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

        {/* Bouton pour recharger */}
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

        {/* Liste des fiches */}
        <ScrollArea h="100%" scrollbarSize={8}>
          <Stack spacing="sm" mt="md">
            {loading ? (
              <Group position="center" mt="xl">
                <Loader size="lg" />
                <Text>Chargement des bulletins...</Text>
              </Group>
            ) : fiches.length === 0 ? (
              <Text color="dimmed" align="center" mt="xl">
                Aucun bulletin disponible. Cliquez sur "Recharger les bulletins".
              </Text>
            ) : filteredFiches.length === 0 ? (
              <Text color="dimmed" align="center" mt="xl">
                Aucun bulletin trouvé pour "{searchTerm}"
              </Text>
            ) : (
              filteredFiches.map((fiche) => (
                <Paper key={fiche.id} p="md" shadow="xs" withBorder>
                  <Text size="sm" weight={500}>
                    Matricule : <strong>{fiche.matricule}</strong>
                  </Text>
                  <Text size="xs" color="dimmed" mt={2}>
                    {fiche.fileName}
                  </Text>
                  <Group mt="sm" spacing="xs">
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
              ))
            )}
          </Stack>
        </ScrollArea>
      </Stack>
      {/* Modal pour afficher le PDF */}
<Modal
  opened={pdfModalOpen}
  onClose={() => {
    setPdfModalOpen(false);
    setSelectedPdf(null);
  }}
  title="Aperçu du Bulletin de Paie"
  size="100%"
  fullScreen
  padding={0} // ← Supprime les marges internes du modal
  withCloseButton={false} // Optionnel : si tu veux retirer le "X" en haut à droite
>
  {selectedPdf ? (
    <Box
      style={{
        width: '100%',
        height: '100vh', // ← Prend toute la hauteur de l'écran
        overflow: 'hidden',
        background: '#fff',
      }}
    >
      <iframe
        src={selectedPdf}
        width="100%"
        height="100%" // ← Prend toute la hauteur du conteneur
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

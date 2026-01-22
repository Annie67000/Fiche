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
  FileInput,
} from '@mantine/core';
import { IconSearch, IconEye, IconDownload, IconCheck, IconX, IconFolder } from '@tabler/icons-react';

const PayrollVerificationPage = () => {
  const [fiches, setFiches] = useState([]); // ← maintenant dynamique
  const [filteredFiches, setFilteredFiches] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [error, setError] = useState(null);
  const [selectedPdf, setSelectedPdf] = useState(null);
  const [pdfModalOpen, setPdfModalOpen] = useState(false);
  const fileInputRef = useRef(null);

  // Filtrage en temps réel
  useEffect(() => {
    const filtered = fiches.filter((fiche) =>
      fiche.matricule.toLowerCase().includes(searchTerm.toLowerCase())
    );
    setFilteredFiches(filtered);
  }, [searchTerm, fiches]);

  // Extraire le matricule du nom de fichier (ex: "1266_NOM_PRENOM.pdf" → "1266")
  const extractMatricule = (fileName) => {
    const match = fileName.match(/^(\d+)_/);
    return match ? match[1] : 'inconnu';
  };

  // Gérer la sélection d’un dossier
  const handleDirectorySelect = (files) => {
    if (!files || files.length === 0) return;

    const pdfFiles = Array.from(files).filter(file =>
      file.name.toLowerCase().endsWith('.pdf')
    );

    if (pdfFiles.length === 0) {
      setError("Aucun fichier PDF trouvé dans le dossier sélectionné.");
      setFiches([]);
      return;
    }

    // Créer une entrée pour chaque PDF
    const newFiches = pdfFiles.map((file, index) => ({
      id: index + 1,
      matricule: extractMatricule(file.name),
      fileName: file.name,
      fileObject: file, // ← on garde le fichier pour affichage/téléchargement
      objectUrl: URL.createObjectURL(file), // ← URL temporaire pour iframe & download
    }));

    setFiches(newFiches);
    setError(null);
  };

  const handleDisplay = (fiche) => {
    setSelectedPdf(fiche.objectUrl);
    setPdfModalOpen(true);
  };

  const handleDownload = (fiche) => {
    const link = document.createElement('a');
    link.href = fiche.objectUrl;
    link.download = fiche.fileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleVerify = (fiche, isValid) => {
    const status = isValid ? 'correspond' : 'ne correspond pas';
    alert(`Matricule ${fiche.matricule} : ${status}`);
  };

  // Nettoyer les URLs objets à la fin (éviter fuites mémoire)
  useEffect(() => {
    return () => {
      fiches.forEach(f => URL.revokeObjectURL(f.objectUrl));
    };
  }, [fiches]);

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

        {/* Bouton pour sélectionner un dossier */}
        <Group position="center" mb="md">
          <Button
            leftSection={<IconFolder size={16} />}
            onClick={() => fileInputRef.current?.click()}
          >
            Sélectionner un dossier de bulletins
          </Button>
          <input
            type="file"
            ref={fileInputRef}
            style={{ display: 'none' }}
            webkitdirectory="true"
            directory="true"
            multiple
            onChange={(e) => handleDirectorySelect(e.target.files)}
          />
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
            {fiches.length === 0 ? (
              <Text color="dimmed" align="center" mt="xl">
                Cliquez sur "Sélectionner un dossier" pour charger vos fiches de paie.
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
                    <Button
                      size="xs"
                      color="green"
                      leftSection={<IconCheck size={14} />}
                      onClick={() => handleVerify(fiche, true)}
                    >
                      Correspond
                    </Button>
                    <Button
                      size="xs"
                      color="red"
                      leftSection={<IconX size={14} />}
                      onClick={() => handleVerify(fiche, false)}
                    >
                      Ne correspond pas
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
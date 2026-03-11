import { useState, useCallback } from 'react';
import axios from 'axios';
import { useDropzone } from 'react-dropzone';
import { 
  Container, Title, Text, Card, Group, Button, Box, 
  ActionIcon, Badge, Progress, Table, Stack, ThemeIcon, 
  SimpleGrid, Stepper, CopyButton, Tooltip, Avatar, RingProgress,
  Divider, Modal, ScrollArea
} from '@mantine/core';
import { 
  IconUpload, IconFile, IconX, IconDownload, IconEye, 
  IconCopy, IconCheck, IconCloudUpload, IconFileSpreadsheet,
  IconChecklist, IconClock, IconAlertCircle, IconFileCheck,
  IconTrash, IconPlayerPlay, IconFileAnalytics
} from '@tabler/icons-react';
import { notifications } from '@mantine/notifications';

const API_BASE_URL = import.meta.env.VITE_PDF_PROCESSOR_URL;

const PdfUpload = () => {
  const [selectedFile, setSelectedFile] = useState(null);
  const [taskId, setTaskId] = useState(null);
  const [status, setStatus] = useState(null);
  const [processedPaths, setProcessedPaths] = useState([]);
  const [loading, setLoading] = useState(false);
  const [viewingPdf, setViewingPdf] = useState(null);
  const [processDetail, setProcessDetail] = useState(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [currentStep, setCurrentStep] = useState(0);

  const onDrop = useCallback((acceptedFiles, rejectedFiles) => {
    if (rejectedFiles.length > 0) {
      notifications.show({
        title: 'Fichier invalide',
        message: 'Seuls les fichiers PDF sont acceptés.',
        color: 'red',
        icon: <IconAlertCircle />,
      });
      return;
    }
    if (acceptedFiles.length > 0) {
      setSelectedFile(acceptedFiles[0]);
      notifications.show({
        title: 'Fichier sélectionné',
        message: `${acceptedFiles[0].name} prêt à être traité`,
        color: 'blue',
        icon: <IconFile />,
      });
    }
  }, []);

  const { getRootProps, getInputProps, isDragActive, isDragAccept, isDragReject } = useDropzone({
    onDrop,
    accept: { 'application/pdf': ['.pdf'] },
    maxFiles: 1,
    maxSize: 50 * 1024 * 1024,
  });

  const handleUpload = async () => {
    if (!selectedFile) return;

    setLoading(true);
    setUploadProgress(0);
    setCurrentStep(1);
    setStatus('pending');
    setProcessedPaths([]);
    
    const formData = new FormData();
    formData.append('file', selectedFile);

    try {
      const progressInterval = setInterval(() => {
        setUploadProgress(prev => {
          if (prev >= 90) {
            clearInterval(progressInterval);
            return 90;
          }
          return prev + 15;
        });
      }, 800);

      const response = await axios.post(`${API_BASE_URL}/process`, formData);
      setTaskId(response.data.task_id);
      setStatus('processing');
      setCurrentStep(2);
      pollTaskStatus(response.data.task_id, progressInterval);
    } catch (error) {
      console.error('Upload error:', error);
      setLoading(false);
      setCurrentStep(0);
      notifications.show({
        title: 'Erreur',
        message: 'Échec du téléversement. Veuillez réessayer.',
        color: 'red',
        icon: <IconX />,
      });
    }
  };

  const pollTaskStatus = async (taskId, progressInterval) => {
    const poll = setInterval(async () => {
      try {
        const response = await axios.get(`${API_BASE_URL}/task/${taskId}`);
        setStatus(response.data.status);
        
        if (response.data.status === 'Completed') {
          clearInterval(progressInterval);
          clearInterval(poll);
          setUploadProgress(100);
          setLoading(false);
          setCurrentStep(3);
          
          const downloadResponse = await axios.get(`${API_BASE_URL}/download/${taskId}`);
          const structure = downloadResponse.data.folder_structure;
          const outputDir = downloadResponse.data.output_dir;

          const paths = [];
          for (const [employeeDir, files] of Object.entries(structure)) {
            for (const file of files) {
              paths.push({ path: `${outputDir}/${employeeDir}/${file}`, employee: employeeDir, fileName: file });
            }
          }
          setProcessedPaths(paths);
          
          notifications.show({
            title: 'Traitement terminé',
            message: `${paths.length} fichier(s) traité(s) avec succès`,
            color: 'green',
            icon: <IconChecklist />,
          });
        } else if (response.data.status === 'Failed') {
          clearInterval(progressInterval);
          clearInterval(poll);
          setLoading(false);
          setCurrentStep(0);
          setUploadProgress(0);
          notifications.show({
            title: 'Échec',
            message: response.data.detail || 'Une erreur est survenue',
            color: 'red',
            icon: <IconAlertCircle />,
          });
        }
        
        setProcessDetail(response.data.detail);
      } catch (error) {
        clearInterval(progressInterval);
        clearInterval(poll);
        setLoading(false);
      }
    }, 5000);
  };

  const removeFile = () => {
    setSelectedFile(null);
    setUploadProgress(0);
    setCurrentStep(0);
  };

  const resetAll = () => {
    setSelectedFile(null);
    setTaskId(null);
    setStatus(null);
    setProcessedPaths([]);
    setLoading(false);
    setViewingPdf(null);
    setProcessDetail(null);
    setUploadProgress(0);
    setCurrentStep(0);
  };

  const getStepStatus = (step) => {
    if (currentStep > step) return 'completed';
    if (currentStep === step) return 'progress';
    return 'wait';
  };

  return (
    <Container size="xl" py="xl">
      <Stack gap="xl">
        <Box>
          <Group gap="md" mb="xs">
            <ThemeIcon size={40} radius="xl" variant="light" color="green">
              <IconFileAnalytics size={22} />
            </ThemeIcon>
            <Box>
              <Title order={2} fw={700}>Importation PDF</Title>
              <Text c="dimmed" size="sm">Importez et traitez vos fiches de paie</Text>
            </Box>
          </Group>
        </Box>

        <Stepper 
          active={currentStep} 
          color="green"
          size="sm"
          styles={{
            step: { padding: '0 8px' },
            stepIcon: { borderWidth: 2 },
            stepLabel: { fontSize: 12 }
          }}
        >
          <Stepper.Step 
            label="Sélection" 
            description="Choisir le fichier"
            icon={<IconFile size={18} />}
            completedIcon={<IconCheck size={18} />}
          />
          <Stepper.Step 
            label="Traitement" 
            description="Analyse en cours"
            icon={<IconPlayerPlay size={18} />}
            loading={currentStep === 2}
          />
          <Stepper.Step 
            label="Terminé" 
            description="Fichiers générés"
            icon={<IconChecklist size={18} />}
          />
        </Stepper>

        <SimpleGrid cols={{ base: 1, lg: 2 }} spacing="xl">
          <Card shadow="md" padding="xl" radius="lg" withBorder>
            <Stack gap="lg">
              <Group justify="space-between">
                <Text fw={600} size="lg">Fichier source</Text>
                <Badge variant="light" color="violet">PDF • Max 50Mo</Badge>
              </Group>
              
              <Box
                {...getRootProps()}
                style={{
                  border: `2px dashed ${isDragAccept ? '#40c057' : isDragReject ? '#fa5252' : isDragActive ? '#228be6' : '#dee2e6'}`,
                  backgroundColor: isDragAccept ? '#f0fff4' : isDragReject ? '#fff5f5' : isDragActive ? '#e7f5ff' : '#f8f9fa',
                  borderRadius: 16,
                  padding: 48,
                  textAlign: 'center',
                  cursor: 'pointer',
                  transition: 'all 0.3s ease',
                }}
              >
                <input {...getInputProps()} />
                <Stack align="center" gap="md">
                  <ThemeIcon 
                    size={72} 
                    radius="xl" 
                    variant="light" 
                    color={isDragAccept ? 'green' : isDragReject ? 'red' : isDragActive ? 'blue' : 'gray'}
                  >
                    <IconCloudUpload size={36} />
                  </ThemeIcon>
                  {isDragAccept ? (
                    <Text c="green" fw={600} size="lg">Déposez le fichier...</Text>
                  ) : isDragReject ? (
                    <Text c="red" fw={600} size="lg">PDF uniquement</Text>
                  ) : (
                    <>
                      <Text fw={600} size="lg" c="#1a1b1e">Glissez votre PDF ici</Text>
                      <Text c="dimmed" size="sm">ou cliquez pour parcourir</Text>
                    </>
                  )}
                </Stack>
              </Box>

              {selectedFile && (
                <Card withBorder radius="md" p="md" bg="gray.0">
                  <Group justify="space-between">
                    <Group gap="md">
                      <Avatar color="red" radius="md" size="lg">
                        <IconFileSpreadsheet size={22} />
                      </Avatar>
                      <Box>
                        <Text size="sm" fw={600} lineClamp={1} maw={250}>{selectedFile.name}</Text>
                        <Text size="xs" c="dimmed">{(selectedFile.size / 1024 / 1024).toFixed(2)} MB</Text>
                      </Box>
                    </Group>
                    <ActionIcon color="red" variant="light" onClick={removeFile} size="lg">
                      <IconTrash size={20} />
                    </ActionIcon>
                  </Group>
                </Card>
              )}

              {loading && (
                <Box>
                  <Group justify="space-between" mb={8}>
                    <Text size="sm" c="dimmed">
                      {currentStep === 1 ? 'Téléversement...' : 'Traitement en cours...'}
                    </Text>
                    <Text size="sm" fw={600}>{uploadProgress}%</Text>
                  </Group>
                  <Progress 
                    value={uploadProgress} 
                    color={uploadProgress === 100 ? 'green' : 'blue'} 
                    size="lg" 
                    radius="xl"
                    animated={currentStep === 1}
                  />
                </Box>
              )}

              <Group grow>
                <Button
                  size="md"
                  onClick={handleUpload}
                  disabled={!selectedFile || loading}
                  loading={loading && currentStep === 1}
                  leftSection={<IconUpload size={20} />}
                  color="green"
                  variant="filled"
                >
                  {loading ? 'Traitement...' : 'Démarrer'}
                </Button>
                {processedPaths.length > 0 && (
                  <Button
                    size="md"
                    variant="light"
                    onClick={resetAll}
                    leftSection={<IconPlayerPlay size={20} />}
                  >
                    Nouveau
                  </Button>
                )}
              </Group>
            </Stack>
          </Card>

          <Card shadow="md" padding="xl" radius="lg" withBorder>
            <Stack gap="lg">
              <Group justify="space-between">
                <Text fw={600} size="lg">Statut du traitement</Text>
                {status && (
                  <Badge 
                    size="lg" 
                    color={status === 'Completed' ? 'green' : status === 'Failed' ? 'red' : 'blue'}
                    variant="light"
                  >
                    {status === 'Completed' ? 'Terminé' : status === 'Failed' ? 'Échoué' : 'En cours'}
                  </Badge>
                )}
              </Group>

              <Divider />

              {processDetail && (
                <Card withBorder radius="md" p="sm" bg="yellow.0">
                  <Group gap="xs" mb="xs">
                    <IconAlertCircle size={16} color="#fab005" />
                    <Text size="sm" fw={600}>Détails</Text>
                  </Group>
                  <Text size="xs" c="dimmed" style={{ whiteSpace: 'pre-wrap' }}>{processDetail}</Text>
                </Card>
              )}

              {!status && (
                <Box py={60} style={{ textAlign: 'center' }}>
                  <RingProgress
                    size={120}
                    thickness={8}
                    roundCaps
                    sections={[{ value: 0, color: 'gray' }]}
                    label={
                      <Text c="dimmed" size="xs" ta="center">En attente</Text>
                    }
                    mx="auto"
                  />
                  <Text c="dimmed" size="sm" mt="md">Sélectionnez un fichier pour commencer</Text>
                </Box>
              )}

              {processedPaths.length > 0 && (
                <Box>
                  <Group justify="space-between" mb="md">
                    <Group gap="sm">
                      <IconFileCheck size={20} color="#40c057" />
                      <Text fw={600}>Résultats ({processedPaths.length})</Text>
                    </Group>
                    <Badge color="green" variant="light">{processedPaths.length} fichiers</Badge>
                  </Group>
                  
                  <ScrollArea h={300}>
                    <Table striped highlightOnHover>
                      <thead>
                        <tr>
                          <th>#</th>
                          <th>Employé</th>
                          <th>Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {processedPaths.map((item, index) => (
                          <tr key={index}>
                            <td>{index + 1}</td>
                            <td>
                              <Group gap="xs">
                                <Avatar size="sm" radius="xl" color="violet">
                                  {item.employee?.[0] || '?'}
                                </Avatar>
                                <Box>
                                  <Text size="sm" fw={500}>{item.employee}</Text>
                                  <Text size="xs" c="dimmed" lineClamp={1}>{item.fileName}</Text>
                                </Box>
                              </Group>
                            </td>
                            <td>
                              <Group gap="xs">
                                <Tooltip label="Visualiser">
                                  <ActionIcon 
                                    color="blue" 
                                    variant="light" 
                                    onClick={() => setViewingPdf(item.path)}
                                  >
                                    <IconEye size={16} />
                                  </ActionIcon>
                                </Tooltip>
                                <CopyButton value={`${API_BASE_URL}/media/${item.path}`}>
                                  {({ copied, copy }) => (
                                    <Tooltip label={copied ? 'Copié!' : 'Copier lien'}>
                                      <ActionIcon 
                                        color={copied ? 'teal' : 'gray'} 
                                        variant="light" 
                                        onClick={copy}
                                      >
                                        {copied ? <IconCheck size={16} /> : <IconCopy size={16} />}
                                      </ActionIcon>
                                    </Tooltip>
                                  )}
                                </CopyButton>
                                <Tooltip label="Télécharger">
                                  <ActionIcon 
                                    color="green" 
                                    variant="light"
                                    component="a"
                                    href={`${API_BASE_URL}/media/${item.path}`}
                                    download={item.fileName}
                                  >
                                    <IconDownload size={16} />
                                  </ActionIcon>
                                </Tooltip>
                              </Group>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </Table>
                  </ScrollArea>
                </Box>
              )}
            </Stack>
          </Card>
        </SimpleGrid>

        <Modal
          opened={!!viewingPdf}
          onClose={() => setViewingPdf(null)}
          title={
            <Group gap="sm">
              <IconFileSpreadsheet size={20} />
              <Text fw={600}>{viewingPdf?.split('/').pop()}</Text>
            </Group>
          }
          size="90%"
          padding="xs"
        >
          <Box style={{ height: '75vh' }}>
            <iframe
              src={viewingPdf ? `${API_BASE_URL}/media/${viewingPdf}` : ''}
              width="100%"
              height="100%"
              style={{ border: 'none', borderRadius: 8 }}
              title="PDF Viewer"
            />
          </Box>
        </Modal>
      </Stack>
    </Container>
  );
};

export default PdfUpload;

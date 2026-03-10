import { useState } from 'react';
import axios from 'axios';
import dayjs from 'dayjs';

import {
  Card, Title, Text, Badge, Table, TextInput, Select,
  Button, Group, ActionIcon, Avatar, Tooltip, Modal, Progress, FileInput
} from '@mantine/core';

import { DatePicker, MonthPickerInput } from '@mantine/dates';

import { notifications } from '@mantine/notifications';
import {
  IconSearch, IconCalendar, IconMail, IconDownload,
  IconCheck, IconX, IconClock, IconSend, IconUpload
} from '@tabler/icons-react';

export default function Employes() {
  const [search, setSearch] = useState('');
  const [opened, setOpened] = useState(false);
  const [progress, setProgress] = useState(0);
  const [uploading, setUploading] = useState(false);
  const [file, setFile] = useState(null);
  const [selectedEmploye, setSelectedEmploye] = useState(null);
  const [selectedMonth, setSelectedMonth] = useState(null);

  const employees = [
    { id: 1, matricule: 'EMP001', prenom: 'Aminata',  nom: 'Diop',     email: 'aminata@entreprise.sn',   statut: 'envoyee', lastSent: '28/11/2025' },
    { id: 2, matricule: 'EMP002', prenom: 'Moussa',   nom: 'Sow',      email: 'moussa@entreprise.sn',    statut: 'echec',   lastSent: '-' },
    { id: 3, matricule: 'EMP003', prenom: 'Fatou',    nom: 'Ndiaye',   email: 'fatou@entreprise.sn',     statut: 'attente', lastSent: '-' },
    { id: 4, matricule: 'EMP004', prenom: 'Ibrahima', nom: 'Ba',       email: 'ibrahima@entreprise.sn',  statut: 'envoyee', lastSent: '28/11/2025' },
    { id: 5, matricule: 'EMP005', prenom: 'Aïssatou', nom: 'Fall',     email: 'aissatou@entreprise.sn',  statut: 'attente', lastSent: '-' },
  ];

  const filtered = employees.filter(e =>
    `${e.prenom} ${e.nom} ${e.matricule} ${e.email}`.toLowerCase().includes(search.toLowerCase())
  );

  const stats = {
    total: filtered.length,
    envoyees: filtered.filter(e => e.statut === 'envoyee').length,
    attente: filtered.filter(e => e.statut === 'attente').length,
    echecs: filtered.filter(e => e.statut === 'echec').length,
  };

  const badge = (s) => {
    if (s === 'envoyee') return <Badge color="green" leftSection={<IconCheck size={14}/>}>Envoyée</Badge>;
    if (s === 'echec')   return <Badge color="red"   leftSection={<IconX size={14}/>}>Échec</Badge>;
    return <Badge color="yellow" leftSection={<IconClock size={14}/>}>En attente</Badge>;
  };

  // Téléchargement réel d’un PDF (fichier .pdf)
  const downloadPDF = (prenom, nom, matricule) => {
    notifications.show({
      title: 'Génération du PDF...',
      message: `${prenom} ${nom}`,
      loading: true,
      autoClose: false,
      id: 'pdf-gen'
    });

    setTimeout(() => {
      const content = `%PDF-1.4
      1 0 obj << /Type /Catalog /Pages 2 0 R >> endobj
      2 0 obj << /Type /Pages /Kids [3 0 R] /Count 1 >> endobj
      3 0 obj << /Type /Page /Parent 2 0 R /MediaBox [0 0 595 842]
      /Contents 4 0 R /Resources << /Font << /F1 5 0 R >> >> >> endobj
      4 0 obj << /Length 200 >> stream
      BT /F1 24 Tf 100 700 Td (FICHE DE PAIE - ${prenom} ${nom}) Tj
      100 650 Td (Matricule: ${matricule}) Tj
      100 600 Td (Mois: Décembre 2025) Tj
      100 550 Td (Net à payer: 880 000 FCFA) Tj ET
      endstream endobj
      5 0 obj << /Type /Font /Subtype /Type1 /BaseFont /Helvetica >> endobj
      xref 0 6 trailer << /Size 6 /Root 1 0 R >> startxref 0000 %%EOF`;

      const blob = new Blob([content], { type: 'application/pdf' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `Fiche_Paie_${matricule}_${prenom}_${nom}_Dec2025.pdf`;
      a.click();
      URL.revokeObjectURL(url);

      notifications.update({
        id: 'pdf-gen',
        title: 'Téléchargement terminé',
        message: `Fiche de ${prenom} ${nom} prête !`,
        color: 'green',
        icon: <IconDownload />,
        loading: false,
        autoClose: 4000,
      });
    }, 1200);
  };

  const resendEmail = (prenom, nom, email) => {
    notifications.show({
      title: 'Envoi en cours...',
      message: `Fiche envoyée à ${email}`,
      loading: true,
      autoClose: false,
      id: 'email'
    });

    setTimeout(() => {
      notifications.update({
        id: 'email',
        title: 'Envoyée avec succès !',
        message: `${prenom} ${nom} a reçu sa fiche`,
        color: 'green',
        icon: <IconMail />,
        loading: false,
        autoClose: 5000,
      });
    }, 1800);
  };

  const sendAll = () => {
    setOpened(true);
    setProgress(0);
    let p = 0;
    const interval = setInterval(() => {
      p += 18;
      setProgress(p);
      if (p >= 100) {
        clearInterval(interval);
        setTimeout(() => {
          setOpened(false);
          notifications.show({
            title: 'Opération terminée !',
            message: 'Toutes les fiches de paie ont été générées et envoyées avec succès',
            color: 'green',
            icon: <IconCheck />,
            autoClose: 8000,
          });
        }, 600);
      }
    }, 400);
  };

  const handleUpload = async () => {
    if (!file || !selectedEmploye || !selectedMonth) {
      notifications.show({
        title: 'Information manquante',
        message: 'Merci de sélectionner un employé, un mois et un fichier PDF.',
        color: 'red',
        icon: <IconX />,
      });
      return;
    }

    try {
      setUploading(true);

      const formData = new FormData();
      formData.append('employe', selectedEmploye);
      formData.append('mois', dayjs(selectedMonth).format('YYYY-MM'));
      formData.append('fichier_pdf', file);

      await axios.post(`${import.meta.env.VITE_API_BASE_URL}/api/v1/fiche-paie/create/`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      notifications.show({
        title: 'Fiche importée',
        message: 'La fiche de paie a été enregistrée dans le dossier media.',
        color: 'green',
        icon: <IconCheck />,
      });

      setFile(null);
      setSelectedEmploye(null);
      setSelectedMonth(null);
    } catch (error) {
      console.error(error);
      notifications.show({
        title: "Erreur lors de l'import",
        message: "Impossible d'enregistrer le fichier. Vérifiez le serveur backend.",
        color: 'red',
        icon: <IconX />,
      });
    } finally {
      setUploading(false);
    }
  };

  return (
    <>
      <Group position="apart" mb={50}>
        <div>
          <Title order={1} weight={700}>Fiches de paie</Title>
          <Text size="lg" color="dimmed" mt={8}>
            Génération et envoi automatique par email
          </Text>
        </div>
        <Button size="lg" color="green" onClick={sendAll}>
          Envoyer toutes les fiches du mois
        </Button>
      </Group>

      <Group grow mb={40}>
        <Card withBorder radius="lg" p="lg" shadow="md">
          <Text size="sm" color="dimmed">Total</Text>
          <Title order={2}>{stats.total}</Title>
        </Card>
        <Card withBorder radius="lg" p="lg" shadow="md">
          <Text size="sm" color="dimmed">Envoyées</Text>
          <Title order={2} color="green">{stats.envoyees}</Title>
        </Card>
        <Card withBorder radius="lg" p="lg" shadow="md">
          <Text size="sm" color="dimmed">En attente</Text>
          <Title order={2} color="orange">{stats.attente}</Title>
        </Card>
        <Card withBorder radius="lg" p="lg" shadow="md">
          <Text size="sm" color="dimmed">Échecs</Text>
          <Title order={2} color="red">{stats.echecs}</Title>
        </Card>
      </Group>

      <Card withBorder radius="lg" p="lg" mb={40}>
        <Group position="apart">
          <TextInput
            label="Employés"
            placeholder="Rechercher un employé..."
            icon={<IconSearch />}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          {/* <Select
            icon={<IconCalendar />}
            value="2025-12"
            data={[{ value: '2025-12', label: 'Décembre 2025' }]}
          /> */}

          <MonthPickerInput
            label="Mois"
            icon={<IconCalendar />}
            placeholder="Sélectionner le mois"
          />
        </Group>
      </Card>

      {/* <Card
        withBorder
        radius="lg"
        p="lg"
        mb={40}
        className="border-dashed border-gray-300 bg-gray-50"
      >
        <Title order={4} className="mb-4 font-semibold text-gray-800">
          Importer une fiche de paie (PDF)
        </Title>

        <div className="flex flex-col gap-4 md:flex-row">
          <Select
            label="Employé"
            placeholder="Sélectionner un employé"
            value={selectedEmploye}
            onChange={setSelectedEmploye}
            data={employees.map((e) => ({
              value: String(e.id),
              label: `${e.prenom} ${e.nom} (${e.matricule})`,
            }))}
            className="flex-1"
          />

          <MonthPickerInput
            label="Mois de la fiche"
            placeholder="Sélectionner le mois"
            icon={<IconCalendar />}
            value={selectedMonth}
            onChange={setSelectedMonth}
            className="flex-1"
          />
        </div>

        <div className="mt-4 flex flex-col gap-4 md:flex-row md:items-end">
          <FileInput
            label="Fichier PDF"
            placeholder="Choisir un fichier"
            icon={<IconUpload size={16} />}
            accept="application/pdf"
            value={file}
            onChange={setFile}
            className="flex-1"
          />

          <Button
            color="green"
            onClick={handleUpload}
            loading={uploading}
            className="w-full md:w-auto"
          >
            Importer la fiche
          </Button>
        </div>
      </Card> */}

      <Card withBorder radius="lg" shadow="lg">
        <Table highlightOnHover verticalSpacing="md">
          <thead>
            <tr>
              <th>Employé</th>
              <th>Matricule</th>
              <th>Statut</th>
              <th>Dernier envoi</th>
              <th style={{ textAlign: 'center' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map(e => (
              <tr key={e.id}>
                <td>
                  <Group>
                    <Avatar color="green" radius="xl">{e.prenom[0]}{e.nom[0]}</Avatar>
                    <div>
                      <Text weight={600}>{e.prenom} {e.nom}</Text>
                      <Text size="sm" color="dimmed">{e.email}</Text>
                    </div>
                  </Group>
                </td>
                <td>{e.matricule}</td>
                <td>{badge(e.statut)}</td>
                <td>{e.lastSent === '-' ? '—' : e.lastSent}</td>
                <td>
                  <Group position="center">
                    <Tooltip label="Téléchargement PDF">
                      <ActionIcon color="blue" variant="filled" onClick={() => downloadPDF(e.prenom, e.nom, e.matricule)}>
                        <IconDownload size={20} />
                      </ActionIcon>
                    </Tooltip>
                    <Tooltip label="Renvoyer par email">
                      <ActionIcon color="green" variant="filled" onClick={() => resendEmail(e.prenom, e.nom, e.email)}>
                        <IconMail size={20} />
                      </ActionIcon>
                    </Tooltip>
                  </Group>
                </td>
              </tr>
            ))}
          </tbody>
        </Table>
      </Card>

      <Modal opened={opened} onClose={() => setOpened(false)} title="Envoi massif en cours" centered>
        <Progress value={progress} size="lg" radius="md" color="green" striped animated />
        <Text align="center" mt="md" size="lg" weight={600}>
          {progress < 100 ? `${progress}%` : 'Terminé !'}
        </Text>
      </Modal>
    </>
  );
}

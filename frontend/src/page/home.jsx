import { Card, Text, Group, SimpleGrid, Title, Container, ActionIcon, Box, Select, useMantineColorScheme } from "@mantine/core";
import { IconUserPlus, IconFileImport, IconMoonStars, IconSun } from "@tabler/icons-react";
import { useEffect, useState } from "react";
import LineChart from "../components/chart/line-chart";
import DoughnutChart from "../components/chart/doughnut-chart";

export default function Home() {
  const [totalFiles, setTotalFiles] = useState(0);
  const [language, setLanguage] = useState(localStorage.getItem("language") || "fr");
  const { colorScheme, toggleColorScheme } = useMantineColorScheme();
  const dark = colorScheme === 'dark';

  useEffect(() => {
    const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:8003";
    fetch(`${API_BASE_URL}/api/v1/transaction-stats/`)
      .then((res) => res.json())
      .then((result) => {
        setTotalFiles(result.total || 0);
      })
      .catch((err) => console.error("Erreur fetch:", err));
  }, []);

  useEffect(() => {
    const syncLanguage = () => {
      setLanguage(localStorage.getItem("language") || "fr");
    };

    window.addEventListener("languageChanged", syncLanguage);
    window.addEventListener("storage", syncLanguage);

    return () => {
      window.removeEventListener("languageChanged", syncLanguage);
      window.removeEventListener("storage", syncLanguage);
    };
  }, []);

  const translations = {
    fr: {
      dashboard: "Dashboard",
      employees: "Employés enregistrés",
      files: "Fiches importées",
      monthly: "Transaction mensuel",
      status: "Statut des envois (%)",
      sent: "Envoyé",
      pending: "En attente",
      failed: "Échec",
    },
    en: {
      dashboard: "Dashboard",
      employees: "Registered employees",
      files: "Imported files",
      monthly: "Monthly transactions",
      status: "Delivery status (%)",
      sent: "Sent",
      pending: "Pending",
      failed: "Failed",
    },
    mg: {
      dashboard: "Tabilao fanaraha-maso",
      employees: "Mpiasa voasoratra",
      files: "Rakitra nampidirina",
      monthly: "Fifanakalozana isam-bolana",
      status: "Toetry ny fandefasana (%)",
      sent: "Vita",
      pending: "Miandry",
      failed: "Tsy nety",
    },
  };

  const t = translations[language] || translations.fr;

  const bgColor = dark ? "dark.8" : "gray.0";
  const cardBg = dark ? "dark.6" : "white";
  const textColor = dark ? "gray.0" : "dark.8";
  const mutedColor = dark ? "gray.4" : "dimmed";
  const borderColor = dark ? "dark.4" : "gray.3";

  return (
    <Container size="xl" py="md" bg={bgColor} style={{ minHeight: "100vh", borderRadius: 16 }}>
      {/* Header */}
      <Group justify="space-between" align="center" mb={40}>
        <Title order={2} fw={700} c={textColor}>
          {t.dashboard}
        </Title>

        <Group gap="md">
          <Select
            value={language}
            onChange={(value) => {
              const newLanguage = value || "fr";
              setLanguage(newLanguage);
              localStorage.setItem("language", newLanguage);
              window.dispatchEvent(new Event("languageChanged"));
            }}
            data={[
              { value: "fr", label: "Français" },
              { value: "en", label: "English" },
              { value: "mg", label: "Malagasy" },
            ]}
            w={160}
            radius="lg"
          />

          <ActionIcon
            size={44}
            radius="xl"
            variant="gradient"
            gradient={dark ? { from: "yellow", to: "orange" } : { from: "indigo", to: "cyan" }}
            onClick={() => toggleColorScheme()}
          >
            {dark ? <IconSun size={22} /> : <IconMoonStars size={22} />}
          </ActionIcon>
        </Group>
      </Group>

      {/* CARTES */}
      <SimpleGrid cols={{ base: 1, sm: 2, lg: 2 }} spacing="lg" mb={50}>
        <Card shadow="sm" padding="lg" radius="lg" withBorder bg={cardBg} style={{ borderColor }}>
          <div className="flex justify-around items-center gap-4">
            <ActionIcon size={56} radius="xl" color="#7950f2" variant="light">
              <IconUserPlus size={28} />
            </ActionIcon>
            <Box>
              <Text size="md" c={mutedColor} tt="uppercase" fw={500}>
                {t.employees}
              </Text>
              <Text size="xl" fw={700} c={textColor} mt={4} ta="center">
                2
              </Text>
            </Box>
          </div>
        </Card>

        <Card shadow="sm" padding="lg" radius="lg" withBorder bg={cardBg} style={{ borderColor }}>
          <div className="flex justify-around items-center gap-4">
            <ActionIcon size={56} radius="xl" color="#9775fa" variant="light">
              <IconFileImport size={28} />
            </ActionIcon>
            <Box>
              <Text size="md" c={mutedColor} tt="uppercase" fw={500}>
                {t.files}
              </Text>
              <Text size="xl" fw={700} c={textColor} mt={4} ta="center">
                {totalFiles}
              </Text>
            </Box>
          </div>
        </Card>
      </SimpleGrid>

      {/* GRAPHIQUES */}
      <SimpleGrid cols={{ base: 1, lg: 2 }} spacing="lg">
        <Card shadow="sm" padding="xl" radius="lg" withBorder bg={cardBg} style={{ borderColor }}>
          <p className="text-xl font-semibold mb-6" style={{ color: textColor }}>
            {t.monthly}
          </p>

          <div style={{ display: "flex", justifyContent: "center" }}>
            <div style={{ width: 400, height: 300 }}>
              <LineChart />
            </div>
          </div>
        </Card>

        <Card shadow="sm" padding="xl" radius="lg" withBorder bg={cardBg} ta="center" style={{ borderColor }}>
          <Text size="lg" fw={600} mb="xl" c={textColor}>
            {t.status}
          </Text>

          <div style={{ display: "flex", justifyContent: "center" }}>
            <div style={{ width: 400, height: 300 }}>
              <DoughnutChart />
            </div>
          </div>

          <Group justify="center" mt={30} gap="xl">
            <Group gap="xs">
              <Box w={12} h={12} bg="#51cf66" style={{ borderRadius: 6 }} />
              <Text size="sm" c={mutedColor}>{t.sent}</Text>
            </Group>
            <Group gap="xs">
              <Box w={12} h={12} bg="#ffc107" style={{ borderRadius: 6 }} />
              <Text size="sm" c={mutedColor}>{t.pending}</Text>
            </Group>
            <Group gap="xs">
              <Box w={12} h={12} bg="#ff6b6b" style={{ borderRadius: 6 }} />
              <Text size="sm" c={mutedColor}>{t.failed}</Text>
            </Group>
          </Group>
        </Card>
      </SimpleGrid>
    </Container>
  );
}
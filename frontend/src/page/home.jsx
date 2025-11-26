import { Card, Text, Group, SimpleGrid, Title, Container, Input, ActionIcon, Box } from "@mantine/core";
import { IconUserPlus, IconFileImport, IconCheck, IconX, IconSearch } from "@tabler/icons-react";
import LineChart from "../components/chart/line-chart";
import { RingProgress } from "@mantine/core";
import { data } from "./data";
import DoughnutChart from "../components/chart/doughnut-chart";

export default function Home() {
  return (
    <Container size="xl" py="md">
      {/* Titre + Recherche */}
      <Group justify="space-between" align="center" mb={40}>
        <Title order={2} fw={700} c="#1a1b1e">
          Dashboard
        </Title>
        <Input
          placeholder="Recherche..."
          leftSection={<IconSearch size={18} />}
          style={{ width: 320 }}
          radius="lg"
          size="md"
          styles={{
            input: {
              border: "1px solid #e9ecef",
              '&:focus': { borderColor: "#7950f2" }
            }
          }}
        />
      </Group>

      {/* 4 CARTES  */}
      <SimpleGrid cols={{ base: 1, sm: 2, lg: 4 }} spacing="lg" mb={50}>
        {/* Employés enregistrés */}
        <Card shadow="sm" padding="lg" radius="lg" withBorder bg="white">
          <div className="flex justify-around items-center gap-4">
            <ActionIcon size={56} radius="xl" color="#7950f2" variant="light">
              <IconUserPlus size={28} />
            </ActionIcon>
            <Box>
              <Text size="md" c="dimmed" tt="uppercase" fw={500}>
                Employés enregistrés
              </Text>
              <Text size="xl" fw={700} c="#1a1b1e" mt={4} align="right">
                2
              </Text>
            </Box>
          </div>
        </Card>

        {/* Fiches importées */}
        <Card shadow="sm" padding="lg" radius="lg" withBorder bg="white">
          <div className="flex justify-around items-center gap-4" >

            <ActionIcon size={56} radius="xl" color="#9775fa" variant="light">
              <IconFileImport size={28} />
            </ActionIcon>
            <Box>
              <Text size="md" c="dimmed" tt="uppercase" fw={500}>
                Fiches importées
              </Text>
              <Text size="xl" fw={700} c="#1a1b1e" mt={4} align="right">
                2
              </Text>
            </Box>
          </div>
        </Card>

        {/* Envois réussis */}
        <Card shadow="sm" padding="lg" radius="lg" withBorder bg="white">
          <div className="flex justify-around items-center gap-4" >
            <ActionIcon size={56} radius="xl" color="#51cf66" variant="light">
              <IconCheck size={28} />
            </ActionIcon>
            <Box>
              <Text size="md" c="dimmed" tt="uppercase" fw={500}>
                Envois réussis
              </Text>
              <Text size="xl" fw={700} c="#1a1b1e" mt={4} align="right">
                1
              </Text>
            </Box>
          </div>

        </Card>

        {/* Envois échoués */}
        <Card shadow="sm" padding="lg" radius="lg" withBorder bg="white">
          <div className="flex justify-around items-center gap-4" >
            <ActionIcon size={56} radius="xl" color="#ff6b6b" variant="light">
              <IconX size={28} />
            </ActionIcon>
            <Box>
              <Text size="md" c="dimmed" tt="uppercase" fw={500}>
                Envois échoués
              </Text>
              <Text size="xl" fw={700} c="#1a1b1e" mt={4} align="right">
                129898
              </Text>
            </Box>
          </div>
        </Card>
      </SimpleGrid>

      {/* GRAPHIQUES */}
      <SimpleGrid cols={{ base: 1, lg: 2 }} spacing="lg" justify="center">

        {/* Graphique en ligne */}
        <Card shadow="sm" padding="xl" radius="lg" withBorder bg="white" h="auto">
          <p className="text-xl font-semibold mb-6" style={{ color: "#1a1b1e" }}>
            Transactions par jour
          </p>

          <div style={{ width: "100%", display: "flex", justifyContent: "center" }}>
            <div style={{ width: 400, height: 300 }}>
              <LineChart />
            </div>
          </div>
        </Card>

        {/* Donut */}
        <Card shadow="sm" padding="xl" radius="lg" withBorder bg="white" ta="center">
          <Text size="lg" fw={600} mb="xl">
            Statut des envois (%)
          </Text>

          <div style={{ width: "100%", display: "flex", justifyContent: "center" }}>
            <div style={{ width: 400, height: 300 }}>
              <DoughnutChart />
            </div>
          </div>

          {/* Légendes */}
          <Group justify="center" mt={30} gap="xl">
            <Group gap="xs">
              <Box w={12} h={12} bg="#51cf66" style={{ borderRadius: 6 }} />
              <Text size="sm" c="dimmed">Envoyé</Text>
            </Group>
            <Group gap="xs">
              <Box w={12} h={12} bg="#339af0" style={{ borderRadius: 6 }} />
              <Text size="sm" c="dimmed">En attente</Text>
            </Group>
            <Group gap="xs">
              <Box w={12} h={12} bg="#ff6b6b" style={{ borderRadius: 6 }} />
              <Text size="sm" c="dimmed">Échec</Text>
            </Group>
          </Group>
        </Card>

      </SimpleGrid>

    </Container>
  );
}
// src/page/Home.jsx
import { Card, Text, Group, SimpleGrid, Title, Grid, Container } from "@mantine/core";
import { IconUserPlus, IconFileImport, IconCheck, IconX } from "@tabler/icons-react";
import { LineChart } from "@mantine/charts";
import { RingProgress } from "@mantine/core";

export default function Home() {
  return (
    <Container size="xl" py="md">
      <Title order={2} mb="xl" color="#1a1b1e">Dashboard</Title>

      {/* 4 CARTES COMME PHOTO 2 */}
      <SimpleGrid cols={{ base: 1, sm: 2, lg: 4 }} spacing="lg" mb="xl">
        <Card shadow="md" padding="lg" radius="lg" withBorder bg="white">
          <Group justify="space-between">
            <div>
              <Text size="sm" color="dimmed">Employés enregistrés</Text>
              <Text size="xl" weight={700}>2</Text>
            </div>
            <IconUserPlus size={36} color="#7950f2" />
          </Group>
        </Card>

        <Card shadow="md" padding="lg" radius="lg" withBorder bg="white">
          <Group justify="space-between">
            <div>
              <Text size="sm" color="dimmed">Fiches importées</Text>
              <Text size="xl" weight={700}>2</Text>
            </div>
            <IconFileImport size={36} color="#7950f2" />
          </Group>
        </Card>

        <Card shadow="md" padding="lg" radius="lg" withBorder bg="white">
          <Group justify="space-between">
            <div>
              <Text size="sm" color="dimmed">Envois réussis</Text>
              <Text size="xl" weight={700} color="green">1</Text>
            </div>
            <IconCheck size={36} color="green" />
          </Group>
        </Card>

        <Card shadow="md" padding="lg" radius="lg" withBorder bg="white">
          <Group justify="space-between">
            <div>
              <Text size="sm" color="dimmed">Envois échoués</Text>
              <Text size="xl" weight={700} color="red">1</Text>
            </div>
            <IconX size={36} color="red" />
          </Group>
        </Card>
      </SimpleGrid>

      <Grid>
        <Grid.Col span={{ base: 12, md: 8 }}>
          <Card shadow="md" padding="lg" radius="lg" withBorder bg="white">
            <Text weight={600} mb="md">Transaction par jour</Text>
            <LineChart
              h={320}
              data={[
                { name: "Lun", value: 60 },
                { name: "Mar", value: 80 },
                { name: "Mer", value: 100 },
                { name: "Jeu", value: 90 },
                { name: "Ven", value: 140 },
                { name: "Sam", value: 180 },
                { name: "Dim", value: 200 },
              ]}
              dataKey="name"
              series={[{ name: "value", color: "#7950f2" }]}
              curveType="monotone"
              withTooltip
            />
          </Card>
        </Grid.Col>

        <Grid.Col span={{ base: 12, md: 4 }}>
          <Card shadow="md" padding="lg" radius="lg" withBorder bg="white">
            <Text weight={600} mb="md">Statut des envois (%)</Text>
            <RingProgress
              size={200}
              thickness={18}
              sections={[
                { value: 65, color: "#40c057" },
                { value: 20, color: "#228be6" },
                { value: 15, color: "#fa5252" },
              ]}
              label={
                <Text size="lg" weight={700} align="center">
                  100%
                </Text>
              }
            />
          </Card>
        </Grid.Col>
      </Grid>
    </Container>
  );
}
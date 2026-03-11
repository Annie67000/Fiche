import {
  Box,
  Text,
  Button,
  Group,
  Paper,
  ThemeIcon,
  Title,
  Collapse,
  ActionIcon,
  SimpleGrid,
} from '@mantine/core';

import { 
  IconRefresh, 
  IconFileTypePdf,
  IconChevronDown,
  IconChevronUp,
  IconClock,
  IconStack,
} from '@tabler/icons-react';

const PayrollHeader = ({ loading, loadFichesFromAPI, stats, statsExpanded, setStatsExpanded }) => {
    return (
        <Box
            p="lg"
            style={{
                background: 'linear-gradient(135deg, #1e293b 0%, #334155 100%)',
                borderBottom: '1px solid #e2e8f0'
            }}
        >
            <Group justify="space-between" align="flex-start">
                <Box>
                    <Title order={2} c="white" fw={600} mb={4}>
                        Vérification des Fiches de Paie
                    </Title>
                    <Text c="gray.4" size="sm">
                        Gérez et téléchargez vos bulletins de paie
                    </Text>
                </Box>
                <Button
                    leftSection={<IconRefresh size={18} />}
                    onClick={loadFichesFromAPI}
                    loading={loading}
                    variant="white"
                    color="dark"
                >
                    Actualiser
                </Button>
            </Group>

            <Collapse in={statsExpanded}>
                <SimpleGrid cols={{ base: 1, sm: 3 }} mt="lg" spacing="md">
                    <Paper p="md" radius="lg" style={{ backgroundColor: 'rgba(255,255,255,0.1)', backdropFilter: 'blur(10px)' }}>
                        <Group gap="md">
                            <ThemeIcon size="lg" radius="xl" variant="filled" color="blue">
                                <IconStack size={20} />
                            </ThemeIcon>
                            <Box>
                                <Text size="xs" c="gray.4" tt="uppercase" fw={500}>Total Dossiers</Text>
                                <Text size="xl" c="white" fw={700}>{stats.totalFolders}</Text>
                            </Box>
                        </Group>
                    </Paper>
                    <Paper p="md" radius="lg" style={{ backgroundColor: 'rgba(255,255,255,0.1)', backdropFilter: 'blur(10px)' }}>
                        <Group gap="md">
                            <ThemeIcon size="lg" radius="xl" variant="filled" color="green">
                                <IconFileTypePdf size={20} />
                            </ThemeIcon>
                            <Box>
                                <Text size="xs" c="gray.4" tt="uppercase" fw={500}>Total Bulletins</Text>
                                <Text size="xl" c="white" fw={700}>{stats.totalFiches}</Text>
                            </Box>
                        </Group>
                    </Paper>
                    <Paper p="md" radius="lg" style={{ backgroundColor: 'rgba(255,255,255,0.1)', backdropFilter: 'blur(10px)' }}>
                        <Group gap="md">
                            <ThemeIcon size="lg" radius="xl" variant="filled" color="violet">
                                <IconClock size={20} />
                            </ThemeIcon>
                            <Box>
                                <Text size="xs" c="gray.4" tt="uppercase" fw={500}>Moyenne/Dossier</Text>
                                <Text size="xl" c="white" fw={700}>{stats.avgPerFolder}</Text>
                            </Box>
                        </Group>
                    </Paper>
                </SimpleGrid>
            </Collapse>

            <ActionIcon
                variant="subtle"
                color="gray"
                onClick={() => setStatsExpanded(!statsExpanded)}
                style={{ marginTop: 8 }}
            >
                {statsExpanded ? <IconChevronUp size={16} /> : <IconChevronDown size={16} />}
            </ActionIcon>
        </Box>
    )
}

export default PayrollHeader

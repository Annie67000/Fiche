import { useState } from 'react';
import { 
  TextInput, 
  PasswordInput, 
  Button, 
  Paper, 
  Title, 
  Text, 
  Group, 
  Checkbox,
  Box,
  ThemeIcon,
  Stack,
  Divider,
  Anchor,
} from '@mantine/core';
import axios from 'axios';
import { useNavigate } from "react-router-dom";
import { 
  IconFileText, 
  IconShieldCheck, 
  IconClock, 
  IconUsers,
  IconLock,
} from '@tabler/icons-react';

function LoginPage() {
  const [formData, setFormData] = useState({ username: '', password: '' });
  const [errors, setErrors] = useState({ username: '', password: '' });
  const [isLoading, setIsLoading] = useState(false);

  const navigate = useNavigate();

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const validateForm = () => {
    let valid = true;
    const newErrors = { username: '', password: '' };

    if (!formData.username.trim()) {
      newErrors.username = 'Nom d\'utilisateur requis';
      valid = false;
    }

    setErrors(newErrors);
    return valid;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (validateForm()) {
      setIsLoading(true);
      try {
        const response = await axios.post(`${import.meta.env.VITE_API_BASE_URL}/api/v1/login/`, {
          username: formData.username,
          password: formData.password,
        });

        const data = response.data;
        const { access, refresh } = data;

        localStorage.setItem('access_token', access);
        localStorage.setItem('refresh_token', refresh);
        if (data.matricule) {
          localStorage.setItem('matricule', data.matricule);
        }
        
        if (data.employe) {
          localStorage.setItem('employe', JSON.stringify(data.employe));
        }

        navigate('/');
      } catch (err) {
        if (err.response && err.response.status === 401) {
          setErrors({ password: err.response.data.error || 'Identifiants invalides' });
        } else {
          setErrors({ password: 'Erreur de connexion au serveur' });
        }
      } finally {
        setIsLoading(false);
      }
    }
  };

  const features = [
    { icon: IconFileText, title: 'Gestion des Fiches', desc: 'Organisez et gérez facilement les bulletins de paie' },
    { icon: IconShieldCheck, title: 'Sécurisé', desc: 'Stockage chiffré et protégé de vos documents' },
    { icon: IconClock, title: 'Accès Rapide', desc: 'Récupérez vos bulletins en un clic' },
  ];

  return (
    <Box style={{ minHeight: '100vh', display: 'flex' }}>
      {/* Left Side - Banner */}
      <Box 
        style={{ 
          flex: 1, 
          background: 'linear-gradient(135deg, #166534 0%, #15803d 50%, #16a34a 100%)',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'center',
          padding: '40px',
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        {/* Decorative circles */}
        <Box style={{ position: 'absolute', top: -100, right: -100, width: 300, height: 300, borderRadius: '50%', background: 'rgba(255,255,255,0.1)' }} />
        <Box style={{ position: 'absolute', bottom: -50, left: -50, width: 200, height: 200, borderRadius: '50%', background: 'rgba(255,255,255,0.05)' }} />
        
        <ThemeIcon size={80} radius="xl" variant="white" color="green" mb="xl">
          <IconFileText size={40} />
        </ThemeIcon>
        
        <Title order={1} c="white" size={42} fw={700} ta="center" mb="md">
          Fiche de Paie
        </Title>
        <Text c="white" size="lg" ta="center" mb="xl" opacity={0.9}>
          Gestion simplifiée des bulletins de paie
        </Text>

        <Stack gap="lg" mt="xl" style={{ maxWidth: 320 }}>
          {features.map((feature, index) => (
            <Group key={index} gap="md" wrap="nowrap">
              <ThemeIcon size={40} radius="xl" variant="white" color="green" style={{ flexShrink: 0 }}>
                <feature.icon size={20} />
              </ThemeIcon>
              <Box>
                <Text c="white" fw={600} size="sm">{feature.title}</Text>
                <Text c="white" size="xs" opacity={0.8}>{feature.desc}</Text>
              </Box>
            </Group>
          ))}
        </Stack>
      </Box>

      {/* Right Side - Login Form */}
      <Box 
        style={{ 
          flex: 1, 
          display: 'flex', 
          justifyContent: 'center', 
          alignItems: 'center',
          backgroundColor: '#f8fafc',
          padding: '40px',
        }}
      >
        <Paper 
          withBorder 
          shadow="xl" 
          radius="lg" 
          p="xl" 
          style={{ width: '100%', maxWidth: 420 }}
        >
          <Stack align="center" mb="xl">
            <ThemeIcon size={56} radius="xl" variant="light" color="green">
              <IconLock size={28} />
            </ThemeIcon>
            <Title order={2} c="#1e293b" fw={600}>Connexion</Title>
            <Text c="dimmed" size="sm" ta="center">
              Entrez vos identifiants pour accéder à votre espace
            </Text>
          </Stack>

          <form onSubmit={handleSubmit}>
            <Stack gap="md">
              <TextInput
                label="Nom d'utilisateur"
                placeholder="Votre nom d'utilisateur"
                name="username"
                value={formData.username}
                onChange={handleChange}
                error={errors.username}
                required
                size="md"
              />
              <PasswordInput
                label="Mot de passe"
                placeholder="Votre mot de passe"
                name="password"
                value={formData.password}
                onChange={handleChange}
                error={errors.password}
                required
                size="md"
              />
              
              <Group position="apart">
                <Checkbox label="Se souvenir de moi" size="sm" />
                <Anchor href="#" size="sm" c="green">Mot de passe oublié ?</Anchor>
              </Group>
              
              <Button
                fullWidth
                type="submit"
                loading={isLoading}
                size="md"
                mt="md"
                color="green"
              >
                Se connecter
              </Button>
            </Stack>
          </form>

          <Divider label="OU" labelPosition="center" my="lg" />

          <Text align="center" size="sm" c="dimmed">
            Vous n'avez pas de compte ?{' '}
            <Anchor href="/inscription" weight={600} c="green">Créer un compte</Anchor>
          </Text>
        </Paper>
      </Box>
    </Box>
  );
}

export default LoginPage;

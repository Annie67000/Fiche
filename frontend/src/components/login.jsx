 import { useState } from 'react';
import { TextInput, PasswordInput, Button, Paper, Title, Text, Anchor, Group, Checkbox } from '@mantine/core';

import { useNavigate } from "react-router-dom"

// Composant LoginPage : formulaire de connexion
function LoginPage() {
  // États pour gérer les données du formulaire, les erreurs et le chargement
  const [formData, setFormData] = useState({ username: '', password: '' });
  const [errors, setErrors] = useState({ username: '', password: '' });
  const [isLoading, setIsLoading] = useState(false);


  const navigate = useNavigate();

  // Gestion des changements dans les champs du formulaire
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  // Validation des champs du formulaire
  const validateForm = () => {
    let valid = true;
    const newErrors = { username: '', password: '' };

    if (!formData.username.trim()) {
      newErrors.username = 'Nom d\'utilisateur requis';
      valid = false;
    }

    if (formData.password.length < 6) {
      newErrors.password = 'Le mot de passe doit contenir au moins 6 caractères';
      valid = false;
    }

    setErrors(newErrors);
    return valid;
  };
  // Soumission du formulaire - Vraie connexion au backend Django
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (validateForm()) {
      setIsLoading(true);
      try {
        const response = await fetch('http://127.0.0.1:8000/api/v1/login/', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            username: formData.username,
            password: formData.password,
          }),
        });

        const data = await response.json();

        console.log(data);

        if (response.ok) {
          const { access, refresh } = data

          // Sauvegarde le token et l'utilisateur
          localStorage.setItem('access_token', access);
          localStorage.setItem('refresh_token', refresh);

          // Redirige vers la page d'accueil
          navigate('/')
        } else {
          setErrors({ password: data.error || 'Identifiants invalides' });
        }
      } catch (err) {
        setErrors({ password: 'Erreur de connexion au serveur' });
      } finally {
        setIsLoading(false);
      }
    }
  };

  // Styles pour les éléments du formulaire
  const styles = {
    background: {
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      minHeight: '100vh',
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      padding: '20px',
    },
    paper: {
      width: '100%',
      maxWidth: '400px',
      padding: '40px',
      backgroundColor: 'rgba(255, 255, 255, 0.95)',
      borderRadius: '10px',
      boxShadow: '0 10px 25px rgba(0, 0, 0, 0.1)',
    },
    avatar: {
      width: '90px',
      height: '90px',
      borderRadius: '50%',
      backgroundColor: '#667eea',
      margin: '-50px auto 30px',
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      color: 'white',
      fontSize: '40px',
      boxShadow: '0 5px 15px rgba(0, 0, 0, 0.2)',
    },
    title: {
      marginBottom: '30px',
      color: '#333',
      fontWeight: '600',
      textAlign: 'center',
    },
  };

  return (
    <div style={styles.background}>
      <Paper withBorder shadow="md" radius="md" style={styles.paper}>
        <div style={styles.avatar}>👤</div>
        <Title order={2} style={styles.title}>Connexion</Title>
        <form onSubmit={handleSubmit}>
          <TextInput
            label="Nom d'utilisateur"
            placeholder="Votre nom d'utilisateur"
            name="username"
            value={formData.username}
            onChange={handleChange}
            error={errors.username}
            required
            style={{ marginBottom: '20px' }}
          />
          <PasswordInput
            label="Mot de passe"
            placeholder="Votre mot de passe"
            name="password"
            value={formData.password}
            onChange={handleChange}
            error={errors.password}
            required
            style={{ marginBottom: '20px' }}
          />
          <Group position="apart" style={{ marginBottom: '25px' }}>
            <Checkbox label="Se souvenir de moi" />
            <Anchor href="#" size="sm" style={{ color: '#667eea' }}>Mot de passe oublié ?</Anchor>
          </Group>
          <Button
            fullWidth
            type="submit"
            loading={isLoading}
            style={{
              backgroundColor: '#667eea',
              marginTop: '10px',
              height: '45px',
              fontWeight: '600',
              fontSize: '16px',
            }}
          >
            SE CONNECTER
          </Button>
        </form>
        <Text align="center" mt="md" style={{ marginTop: '25px' }}>
          Vous n'avez pas de compte ?{' '}
          <Anchor href="/inscription" weight={700} style={{ color: '#667eea' }}>S'inscrire</Anchor>
        </Text>
      </Paper>
    </div>
  );
}

export default LoginPage;
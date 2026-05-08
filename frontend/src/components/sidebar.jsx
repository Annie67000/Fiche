import { NavLink, Box, Text, Avatar, Divider, Button, ScrollArea, Group, Badge } from '@mantine/core';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import {
  IconLayoutDashboard,
  IconUsers,
  IconFileText,
  IconHistory,
  IconLogout,
  IconUpload,
  IconSettings,
  IconUser,
  IconBadge
} from '@tabler/icons-react';
import { useEffect, useState } from 'react';
import axios from 'axios';

const menuItems = (isStaff) => [
  ...(isStaff ? [
    { to: "/", label: "Dashboard", icon: IconLayoutDashboard },
    { to: "/pdf-upload", label: "PDF Upload", icon: IconUpload },
    { to: "/verification", label: "Fiche de Paie", icon: IconFileText },
  ] : [
    { to: "/verification", label: "Mes Fiches de Paie", icon: IconFileText },
  ]),
];

export default function Sidebar() {
  const location = useLocation();
  const navigate = useNavigate();
  const [isStaff, setIsStaff] = useState(false);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    const token = localStorage.getItem('access_token');
    if (token) {
      const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:8003";
      axios.get(`${API_BASE_URL}/api/v1/me/`, {
        headers: { Authorization: `Bearer ${token}` }
      })
      .then(res => {
        setIsStaff(res.data.is_staff || false);
      })
      .catch(() => setIsStaff(false))
      .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, []);

  const menu = menuItems(isStaff);
  
  const employeRaw = localStorage.getItem('employe');
  const employe = employeRaw ? JSON.parse(employeRaw) : null;
  
  const username = localStorage.getItem('access_token') ? localStorage.getItem('username') || employe?.prenom : null;
  const displayName = employe ? `${employe.prenom || ''} ${employe.nom || ''}`.trim() : (username || 'Utilisateur');
  const userInitials = displayName.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);

  const handleLogout = () => {
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    localStorage.removeItem('matricule');
    localStorage.removeItem('employe');
    localStorage.removeItem('username');
    navigate('/login');
  };

  if (loading) {
    return (
      <Box w={280} className='bg-green-700' h="100vh" p="md" style={{ position: 'fixed', left: 0, top: 0 }}>
        <Text color="white">Chargement...</Text>
      </Box>
    );
  }

  return (
    <Box w={280} className='bg-green-700' h="100vh" p="md" style={{ position: 'fixed', left: 0, top: 0, borderRight: '1px solid rgba(255,255,255,0.2)' }}>
      <ScrollArea h="100%"  scrollbarSize={8}>
        {/* User Info */}
        <Box className='flex flex-col items-center justify-center' my="xl">
          <Avatar size={80} radius={40} color="white" style={{ background: 'rgba(255,255,255,0.2)' }}>
            <Text size={28} weight={700} color="white">{userInitials || 'U'}</Text>
          </Avatar>
          <Text size="md" color="white" mt="md" fw={600} ta="center">{displayName}</Text>
          {employe && (
            <Group gap="xs" mt="xs">
              <Badge leftSection={<IconBadge size={12} />} variant="light" color="white" c="green">
                Matricule : {employe.matricule}
              </Badge>
            </Group>
          )}
          {employe && (
            <Group gap={4} mt="xs">
              <Text size="xs" c="white" opacity={0.8}>{employe.poste || ''}</Text>
              {employe.departement && (
                <>
                  <Text size="xs" c="white" opacity={0.6}>•</Text>
                  <Text size="xs" c="white" opacity={0.8}>{employe.departement}</Text>
                </>
              )}
            </Group>
          )}
        </Box>

        <Divider color="white" opacity={0.2} my="lg" />

        {/* Menu */}
        <Box mx="xs">
          {menu.map((item) => {
            const Icon = item.icon;
            const active = location.pathname === item.to;

            return (
              <Link
                key={item.to}
                to={item.to}
                className={`flex items-center gap-2 px-6 py-4 mb-1 rounded-md text-md ${active ? 'bg-white bg-opacity-20 text-green-700 font-semibold' : 'text-white hover:bg-green-600 hover:bg-opacity-10'}`}
              >
                <Icon size={24} />
                <span className=''>{item.label}</span>
              </Link>

            );
          })}
        </Box>

        {/* Déconnexion */}
        <Box>
          <Divider color="white" opacity={0.2} my="lg" />
          <button
            onClick={handleLogout}
            className={`flex items-center gap-2 px-6 py-4 mb-1 rounded-md text-md text-white hover:bg-red-500 hover:bg-opacity-10 w-full`}
          >
            <IconLogout size={24} />
            <span className=''>Déconnexion</span>
          </button>
        </Box>
      </ScrollArea>
    </Box>
  );
}

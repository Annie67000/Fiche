import { NavLink, Box, Text, Avatar, Divider, Button, ScrollArea } from '@mantine/core';
import { Link, useLocation } from 'react-router-dom';
import {
  IconLayoutDashboard,
  IconUsers,
  IconFileText,
  IconHistory,
  IconLogout
} from '@tabler/icons-react';

const menuItems = [
  { to: "/", label: "Dashboard", icon: IconLayoutDashboard },
  { to: "/employes", label: "Employés", icon: IconUsers },
  { to: "/fiches", label: "Fiches de paie", icon: IconFileText },
  { to: "/historique", label: "Historique", icon: IconHistory },
];

export default function Sidebar() {
  const location = useLocation();

  return (
    <Box w={280} className='bg-green-700' h="100vh" p="md" style={{ position: 'fixed', left: 0, top: 0 }}>
      {/* Logo + Titre */}
      <Box className='flex flex-col items-center justify-center' my="xl">
        <Avatar size={80} radius={40} color="white" title='Fiche de Paie'>
          <Text size={32} weight={700} color="white">FP</Text>
        </Avatar>
        {/* <Text size="lg" color="white" mt="md">Service RH</Text> */}
      </Box>

      <Divider color="white" opacity={0.2} my="lg" />

      {/* Menu */}
      <ScrollArea h={350} mx="-md">
        <Box mx="xs">
          {menuItems.map((item) => {
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
      </ScrollArea>


      {/* Déconnexion */}
      <Box>
        <Divider color="white" opacity={0.2} my="lg" />
        <Link
          to={'/login'}
          className={`flex items-center gap-2 px-6 py-4 mb-1 rounded-md text-md text-white hover:bg-red-500 hover:bg-opacity-10`}
        >
          <IconLogout size={24} />
          <span className=''>Déconnexion</span>
        </Link>
      </Box>
    </Box>
  );
}
import { NavLink, Box, Text, Avatar, Divider, Button } from '@mantine/core';
import { Link, useLocation } from 'react-router-dom';
import { 
  IconLayoutDashboard, 
  IconUsers, 
  IconFileText, 
  IconHistory, 
  IconLogout 
} from '@tabler/icons-react';

const menuItems = [
  { to: "/", label: "Dashboard", icon: IconLayoutDashboard  },
  { to: "/employes", label: "Employés", icon: IconUsers },
  { to: "/fiches", label: "Fiches de paie", icon: IconFileText },
  { to: "/historique", label: "Historique", icon: IconHistory },
];

export default function Sidebar() {
  const location = useLocation();

  return (
    <Box w={280} className='bg-green-700' h="100vh" p="md" style={{ position: 'fixed', left: 0, top: 0 }}>
      {/* Logo + Titre */}
      <Box ta="center" my="xl">
        <Avatar size={80} radius={40} color="white">
          <Text size={32} weight={700} color="white">FP</Text>
        </Avatar>
        <Text size="lg" weight={600} color="white" mt="xs">Service RH</Text>
      </Box>

      <Divider color="white" opacity={0.2} my="lg" />

      {/* Menu */}
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
              <Icon size={24}/>
              <span className=''>{item.label}</span>
            </Link>
          );
        })}
      </Box>

      {/* Déconnexion */}
      <Box pos="absolute" bottom={30} left={20} right={20}>
        <Divider color="white" opacity={0.2} my="lg" />
        <NavLink
          label="Déconnexion"
          leftSection={<IconLogout size={22} stroke={1.8} />}
          color="white"
          onClick={() => {
            localStorage.removeItem("access_token");
            window.location.href = "/login";
          }}
        />
      </Box>
    </Box>
  );
}
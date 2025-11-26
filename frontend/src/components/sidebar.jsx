// // src/components/Sidebar.jsx
// import { useLocation } from "react-router-dom";
// import { IconLayoutDashboard, IconUsers, IconFileDollar, IconHistory, IconLogout } from "@tabler/icons-react";
// import { Box, Text, Avatar, Group, Divider, NavLink } from "@mantine/core";
// import { Link } from "react-router-dom";

// const menu = [
//   { to: "/", label: "Dashboard", icon: IconLayoutDashboard },
//   { to: "/employes", label: "Employés", icon: IconUsers },
//   { to: "/fiches", label: "Fiches de paie", icon: IconFileDollar },
//   { to: "/historique", label: "Historique", icon: IconHistory },
// ];

// export default function Sidebar() {
//   const location = useLocation();

//   return (
//     <Box w={280} h="100vh" bg="#7950f2" p="md" style={{ position: 'fixed', left: 0, top: 0 }}>
//       <Group direction="column" align="center" my="xl">
//         <Avatar size={84} radius={42} bg="white"><Text size="32px" weight={700} color="#7950f2">FP</Text></Avatar>
//         <Text size="lg" weight={600} color="white">Service RH</Text>
//       </Group>

//       <Divider color="white" opacity={0.3} my="lg" />

//       <Box mx="xs">
//         {menu.map(item => {
//           const Icon = item.icon;
//           const active = location.pathname === item.to;
//           return (
//             <NavLink
//               key={item.to}
//               component={Link}
//               to={item.to}
//               label={item.label}
//               icon={<Icon size={22} stroke={1.8} />}
//               active={active}
//               color="white"
//               variant="filled"
//               mb="sm"
//               styles={{
//                 root: {
//                   borderRadius: 12,
//                   fontWeight: 500,
//                   backgroundColor: active ? "rgba(255,255,255,0.25)" : "transparent",
//                   "&:hover": { backgroundColor: "rgba(255,255,255,0.15)" },
//                 },
//                 label: { color: "white" },
//                 icon: { color: "white" },
//               }}
//             />
//           );
//         })}
//       </Box>

//       <Box pos="absolute" bottom={30} left={20} right={20}>
//         <Divider color="white" opacity={0.3} my="lg" />
//         <NavLink
//           label="Déconnexion"
//           icon={<IconLogout size={22} stroke={1.8} />}
//           color="white"
//           onClick={() => {
//             localStorage.removeItem("access_token");
//             window.location.href = "/login";
//           }}
//         />
//       </Box>
//     </Box>
//   );
// }
// src/components/Sidebar.jsx
import { NavLink } from '@mantine/core';
import { IconLayoutDashboard, IconUsers, IconFileDollar, IconHistory, IconLogout } from '@tabler/icons-react';
import { useLocation } from 'react-router-dom';
import { Box, Text, Avatar, Group, Divider } from '@mantine/core';
import { Link } from 'react-router-dom';

const menuItems = [
  { to: "/", label: "Dashboard", icon: IconLayoutDashboard },
  { to: "/employes", label: "Employés", icon: IconUsers },
  { to: "/fiches", label: "Fiches de paie", icon: IconFileDollar },
  { to: "/historique", label: "Historique", icon: IconHistory },
];

export default function Sidebar() {
  const location = useLocation();

  return (
    <Box w={280} h="100vh" bg="#7950f2" p="md" style={{ position: 'fixed', left: 0, top: 0 }}>
      <Group direction="column" align="center" my="xl">
        <Avatar size={80} radius={40} color="white" bg="#7950f2">
          <Text size="32px" weight={700} color="white">FP</Text>
        </Avatar>
        <Text size="lg" weight={600} color="white">Service RH</Text>
      </Group>

      <Divider my="lg" color="white" opacity={0.2} />

      <Box mx="xs">
        {menuItems.map((item) => {
          const Icon = item.icon;
          const active = location.pathname === item.to;

          return (
            <NavLink
              key={item.to}
              component={Link}
              to={item.to}
              label={item.label}
              icon={<Icon size={20} stroke={1.8} color="white" />}
              active={active}
              color="white"
              variant="filled"
              mb="xs"
              styles={{
                root: {
                  borderRadius: 12,
                  backgroundColor: active ? 'rgba(255,255,255,0.2)' : 'transparent',
                  '&:hover': { backgroundColor: 'rgba(255,255,255,0.1)' },
                },
                label: { fontWeight: 500, color: 'white' },
              }}
            />
          );
        })}
      </Box>

      <Box pos="absolute" bottom={30} left={20} right={20}>
        <Divider my="lg" color="white" opacity={0.2} />
        <NavLink
          label="Déconnexion"
          icon={<IconLogout size={20} stroke={1.8} color="white" />}
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
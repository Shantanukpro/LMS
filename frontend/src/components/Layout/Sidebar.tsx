import React from 'react';
import {
  Drawer,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Toolbar,
  Typography,
  Divider,
  Box,
} from '@mui/material';
import {
  Dashboard as DashboardIcon,
  Lan as LabIcon,
  DesktopWindows as PCIcon,
  Memory as EquipmentIcon,
  Apps as SoftwareIcon,
  BuildCircle as MaintenanceIcon,
  Inventory2 as InventoryIcon,
} from '@mui/icons-material';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';

const drawerWidth = 280;

const menuItems = [
  { text: 'Dashboard', icon: <DashboardIcon />, path: '/' },
  { text: 'Labs', icon: <LabIcon />, path: '/labs' },
  { text: 'PCs', icon: <PCIcon />, path: '/pcs' },
  { text: 'Equipment', icon: <EquipmentIcon />, path: '/equipment' },
  { text: 'Software', icon: <SoftwareIcon />, path: '/software' },
  { text: 'Maintenance', icon: <MaintenanceIcon />, path: '/maintenance' },
  { text: 'Inventory', icon: <InventoryIcon />, path: '/inventory' },
];

interface SidebarProps {
  open: boolean;
  onClose: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ open, onClose }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();

  const handleNavigation = (path: string) => {
    navigate(path);
    onClose();
  };

  const drawer = (
    <Box>
      <Toolbar>
        <Box sx={{ textAlign: 'center', width: '100%', py: 1 }}>
          <Typography variant="h6" component="div" sx={{ 
            fontWeight: 'bold',
            background: 'linear-gradient(45deg, #ef4444, #b91c1c)',
            backgroundClip: 'text',
            WebkitBackgroundClip: 'text',
            color: 'transparent',
            fontSize: '1.1rem',
            lineHeight: 1.2,
          }}>
            Yashwantrao Bhonsale
          </Typography>
          <Typography variant="h6" component="div" sx={{ 
            fontWeight: 'bold',
            background: 'linear-gradient(45deg, #ef4444, #b91c1c)',
            backgroundClip: 'text',
            WebkitBackgroundClip: 'text',
            color: 'transparent',
            fontSize: '1.1rem',
            lineHeight: 1.2,
          }}>
            Institute of Technology
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
            Lab Management System
          </Typography>
        </Box>
      </Toolbar>
      <Divider />
      <List>
        {(user?.role === 'student' ? menuItems.filter(mi => mi.text === 'Maintenance') : menuItems).map((item) => (
          <ListItem key={item.text} disablePadding>
            <ListItemButton
              onClick={() => handleNavigation(item.path)}
              selected={location.pathname === item.path}
              sx={(theme) => ({
                position: 'relative',
                borderRadius: 1.5,
                mx: 1,
                my: 0.5,
                py: 1,
                gap: 1,
                alignItems: 'center',
                transition: 'all 180ms ease',
                '& .MuiListItemIcon-root': {
                  minWidth: 40,
                  color: theme.palette.text.secondary,
                },
                '& .MuiListItemText-primary': {
                  fontWeight: 500,
                  letterSpacing: 0.2,
                },
                '&:hover': {
                  backgroundColor: theme.palette.action.hover,
                  transform: 'translateX(2px)',
                },
                '&.Mui-selected': {
                  backgroundColor: theme.palette.action.selected,
                  color: theme.palette.primary.main,
                  '& .MuiListItemIcon-root': { color: theme.palette.primary.main },
                  '&:hover': { backgroundColor: theme.palette.action.selected },
                },
              })}
            >
              <ListItemIcon>{item.icon}</ListItemIcon>
              <ListItemText primary={item.text} primaryTypographyProps={{ noWrap: true }} />
            </ListItemButton>
          </ListItem>
        ))}
      </List>
    </Box>
  );

  return (
    <Drawer
      variant="temporary"
      open={open}
      onClose={onClose}
      transitionDuration={{ enter: 260, exit: 200 }}
      ModalProps={{
        keepMounted: true, // Better open performance on mobile.
      }}
      sx={{
        display: { xs: 'block', sm: 'block' },
        '& .MuiDrawer-paper': {
          boxSizing: 'border-box',
          width: drawerWidth,
          transition: 'transform 260ms ease, opacity 200ms ease',
        },
      }}
    >
      <Box sx={{ opacity: open ? 1 : 0, transition: 'opacity 220ms ease' }}>{drawer}</Box>
    </Drawer>
  );
};

export default Sidebar;

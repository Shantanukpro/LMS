import React from 'react';
import {
  AppBar,
  Toolbar,
  Typography,
  IconButton,
  Menu,
  MenuItem,
  Box,
  Avatar,
  Tooltip,
} from '@mui/material';
import {
  Menu as MenuIcon,
  AccountCircle,
  Logout,
  Settings,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import logoUrl from '../../assets/logo.png';
import { useColorMode } from '../../contexts/ThemeContext';
import { DarkMode, LightMode } from '@mui/icons-material';
import NotificationInbox from '../Notifications/NotificationInbox';

interface HeaderProps {
  onMenuClick: () => void;
}

const Header: React.FC<HeaderProps> = ({ onMenuClick }) => {
  const { user, logout } = useAuth();
  const [anchorEl, setAnchorEl] = React.useState<null | HTMLElement>(null);
  const navigate = useNavigate();
  const { mode, toggleMode } = useColorMode();

  const handleMenu = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const handleLogout = () => {
    logout();
    handleClose();
  };

  const handleSettings = () => {
    handleClose();
    navigate('/settings');
  };

  return (
    <AppBar position="fixed" sx={{ zIndex: (theme) => theme.zIndex.drawer + 1 }}>
      <Toolbar sx={{ gap: 1 }}>
        <IconButton
          color="inherit"
          aria-label="open sidebar menu"
          edge="start"
          onClick={onMenuClick}
          sx={{ mr: 2 }}
        >
          <MenuIcon />
        </IconButton>
        {/* College Logo (imported from src/assets) */}
        <Box component="img" src={logoUrl} alt="College Logo" sx={{
          width: 32,
          height: 32,
          mr: 1,
          display: { xs: 'none', sm: 'inline-flex' },
        }} />
        
        <Box sx={{ display: { xs: 'none', sm: 'block' }, mr: 2 }}>
          <Typography variant="h6" component="div" sx={{ 
            fontWeight: 'bold',
            fontSize: '1.1rem',
          }}>
            Yashwantrao Bhonsale Institute of Technology
          </Typography>
          <Typography variant="body2" sx={{ opacity: 0.9 }}>
            Lab Management System
          </Typography>
        </Box>

        <Box sx={{ display: { xs: 'block', sm: 'none' } }}>
          <Typography variant="h6" component="div" sx={{ 
            fontWeight: 'bold',
            fontSize: '1rem',
          }}>
            YBIT LMS
          </Typography>
        </Box>
        
        <Box sx={{ flexGrow: 1 }} />

        {/* Theme toggle */}
        <Tooltip title={mode === 'light' ? 'Switch to dark mode' : 'Switch to light mode'}>
          <IconButton color="inherit" onClick={toggleMode} sx={{ mr: 1 }}>
            {mode === 'light' ? <DarkMode /> : <LightMode />}
          </IconButton>
        </Tooltip>

        {user && (
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <Typography variant="body2" sx={{ mr: 1, display: { xs: 'none', sm: 'block' } }}>
              {user.username} ({user.role})
            </Typography>
            <IconButton
              size="large"
              aria-label="account of current user"
              aria-controls="menu-appbar"
              aria-haspopup="true"
              onClick={handleMenu}
              color="inherit"
            >
              <Avatar sx={{ width: 32, height: 32 }}>
                <AccountCircle />
              </Avatar>
            </IconButton>
            <Menu
              id="menu-appbar"
              anchorEl={anchorEl}
              anchorOrigin={{
                vertical: 'top',
                horizontal: 'right',
              }}
              keepMounted
              transformOrigin={{
                vertical: 'top',
                horizontal: 'right',
              }}
              open={Boolean(anchorEl)}
              onClose={handleClose}
            >
              <MenuItem onClick={handleSettings}>
                <Settings sx={{ mr: 1 }} />
                Settings
              </MenuItem>
              <MenuItem onClick={handleLogout}>
                <Logout sx={{ mr: 1 }} />
                Logout
              </MenuItem>
            </Menu>
          </Box>
        )}
      </Toolbar>
    </AppBar>
  );
};

export default Header;

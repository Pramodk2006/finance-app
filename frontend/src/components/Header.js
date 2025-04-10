import React from 'react';
import { AppBar, Toolbar, Typography, Button, Box, IconButton, Menu, MenuItem, Avatar } from '@mui/material';
import { styled } from '@mui/material/styles';
import { Link as RouterLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import MenuIcon from '@mui/icons-material/Menu';
import DashboardIcon from '@mui/icons-material/Dashboard';
import ReceiptIcon from '@mui/icons-material/Receipt';
import AccountBalanceWalletIcon from '@mui/icons-material/AccountBalanceWallet';
import ChatIcon from '@mui/icons-material/Chat';
import { useState } from 'react';

const StyledAppBar = styled(AppBar)(({ theme }) => ({
  zIndex: theme.zIndex.drawer + 1,
}));

const LogoTypography = styled(Typography)(({ theme }) => ({
  flexGrow: 1,
  display: 'flex',
  alignItems: 'center',
  fontWeight: 'bold',
}));

const NavButton = styled(Button)(({ theme }) => ({
  margin: theme.spacing(0, 1),
  color: 'white',
}));

const Header = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [anchorEl, setAnchorEl] = useState(null);
  const [mobileMenuAnchorEl, setMobileMenuAnchorEl] = useState(null);

  const handleProfileMenuOpen = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleMobileMenuOpen = (event) => {
    setMobileMenuAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
    setMobileMenuAnchorEl(null);
  };

  const handleLogout = () => {
    logout();
    handleMenuClose();
    navigate('/login');
  };

  const menuId = 'primary-account-menu';
  const renderMenu = (
    <Menu
      anchorEl={anchorEl}
      id={menuId}
      keepMounted
      open={Boolean(anchorEl)}
      onClose={handleMenuClose}
    >
      <MenuItem onClick={handleMenuClose}>Profile</MenuItem>
      <MenuItem onClick={handleLogout}>Logout</MenuItem>
    </Menu>
  );

  const mobileMenuId = 'primary-menu-mobile';
  const renderMobileMenu = (
    <Menu
      anchorEl={mobileMenuAnchorEl}
      id={mobileMenuId}
      keepMounted
      open={Boolean(mobileMenuAnchorEl)}
      onClose={handleMenuClose}
    >
      <MenuItem component={RouterLink} to="/" onClick={handleMenuClose}>
        <DashboardIcon sx={{ mr: 1 }} /> Dashboard
      </MenuItem>
      <MenuItem component={RouterLink} to="/transactions" onClick={handleMenuClose}>
        <ReceiptIcon sx={{ mr: 1 }} /> Transactions
      </MenuItem>
      <MenuItem component={RouterLink} to="/budgets" onClick={handleMenuClose}>
        <AccountBalanceWalletIcon sx={{ mr: 1 }} /> Budget
      </MenuItem>
      <MenuItem component={RouterLink} to="/analytics" onClick={handleMenuClose}>
        <ChatIcon sx={{ mr: 1 }} /> Analytics
      </MenuItem>
      {user ? (
        <MenuItem onClick={handleLogout}>Logout</MenuItem>
      ) : (
        <MenuItem component={RouterLink} to="/login" onClick={handleMenuClose}>Login</MenuItem>
      )}
    </Menu>
  );

  return (
    <>
      <StyledAppBar position="static">
        <Toolbar>
          <LogoTypography variant="h6" component={RouterLink} to="/" sx={{ textDecoration: 'none', color: 'white' }}>
            AI Finance Manager
          </LogoTypography>

          {/* Mobile menu icon */}
          <Box sx={{ display: { xs: 'flex', md: 'none' } }}>
            <IconButton
              size="large"
              edge="end"
              color="inherit"
              aria-label="menu"
              aria-controls={mobileMenuId}
              aria-haspopup="true"
              onClick={handleMobileMenuOpen}
            >
              <MenuIcon />
            </IconButton>
          </Box>

          {/* Desktop navigation */}
          <Box sx={{ display: { xs: 'none', md: 'flex' } }}>
            {user && (
              <>
                <NavButton component={RouterLink} to="/" startIcon={<DashboardIcon />}>
                  Dashboard
                </NavButton>
                <NavButton component={RouterLink} to="/transactions" startIcon={<ReceiptIcon />}>
                  Transactions
                </NavButton>
                <NavButton component={RouterLink} to="/budgets" startIcon={<AccountBalanceWalletIcon />}>
                  Budget
                </NavButton>
                <NavButton component={RouterLink} to="/analytics" startIcon={<ChatIcon />}>
                  Analytics
                </NavButton>
              </>
            )}
          </Box>

          {user ? (
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              <IconButton
                edge="end"
                aria-label="account of current user"
                aria-controls={menuId}
                aria-haspopup="true"
                onClick={handleProfileMenuOpen}
                color="inherit"
              >
                <Avatar sx={{ width: 32, height: 32, bgcolor: 'secondary.main' }}>
                  {user.name ? user.name.charAt(0).toUpperCase() : 'U'}
                </Avatar>
              </IconButton>
            </Box>
          ) : (
            <Box sx={{ display: { xs: 'none', md: 'block' } }}>
              <Button color="inherit" component={RouterLink} to="/login">
                Login
              </Button>
              <Button color="inherit" component={RouterLink} to="/register">
                Register
              </Button>
            </Box>
          )}
        </Toolbar>
      </StyledAppBar>
      {renderMobileMenu}
      {renderMenu}
    </>
  );
};

export default Header;

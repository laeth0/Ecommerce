import { useState,FunctionComponent } from 'react';
import { Container, ListItemText, Drawer, List, Menu, AppBar, Box, Toolbar, IconButton, Typography, Badge, MenuItem, Avatar, ListItem, ListItemButton, ListItemIcon } from '@mui/material';
import MenuIcon from '@mui/icons-material/Menu';
import MoreIcon from '@mui/icons-material/MoreVert';
import FavoriteBorderIcon from '@mui/icons-material/FavoriteBorder';
import ShoppingCartIcon from '@mui/icons-material/ShoppingCart';
import CategoryIcon from '@mui/icons-material/Category';
import ContactsIcon from '@mui/icons-material/Contacts';
import AdUnitsIcon from '@mui/icons-material/AdUnits';
import SearchIcon from '@mui/icons-material/Search';
import CloseIcon from '@mui/icons-material/Close';
import { useNavigate } from 'react-router-dom';


export default function Navbar() {
    const navigate = useNavigate()
    const [BigAnchor, setBigAnchor] = useState<boolean>()
    const [mobileMoreAnchorEl, setMobileMoreAnchorEl] = useState<null | HTMLElement>(null);

    const isMobileMenuOpen = Boolean(mobileMoreAnchorEl);

    const renderMobileMenu: FunctionComponent =()=> (
        <Menu anchorEl={mobileMoreAnchorEl} open={isMobileMenuOpen} onClose={() => setMobileMoreAnchorEl(null)} id='primary-search-account-menu-mobile' keepMounted anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }} transformOrigin={{ vertical: 'top', horizontal: 'right' }}  >

            <MenuItem>
                <IconButton size="large" edge="start" aria-controls='primary-search-account-menu' aria-haspopup="true" color="inherit">
                    <Avatar alt="Remy Sharp" src="https://mui.com/static/images/avatar/3.jpg" />
                </IconButton>
                <p>Profile</p>
            </MenuItem>

            <MenuItem>
                <IconButton size="large" color="inherit" >
                    <Badge badgeContent={17} color="primary">
                        <ShoppingCartIcon />
                    </Badge>
                </IconButton>
                <p>My cart</p>
            </MenuItem>

            <MenuItem>
                <IconButton size="large" color="inherit">
                    <Badge badgeContent={4} color="primary">
                        <FavoriteBorderIcon />
                    </Badge>
                </IconButton>
                <p>Favorite</p>
            </MenuItem>

        </Menu>
    );

    const toggleDrawer = (open: boolean) =>
        (event: React.KeyboardEvent | React.MouseEvent) => {
            if (event.type === 'keydown' && ((event as React.KeyboardEvent).key === 'Tab' || (event as React.KeyboardEvent).key === 'Shift'))
                return;
            setBigAnchor(open);
        };


    return (
        <AppBar position='static' sx={{ background: "#F0F3F8", color: "#000", height: "9vh" }} >
            <div className='container'>
                <Toolbar className='p-0'>

                    <IconButton size="large" edge="start" color="inherit" aria-label="open drawer" onClick={toggleDrawer(true)} >
                        <MenuIcon />
                    </IconButton>

                    <Drawer anchor="left" open={BigAnchor} onClose={toggleDrawer(false)} >
                        <IconButton onClick={toggleDrawer(false)} sx={{ borderRadius: 0 }}>
                            <CloseIcon />
                        </IconButton>
                        <List sx={{ width: 250, paddingY: 0 }} role="presentation" onClick={toggleDrawer(false)} onKeyDown={toggleDrawer(false)}>
                            {[{ 'Gategories': <CategoryIcon /> }, { 'products': <AdUnitsIcon /> }, { 'Search Product': <SearchIcon /> }, { 'Contact Us': <ContactsIcon /> }].map((ele) => (
                                <ListItem key={Object.keys(ele)[0]} disablePadding>
                                    <ListItemButton>
                                        <ListItemIcon>
                                            {Object.values(ele)[0]}
                                        </ListItemIcon>
                                        <ListItemText primary={Object.keys(ele)[0]} />
                                    </ListItemButton>
                                </ListItem>
                            ))}
                        </List>
                    </Drawer>

                    <Typography variant="h6" noWrap component="div" sx={{ display: { xs: 'none', sm: 'block' }, fontWeight: 800, cursor: "pointer" }} onClick={() => navigate('/')} >VOXO</Typography>

                    <Box sx={{ flexGrow: 1 }} />{/* this is a space between left component and right component */}

                    <Box sx={{ display: { xs: 'none', md: 'flex' } }}>

                        <IconButton size="large" color="inherit">
                            <Badge badgeContent={4} color="primary">
                                <FavoriteBorderIcon />
                            </Badge>
                        </IconButton>

                        <IconButton size="large" color="inherit" onClick={() => navigate('/Cart')} >
                            <Badge badgeContent={17} color="primary" >
                                <ShoppingCartIcon />
                            </Badge>
                        </IconButton>

                        <IconButton size="large" edge="end" aria-controls='primary-search-account-menu' aria-haspopup="true" color="inherit" >
                            <Avatar alt="Remy Sharp" src="https://mui.com/static/images/avatar/3.jpg" />
                        </IconButton>
                    </Box>

                    <Box sx={{ display: { xs: 'flex', md: 'none' } }}>
                        <IconButton size="large" aria-controls='primary-search-account-menu-mobile' aria-haspopup="true" onClick={(event: React.MouseEvent<HTMLElement>) => setMobileMoreAnchorEl(event.currentTarget)} color="inherit" >
                            <MoreIcon />
                        </IconButton>
                    </Box>

                </Toolbar>
            </div>

            {renderMobileMenu}
        </AppBar>
    );
}

import { AppBar, Toolbar, Typography, Button } from '@mui/material';
import { Link } from 'react-router-dom';
import { jwtDecode } from 'jwt-decode';

const Header = () => {
    const token = localStorage.getItem('jwt');
    let isAdmin = false;

    if (token) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const decodedToken: any = jwtDecode(token);
        isAdmin = decodedToken.isAdmin;
    }

    return (
        <AppBar position="static">
            <Toolbar>
                <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
                    Boards
                </Typography>
                {token ? (
                    <>
                        <Button color="inherit" onClick={() => localStorage.removeItem('email')} component={Link} to="/boards">Boards</Button>
                        {isAdmin && <Button color="inherit" component={Link} to="/admin">Admin Dashboard</Button>}
                        <Button color="inherit" component={Link} to="/profile">Profile</Button>
                        <Button variant="contained" color="error" 
                            onClick={() => {
                                localStorage.removeItem('jwt');
                                window.location.href = '/login';
                            }}
                        >
                            Logout
                        </Button>
                    </>
                ) : (
                    <>
                        <Button color="inherit" component={Link} to="/login">Login</Button>
                        <Button color="inherit" component={Link} to="/register">Register</Button>
                    </>
                )}
            </Toolbar>
        </AppBar>
    );
};

export default Header;

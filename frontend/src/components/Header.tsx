import { AppBar, Toolbar, Typography, Button } from "@mui/material";
import { Link } from "react-router-dom";
import { jwtDecode } from "jwt-decode";
import { useTranslation } from "react-i18next";

const Header = () => {
  const { t, i18n } = useTranslation(["header"]);
  const changeLanguage = (lng: string) => {
    i18n.changeLanguage(lng);
  };
  const token = localStorage.getItem("jwt");
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
          {t("Kanban board")}
        </Typography>
        {token ? (
          <>
            <Button
              color="inherit"
              onClick={() => localStorage.removeItem("email")}
              component={Link}
              to="/boards"
            >
              {t("Boards")}
            </Button>
            {isAdmin && (
              <Button color="inherit" component={Link} to="/admin">
                {t("Admin Dashboard")}
              </Button>
            )}
            <Button color="inherit" component={Link} to="/profile">
              {t("Profile")}
            </Button>
            <Button
              variant="contained"
              color="error"
              onClick={() => {
                localStorage.removeItem("jwt");
                window.location.href = "/login";
              }}
            >
              {t("Logout")}
            </Button>
          </>
        ) : (
          <>
            <Button color="inherit" component={Link} to="/login">
              {t("Login")}
            </Button>
            <Button color="inherit" component={Link} to="/register">
              {t("Register")}
            </Button>
          </>
        )}
        <Button color="inherit" onClick={() => changeLanguage("cn")}>
          中文
        </Button>
        <Button color="inherit" onClick={() => changeLanguage("en")}>
          EN
        </Button>
      </Toolbar>
    </AppBar>
  );
};

export default Header;

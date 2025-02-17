import React, { useState } from "react";
import {
  TextField,
  Button,
  Checkbox,
  FormControlLabel,
  Typography,
  Box,
} from "@mui/material";
import { useTranslation } from "react-i18next";

const Register = () => {
  const { t } = useTranslation("register");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [username, setUsername] = useState("");
  const [error, setError] = useState("");
  const [isAdmin, setIsAdmin] = useState(false);
  const [adminPass, setAdminPass] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const response = await fetch("/api/user/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email,
          password,
          username,
          adminPass: isAdmin ? adminPass : undefined,
        }),
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Registration failed");
      }
      window.location.href = "/login";
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError("An unknown error occurred");
      }
    }
  };

  return (
    <Box
      component="form"
      onSubmit={handleSubmit}
      sx={{ display: "flex", flexDirection: "column", gap: 2 }}
    >
      <TextField
        label={t("Email")}
        type="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        required
      />
      <TextField
        label={t("Password")}
        type="password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        required
      />
      <TextField
        label={t("Username")}
        type="text"
        value={username}
        onChange={(e) => setUsername(e.target.value)}
        required
      />
      <FormControlLabel
        control={
          <Checkbox
            checked={isAdmin}
            onChange={(e) => setIsAdmin(e.target.checked)}
          />
        }
        label={t("Register as Admin")}
      />
      {isAdmin && (
        <TextField
          label={t("Admin Password")}
          type="password"
          value={adminPass}
          onChange={(e) => setAdminPass(e.target.value)}
          required
        />
      )}
      <Button type="submit" variant="contained">
        {t("Register")}
      </Button>
      {error && <Typography color="error">{error}</Typography>}
    </Box>
  );
};

export default Register;

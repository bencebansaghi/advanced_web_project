import React, { useEffect, useState } from 'react'
import { TextField, Button, Checkbox, FormControlLabel, Typography, Box } from '@mui/material';

function AdminDashboard() {
  const [users, setUsers] = useState<{ _id: string, email: string, username: string, isAdmin: boolean, createdAt: Date }[]>([])

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const token = localStorage.getItem('jwt');
        const response = await fetch('/api/user/all', {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
        });
        if (response.ok) {
          const data = await response.json();
          setUsers(data.users)
        } else {
          const data = await response.json()
          console.error(`Failed to get users: ${data.error}`);
        }
      } catch (error) {
        console.error('Failed to get users:', error);
      }
    };

    fetchUsers();
    console.log(users)
  }, []);

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
      <Typography variant="h4">Admin Dashboard</Typography>
      {Array.isArray(users) && users.map((user) => (
        <Box key={user._id} sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <Typography>{user.username}</Typography>
          <Typography>{user.email}</Typography>
          <FormControlLabel
            control={<Checkbox checked={user.isAdmin} />}
            label="Admin"
            disabled
          />
        </Box>
      ))}
    </Box>
  );
}

export default AdminDashboard
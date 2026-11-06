import * as React from 'react';
import Avatar from '@mui/material/Avatar';
import CssBaseline from '@mui/material/CssBaseline';
import Box from '@mui/material/Box';
import LockOutlinedIcon from '@mui/icons-material/LockOutlined';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import Container from '@mui/material/Container';
import { useNavigate } from "react-router-dom";

// TODO remove, this demo shouldn't need to reset the theme.

function VerifyEmail({ userData }) {
  const router = useNavigate();

  const handleOnClickRegister = () => {
    router('/register');
  };

  const onClickVerifyEmail = () => {
    if(!userData)
      return;
    
    router('/verify_email/action/' + userData.sessionId);
  };

  return (
      <Container component="main" maxWidth="xs">
        <CssBaseline />
        <Box
          sx={{
            marginTop: 8,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
          }}
        >
          <Avatar sx={{ m: 1, bgcolor: 'secondary.main' }}>
            <LockOutlinedIcon />
          </Avatar>
          <Typography component="h1" variant="h5" pb={5}>
            Verificar email
          </Typography>
          <Box sx={{ textAlign: 'center' }}>
            En un sitio real, { userData == null ? 'tu correo' : userData.email } recibiría un enlace de verificación.<br/>
            Este proyecto es una demo y no envía correos: el botón verifica la cuenta al instante.
          </Box>
          <Box pt={3}>
            <Button variant="contained" color="primary" onClick={onClickVerifyEmail} disabled={!userData}>
              Verificar ahora
            </Button>
          </Box>
        </Box>
      </Container>
  );
}

export default VerifyEmail;
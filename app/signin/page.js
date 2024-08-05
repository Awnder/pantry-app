"use client"

import { firestore } from '@/firebase'
import { Box, Button, TextField, Typography } from '@mui/material'
import { useState } from 'react'

export default function Home() {
    const [userEmail, setUserEmail] = useState('')
    const [userPassword, setUserPassword] = useState('')
    
    const handleSubmit = (e) => {
        e.preventDefault();
        if (e.target.checkValidity()) {
          //() => useRouter().push('./app/page.js')
          setUserEmail('')
          setUserPassword('')
        } else {
          alert("Login is invalid! There must be an email and a password.");
        }
      }

  return (
    <Box
      width={'100vw'}
      height={'100vh'}
      display={'flex'}
      flexDirection={'column'}
      alignItems={'center'}
      justifyContent={'center'}
      gap={2}
      backgroundColor={'#D3F8CC'}
    >
      <Typography 
        variant={'h3'} 
        fontFamily={'Roboto'} 
        borderBottom={'1px solid black'} 
        borderRadius={'7px'}
      >
        Your Inventory Assistant
      </Typography>
      <Box
        display={'flex'}
        flexDirection={'column'}
        alignItems={'center'}
        justifyContent={'center'}
        gap={2}
      >
        <Box
          component={'form'}
          onSubmit={(e) => {
            handleSubmit(e)
          }}
          noValidate
          sx={{
            display: 'flex',
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 2
          }}
        >
            <TextField
              required
              color='success'
              placeholder='Enter your Email'
              onChange={(e) => setUserEmail(e.target.value)}
              value={userEmail}
            >
            </TextField>
            <TextField
              required
              color='success'
              placeholder='Enter your Password'
              onChange={(e) => setUserPassword(e.target.value)}
              value={userPassword}
            >
            </TextField>
        </Box>
        <Button variant='contained' color='success' type='submit'>Sign In/Sign Up</Button>
      </Box>
    </Box>
    
  )
}
"use client"

import { Box, Stack, Typography, Button, Modal, TextField } from '@mui/material'
import { firestore } from '@/firebase'
import { query, collection, doc, getDoc, getDocs, setDoc, deleteDoc, count, charAt} from "firebase/firestore";
import { useEffect, useState } from 'react'

// add item modal styling
const addItemStyle = {
  position: 'absolute',
  top: '50%',
  left: '50%',
  transform: 'translate(-50%, -50%)',
  width: 400,
  bgcolor: 'background.paper',
  border: '2px solid #000',
  boxShadow: 24,
  p: 4,
  display: 'flex',
  flexDirection: 'column',
  gap: 2,
};


export default function Home() {
  const collectionName = 'pantry'

  // modal (popup) states
  const [open, setOpen] = useState(false);
  const handleOpen = () => setOpen(true);
  const handleClose = () => setOpen(false);

  // item states
  const [itemName, setItemName] = useState('')
  const [itemQuantity, setQuantity] = useState(1)

  const [pantry, setPantry] = useState([])

  const updatePantry = async () => {
    const snapshot = query(collection(firestore, collectionName));
    const docs = await getDocs(snapshot)
    const pantryList = []
    docs.forEach((doc) => {
      pantryList.push({name: doc.id, ...doc.data()}) // spread operator "..." breaks array (collection) into components  
    })
    setPantry(pantryList)
  }

  // useEffect runs when something dependency array changes (if there is no array, runs once upon page load)
  useEffect(() => { updatePantry() }, [])

  // using awaits to ensure processes and promises are resolved before moving on to next steps
  const addItem = async (item) => {
    const docRef = doc(collection(firestore, collectionName), item)
    const docSnap = await getDoc(docRef)
    if (docSnap.exists()) {
      const {count} = docSnap.data()
      await setDoc(docRef, {count: count + 1})
    } else {
      await setDoc(docRef, {count: 1})
    }
    await updatePantry()
  }

  const removeItem = async (item) => {
    const docRef = doc(collection(firestore, collectionName), item)
    const docSnap = await getDoc(docRef)
    if (docSnap.exists()) {
      const {count} = docSnap.data()
      if (count === 1) {
        await deleteDoc(docRef)
      } else {
        await setDoc(docRef, {count: count - 1})
      }
    }
    await updatePantry()
  }

  return (
    <Box 
      width='100vw' 
      height='100vh'
      display={'flex'}
      flexDirection={'column'}
      justifyContent={'center'}
      alignItems={'center'}
      gap={2}
    >
      <Modal
        open={open}
        onClose={handleClose}
        aria-labelledby="modal-modal-title"
        aria-describedby="modal-modal-description"
      >
        <Box sx={addItemStyle}>
          <Typography id="modal-modal-title" variant="h6" component="h2">Add Item</Typography>
          <Stack direction={'row'} spacing={2}>
            <TextField 
              label='Item' 
              variant='outlined' 
              fullWidth
              autoFocus
              value={itemName}
              onChange={(e) => setItemName(e.target.value)}
            ></TextField>
            <TextField
              label='Quantity'
              varient='outlined'
              fullWidth
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}>
            </TextField>
            <Button variant='outlined'
              onClick={() => {
                addItem(itemName)
                setItemName('') // empties text field after submission
                handleClose()
              }}
            >Add</Button>
          </Stack>
        </Box>
      </Modal>
      <Box border={'1px solid #333'}>
        <Box 
          width='800px' 
          height='100px' 
          bgcolor={'#add8e6'} 
          display={'flex'} 
          justifyContent={'center'} 
          alignItems={'center'} 
        >
          <Typography variant={'h2'} fontFamily={'Segoe UI'} color={'#333'}>
            Pantry Items
          </Typography>
        </Box>
          <Stack width='800px' height='400px' spacing={2} overflow={'auto'}>
            {pantry.map(({name, count}) => (
              <Box
                key={name}
                width='100%'
                height='400px'
                display={'flex'}
                justifyContent={'space-between'}
                alignItems={'center'}
                bgcolor={'#f0f0f0'}
                paddingX={5}
              >
              <Typography varient={'h3'} fontFamily={'Segoe UI'} color={'#333'} textAlign={'center'}>
                {
                  // capitalize first letter of item
                  name.charAt(0).toUpperCase() + name.slice(1)
                }
              </Typography>
              <Typography varient={'h3'} fontFamily={'Segoe UI'} color={'#333'} textAlign={'center'}>
                Quantity: {count}
              </Typography>
 
              <Button variant='contained' onClick={() => removeItem(name)}>Remove</Button>
              </Box>
            ))}
          </Stack>
        </Box>
        <Button variant='contained' onClick={handleOpen}>Add Item</Button>
    </Box>
  )
}

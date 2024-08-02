"use client"

import { Box, Stack, Grid, Typography, Button, Modal, TextField, SelectChangeEvent, InputLabel, Select, MenuItem, FormControl } from '@mui/material'
import { firestore } from '@/firebase'
import { query, collection, doc, getDoc, getDocs, setDoc, deleteDoc, getCountFromServer, getAggregateFromServer, sum } from "firebase/firestore";
import { useEffect, useState } from 'react'

// add item modal styling
const addItemStyle = {
  position: 'absolute',
  top: '50%',
  left: '50%',
  transform: 'translate(-50%, -50%)',
  width: 500,
  bgcolor: 'background.paper',
  border: '2px solid #000',
  boxShadow: 24,
  p: 4,
  display: 'flex',
  flexDirection: 'column',
  gap: 2,
};

/* getting total quantities:
    const col = collection(firestore, "pantry")
    const snap = await getAggregateFromServer(col, {totalCount: sum('count')})
    console.log('count: ', snap.data().totalCount)
*/

export default function Home() {
  class Food {
    constructor (name, count) {
      this.name = name
      this.count = count
    }
    toString() {
      return this.name + ': ' + this.count
    }
  }
  const foodConverter = {
    toFirestore: (food) => {
      return {
          name: food.name,
          count: food.count,
          };
    },
    fromFirestore: (snapshot, options) => {
        const data = snapshot.data(options);
        return new Food(data.name, data.count);
    }
  }

  // add modal (popup) states
  const [openAdd, setOpenAdd] = useState(false);
  const handleOpenAdd = () => setOpenAdd(true);
  const handleCloseAdd = () => setOpenAdd(false);

  // item textfield states in modal
  const [itemName, setItemName] = useState('')
  const [itemCount, setItemCount] = useState(1)

  // inventory select dropdown in modal
  const [inventoryType, setInventory] = useState('pantry')
  const handleInventoryChange = (event) => { setInventory(event.target.value) }

  // setting base inventory
  const [pantry, setPantry] = useState([])
  const [fridge, setFridge] = useState([])
  const [freezer, setFreezer] = useState([])

  // useEffect runs when something in dependency array changes (if there is no array, runs once upon page load)
  useEffect(() => { updateInventory(inventoryName) }, [])

  const updateInventory = async inventoryName => {
    const snapshot = query(collection(firestore, inventoryName));
    const docs = await getDocs(snapshot)
    const inventoryList = []
    docs.forEach((doc) => {
      inventoryList.push({name: doc.id, ...doc.data()}) // spread operator "..." breaks array (collection) into components  
    })

    switch(inventoryName) {
      case 'pantry':
        setPantry(inventoryList)
        break
      case 'fridge':
        setFridge(inventoryList)
        break
      case 'freezer':
        setFreezer(inventoryList)
        break
    }
  }

  // using awaits to ensure processes and promises are resolved before moving on to next steps
  const addItem = async (inventoryName, item, itemCount) => {
    const docRef = doc(collection(firestore, inventoryName), item)
    const docSnap = await getDoc(docRef)
    if (docSnap.exists()) {
      const {count} = docSnap.data()
      await setDoc(docRef, {count: count + itemCount})
    } else {
      await setDoc(docRef, {count: itemCount})
    }
    await updateInventory(inventoryName)
  }

  const removeItem = async (inventoryName, item, all) => {
    const docRef = doc(collection(firestore, inventoryName), item)
    const docSnap = await getDoc(docRef)
    const {count} = docSnap.data()
    if (count === 1 || all) {
      await deleteDoc(docRef)
    } else {
      await setDoc(docRef, {count: count - 1})
    }
    await updateInventory(inventoryName)
  }

  async function totalItemsInInventory(inventoryName) {
    let col = collection(firestore, inventoryName)
    let snap = await getAggregateFromServer(col, {totalCount: sum('count')})
    return snap.data().totalCount
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

      {/* modal popups */}
      <Modal
        open={openAdd}
        onClose={handleCloseAdd}
        aria-labelledby="modal-add"
      >
        <Box sx={addItemStyle}>
          <Typography id="modal-add" variant="h6" component="h2">Add Item</Typography>
          <Stack direction={'row'} spacing={2}>
            <TextField 
              required
              label='Item' 
              variant='outlined' 
              fullWidth
              value={itemName}
              onChange={(e) => setItemName(e.target.value)}
            ></TextField>
            <TextField
              required
              label='Amount'
              varient='outlined'
              fullWidth
              value={itemCount} //e.target.value automatically sets field as str, need to convert to int before storing in firebase
              onChange={(e) => setItemCount(parseInt(e.target.value))}> 
            </TextField>
            <FormControl fullWidth required>
              <InputLabel id='inventory-type-label'>Type</InputLabel>
              <Select
                labelId='inventory-type-label'
                label='Type'
                value={inventoryType}
                onChange={handleInventoryChange}
              >
                <MenuItem value={'pantry'}>Pantry</MenuItem>
                <MenuItem value={'fridge'}>Fridge</MenuItem>
                <MenuItem value={'freezer'}>Freezer</MenuItem>
              </Select>
            </FormControl>
            <Button variant='outlined'
              onClick={() => {
                console.log(inventoryType)
                addItem(inventoryType, itemName, itemCount)
                setItemName('') // empties text field after submission
                setItemCount(1)
                handleCloseAdd()
              }}
            >Add</Button>
          </Stack>
        </Box>
      </Modal>

      {/* Inventory creation */}
      <Typography variant={'h2'} fontFamily={'Roboto'} color={'#333'} borderBottom={'1px solid black'} >
          Inventory Items
      </Typography>
      { /* Pantry Box */ }
      <Box 
        width='80vw'
        height='20vh'
        bgcolor={'#7EB09B'} 
        display={'flex'} 
        flexDirection={'column'}
        justifyContent={'center'}
        alignItems={'center'} 
        borderRadius={'16px'}
        border={'1px solid black'}
      >
        { /* Pantry Title and Functions */}
        <Box
          width='100%'
          height='100%'
          display={'flex'}
          flexDirection={'row'}
          alignItems={'center'}
        >
          <Box
            width='20%'
            height='100%'
            bgcolor={'#1D3417'}
            display={'flex'}
            flexDirection={'column'}
            justifyContent={'center'}
            alignItems={'center'}
            border={'1px solid black'}
            borderRadius={'16px'}
          >
            <Typography color={'#D3F8CC'}>Pantry Items</Typography>
            <Button variant='contained' color='success' onClick={handleOpenAdd}>Add Item</Button>
          </Box>
            { /* Pantry Items */ }
            <Grid container width='80%' height='80%' overflow={'auto'} sx={{ m: 2 }}>
              {pantry.map(({name, count}) => (
                <Grid 
                  item
                  xs={12} lg={6} xl={4}
                  key={name}
                  height='100px'
                  display={'flex'}
                  justifyContent={'space-between'}
                  alignItems={'center'}
                  bgcolor={'#D3F8CC'}
                  border={'5px solid #7EB09B'}
                  borderRadius={'16px'}
                  paddingX={3}
                >
                  <Typography varient={'h3'} fontFamily={'Segoe UI'} color={'#333'} textAlign={'center'}>
                    {
                      // capitalize first letter of item
                      name.charAt(0).toUpperCase() + name.slice(1)
                    }
                  </Typography>
                  <Typography varient={'h3'} fontFamily={'Segoe UI'} color={'#333'} textAlign={'center'}>
                    Amount: {count}
                  </Typography>
                  <Box
                    display={'flex'}
                    flexDirection={'column'}
                    alignItems={'column'}
                    justifyContent={'space-around'}
                    gap={1}
                    sx={{ py: 1 }}
                  >
                    <Button variant='contained' size='small' color='success' onClick={() => removeItem(name, false)}>Remove</Button>
                    <Button variant='outlined' size='small' color='warning' onClick={() => removeItem(name, true)}>Rmv All</Button>
                  </Box>
                </Grid>
                ))}
            </Grid>
          </Box>
        </Box>

      { /* Fridge Box */ }
      <Box 
        width='80vw'
        height='20vh'
        bgcolor={'#519E8A'} 
        display={'flex'} 
        flexDirection={'column'}
        justifyContent={'center'}
        alignItems={'center'} 
        borderRadius={'16px'}
        border={'1px solid black'}
      >
        { /* Fridge Title and Functions */}
        <Box
          width='100%'
          height='100%'
          display={'flex'}
          flexDirection={'row'}
          alignItems={'center'}
        >
          <Box
            width='20%'
            height='100%'
            bgcolor={'#1D3417'}
            display={'flex'}
            flexDirection={'column'}
            justifyContent={'center'}
            alignItems={'center'}
            border={'1px solid black'}
            borderRadius={'16px'}
          >
            <Typography color={'#D3F8CC'}>Fridge Items</Typography>
            <Button variant='contained' color='success' onClick={handleOpenAdd}>Add Item</Button>
          </Box>
            { /* Fridge Items */ }
            <Grid container width='80%' height='80%' overflow={'auto'} sx={{ m: 2 }}>
              {pantry.map(({name, count}) => (
                <Grid 
                  item
                  xs={12} lg={6} xl={4}
                  key={name}
                  height='100px'
                  display={'flex'}
                  justifyContent={'space-between'}
                  alignItems={'center'}
                  bgcolor={'#D3F8CC'}
                  border={'5px solid #519E8A'}
                  borderRadius={'16px'}
                  paddingX={3}
                >
                  <Typography varient={'h3'} fontFamily={'Segoe UI'} color={'#333'} textAlign={'center'}>
                    {
                      // capitalize first letter of item
                      name.charAt(0).toUpperCase() + name.slice(1)
                    }
                  </Typography>
                  <Typography varient={'h3'} fontFamily={'Segoe UI'} color={'#333'} textAlign={'center'}>
                    Amount: {count}
                  </Typography>
                  <Box
                    display={'flex'}
                    flexDirection={'column'}
                    alignItems={'column'}
                    justifyContent={'space-around'}
                    gap={1}
                    sx={{ py: 1 }}
                  >
                    <Button variant='contained' size='small' color='success' onClick={() => removeItem(name, false)}>Remove</Button>
                    <Button variant='outlined' size='small' color='warning' onClick={() => removeItem(name, true)}>Rmv All</Button>
                  </Box>
                </Grid>
                ))}
            </Grid>
          </Box>
        </Box>

      { /* Freezer Box */ }
      <Box 
        width='80vw'
        height='20vh'
        bgcolor={'#4E826B'} 
        display={'flex'} 
        flexDirection={'column'}
        justifyContent={'center'}
        alignItems={'center'} 
        borderRadius={'16px'}
        border={'1px solid black'}
      >
        { /* Freezer Title and Functions */}
        <Box
          width='100%'
          height='100%'
          display={'flex'}
          flexDirection={'row'}
          alignItems={'center'}
        >
          <Box
            width='20%'
            height='100%'
            bgcolor={'#1D3417'}
            display={'flex'}
            flexDirection={'column'}
            justifyContent={'center'}
            alignItems={'center'}
            border={'1px solid black'}
            borderRadius={'16px'}
          >
            <Typography color={'#D3F8CC'}>Freezer Items</Typography>
            <Button variant='contained' color='success' onClick={handleOpenAdd}>Add Item</Button>
          </Box>
            { /* Freezer Items */ }
            <Grid container width='80%' height='80%' overflow={'auto'} sx={{ m: 2 }}>
              {pantry.map(({name, count}) => (
                <Grid 
                  item
                  xs={12} lg={6} xl={4}
                  key={name}
                  height='100px'
                  display={'flex'}
                  justifyContent={'space-between'}
                  alignItems={'center'}
                  bgcolor={'#D3F8CC'}
                  border={'5px solid #4E826B'}
                  borderRadius={'16px'}
                  paddingX={3}
                >
                  <Typography varient={'h3'} fontFamily={'Segoe UI'} color={'#333'} textAlign={'center'}>
                    {
                      // capitalize first letter of item
                      name.charAt(0).toUpperCase() + name.slice(1)
                    }
                  </Typography>
                  <Typography varient={'h3'} fontFamily={'Segoe UI'} color={'#333'} textAlign={'center'}>
                    Amount: {count}
                  </Typography>
                  <Box
                    display={'flex'}
                    flexDirection={'column'}
                    alignItems={'column'}
                    justifyContent={'space-around'}
                    gap={1}
                    sx={{ py: 1 }}
                  >
                    <Button variant='contained' size='small' color='success' onClick={() => removeItem(name, false)}>Remove</Button>
                    <Button variant='outlined' size='small' color='warning' onClick={() => removeItem(name, true)}>Rmv All</Button>
                  </Box>
                </Grid>
                ))}
            </Grid>
          </Box>
        </Box>
    </Box>
  )
}

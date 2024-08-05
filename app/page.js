"use client"

import { Box, Grid, Typography, Button, Modal, TextField } from '@mui/material'
import {
  Unstable_NumberInput as BaseNumberInput,
  numberInputClasses,
} from '@mui/base/Unstable_NumberInput';import { styled } from '@mui/system';
import { firestore } from '@/firebase'
import { query, collection, doc, getDoc, getDocs, setDoc, deleteDoc } from "firebase/firestore";
import { useEffect, useState, forwardRef } from 'react'

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

const NumberInput = forwardRef(function CustomNumberInput(props, ref) {
  return (
    <BaseNumberInput
      slots={{
        root: numberInputRootStyle,
        input: numberInputElementStyle,
      }}
      {...props}
      ref={ref}
    />
  );
});

const numberInputRootStyle = styled('div')(
  ({ theme }) => `
  font-family: 'IBM Plex Sans', sans-serif;
  font-weight: 400;
  border-radius: 8px;
  color: #1C2025;
  border: 1px solid #7EB09B;
  box-shadow: 0px 2px 2px #F3F6F9;
  display: grid;
  grid-template-columns: 1fr 19px;
  grid-template-rows: 1fr 1fr;
  overflow: hidden;
  column-gap: 8px;
  padding: 4px;

  &.${numberInputClasses.focused} {
    border-color: #7EB09B;
    box-shadow: 0 0 0 1px #1D3417;
  }

  &:hover {
    border-color: #4E826B;
  }

  // firefox
  &:focus-visible {
    outline: 0;
  }
`,
);

const numberInputElementStyle = styled('input')(
  ({ theme }) => `
  font-size: 0.875rem;
  font-family: inherit;
  font-weight: 400;
  line-height: 1.5;
  grid-column: 1/2;
  grid-row: 1/3;
  color: #1C2025;
  background: inherit;
  border: none;
  border-radius: inherit;
  padding: 8px 12px;
  outline: 0;
`,
);

export default function Home() {
  // add modal (popup) states
  const [openAddPantry, setOpenAddPantry] = useState(false)
  const handleOpenAddPantry = () => setOpenAddPantry(true)
  const handleCloseAddPantry = () => {
    setOpenAddPantry(false)
    setItemName('')
    setItemCount()
  }

  const [openAddFridge, setOpenAddFridge] = useState(false)
  const handleOpenAddFridge = () => setOpenAddFridge(true)
  const handleCloseAddFridge = () => {
    setOpenAddFridge(false)
    setItemName('')
    setItemCount()
  }

  const [openAddFreezer, setOpenAddFreezer] = useState(false)
  const handleOpenAddFreezer = () => setOpenAddFreezer(true)
  const handleCloseAddFreezer = () => {
    setOpenAddFreezer(false)
    setItemName('')
    setItemCount()
  }

  // item textfield states in modal
  const [itemName, setItemName] = useState('')
  const [itemCount, setItemCount] = useState()

  // uses regex to only allow alpha characters and spaces (\s)
  const handleItemName = event => {
    const result = event.target.value.replace(/[^a-z\s]/gi, '');
    setItemName(result.toLowerCase())
  }

  const handleItemCount = event => {
    const number = parseInt(event.target.value)
    if (isNaN(number)) {
      setItemCount()
    } else {
      setItemCount(number)
    }
  }

  // handling modal submission
  const handleSubmit = (e, inventoryName, itemName, itemCount) => {
    e.preventDefault();
    if (e.target.checkValidity() && itemName.trim() !== '') {
      addItem(inventoryName, itemName.trim(), itemCount)
    } else {
      alert("Item is invalid! There must be an item and an amount.");
    }
  }

  // collection names can be changed here
  const forPantry = 'pantry'
  const forFridge = 'fridge'
  const forFreezer = 'freezer'

  // setting base inventory
  const [pantry, setPantry] = useState([])
  const [fridge, setFridge] = useState([])
  const [freezer, setFreezer] = useState([])
  const [pantryLocal, setPantryLocal] = useState([])
  const [fridgeLocal, setFridgeLocal] = useState([])
  const [freezerLocal, setFreezerLocal] = useState([])

  // useEffect runs when something in dependency array changes (if there is no array, runs once upon page load)
  // updates and loads in items on page load
  useEffect(() => { updatePantry() }, [])
  useEffect(() => { updateFridge() }, [])
  useEffect(() => { updateFreezer() }, [])

  const filterInventory = (item, collectionName) => {
    switch (collectionName) {
      case forPantry:
        setPantryLocal(pantry.filter(f => f.name.toLowerCase().includes(item.target.value)))
        break
      case forFridge:
        setFridgeLocal(fridge.filter(f => f.name.toLowerCase().includes(item.target.value)))
        break
      case forFreezer:
        setFreezerLocal(freezer.filter(f => f.name.toLowerCase().includes(item.target.value)))
        break
    }
  }

  // updating inventories - in progress: reducing redundant code
  // see about combining these and making a init useEffect() or smth
  const updatePantry = async () => {
    const snapshot = query(collection(firestore, forPantry))
    const docs = await getDocs(snapshot)
    const pantryList = []
    docs.forEach((doc) => {
      pantryList.push({name: doc.id, ...doc.data()}) // spread operator "..." breaks array (collection) into components  
    })
    setPantry(pantryList)
    setPantryLocal(pantryList)
  }

  const updateFridge = async () => {
    const snapshot = query(collection(firestore, forFridge))
    const docs = await getDocs(snapshot)
    const fridgeList = []
    docs.forEach((doc) => {
      fridgeList.push({name: doc.id, ...doc.data()}) // spread operator "..." breaks array (collection) into components  
    })
    setFridge(fridgeList)
    setFridgeLocal(fridgeList)
  }

  const updateFreezer = async () => {
    const snapshot = query(collection(firestore, forFreezer))
    const docs = await getDocs(snapshot)
    const freezerList = []
    docs.forEach((doc) => {
      freezerList.push({name: doc.id, ...doc.data()}) // spread operator "..." breaks array (collection) into components  
    })
    setFreezer(freezerList)
    setFreezerLocal(freezerList)
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

    switch(inventoryName) {
      case forPantry:
        await updatePantry()
        break
      case forFridge:
        await updateFridge()
        break
      case forFreezer:
        await updateFreezer()
    }
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
    
    switch(inventoryName) {
      case forPantry:
        await updatePantry()
        break
      case forFridge:
        await updateFridge()
        break
      case forFreezer:
        await updateFreezer()
    }
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
      backgroundColor={'#D3F8CC'}
    >
      {/* modal popups */}
      <Modal open={openAddPantry} onClose={handleCloseAddPantry} aria-labelledby="modal-add-pantry">
        <Box sx={addItemStyle}>
          <Typography id="modal-add-pantry" variant="h6" component="h2">Add Pantry Item</Typography>
          <Box 
            component={'form'} 
            onSubmit={(e) => {
              handleSubmit(e, forPantry, itemName, itemCount)
              setItemName('')
              setItemCount()
              handleCloseAddPantry()
            }} 
            noValidate
            sx={{ display: 'flex', flexDirection: 'row' }}
          >
            <TextField
              required
              label='Item' 
              variant='outlined'
              value={itemName}
              onChange={(e) => handleItemName(e)}
              sx={{ marginRight: '10px' }}
            ></TextField>
            <NumberInput
              required
              label='Amount'
              aria-label="item-count"
              placeholder="Add amount…"
              value={itemCount}
              onChange={(e) => handleItemCount(e)}
              // when losing focus on numberinput with a value in it, unable to change value when refocusing, onBlur fixes this problem
              onBlur={(e) => setItemCount()} 
              min={1}
              sx={{ marginRight: '10px' }}
            />
            <Button variant='outlined' color='success' type='submit'>Add</Button>
          </Box>
        </Box>
      </Modal>

      <Modal open={openAddFridge} onClose={handleCloseAddFridge} aria-labelledby="modal-add-fridge">
        <Box sx={addItemStyle}>
          <Typography id="modal-add-fridge" variant="h6" component="h2">Add Fridge Item</Typography>
          <Box 
            component={'form'} 
            onSubmit={(e) => {
              handleSubmit(e, forFridge, itemName, itemCount)
              setItemName('')
              setItemCount()
              handleCloseAddFridge()
            }} 
            noValidate
            sx={{ display: 'flex', flexDirection: 'row' }}
          >
            <TextField
              required
              label='Item' 
              variant='outlined'
              value={itemName}
              onChange={(e) => handleItemName(e)}
              sx={{ marginRight: '10px' }}
            ></TextField>
            <NumberInput
              required
              label='Amount'
              aria-label="item-count"
              placeholder="Add amount…"
              value={itemCount}
              onChange={(e) => handleItemCount(e)}
              // when losing focus on numberinput with a value in it, unable to change value when refocusing, onBlur fixes this problem
              onBlur={(e) => setItemCount()}
              min={1}
              sx={{ marginRight: '10px' }}
            />
            <Button variant='outlined' color='success' type='submit'>Add</Button>
          </Box>
        </Box>
      </Modal>

      <Modal
        open={openAddFreezer}
        onClose={handleCloseAddFreezer}
        aria-labelledby="modal-add-freezer"
      >
        <Box sx={addItemStyle}>
          <Typography id="modal-add-freezer" variant="h6" component="h2">Add Freezer Item</Typography>
          <Box 
            component={'form'} 
            onSubmit={(e) => {
              handleSubmit(e, forFreezer, itemName, itemCount)
              setItemName('')
              setItemCount()
              handleCloseAddFreezer()
            }} 
            noValidate
            sx={{ display: 'flex', flexDirection: 'row' }}
          >
            <TextField
              required
              label='Item' 
              variant='outlined'
              value={itemName}
              onChange={(e) => handleItemName(e)}
              sx={{ marginRight: '10px' }}
            ></TextField>
            <NumberInput
              required
              label='Amount'
              aria-label="item-count"
              placeholder="Add amount…"
              value={itemCount}
              onChange={(e) => handleItemCount(e)}
              // when losing focus on numberinput with a value in it, unable to change value when refocusing, onBlur fixes this problem
              onBlur={(e) => setItemCount()}
              min={1}
              sx={{ marginRight: '10px' }}
            />
            <Button variant='outlined' color='success' type='submit'>Add</Button>
          </Box>
        </Box>
      </Modal>

      {/* Inventory creation */}
      <Typography variant={'h3'} fontFamily={'Roboto'} color={'#333'} borderBottom={'1px solid black'} borderRadius={'7px'}>
          Inventory Items
      </Typography>
      { /* Pantry Box */ }
      <Box 
        width='80vw'
        height='25vh'
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
            textAlign={'center'}
            border={'1px solid black'}
            borderRadius={'16px'}
            gap={'5px'}
          >
            <Typography color={'#D3F8CC'}>Pantry Items</Typography>
            <Button variant='contained' color='success' onClick={handleOpenAddPantry}>Add Item</Button>
            <TextField
              variant='outlined'
              color='success'
              placeholder='Search...'
              onChange={(e) => filterInventory(e, forPantry)}
              sx={{ 
                input: {color: '#D3F8CC'},
                width: '50%'
              }}
            ></TextField>
          </Box>
            { /* Pantry Items */ }
            <Grid container width='80%' height='80%' overflow={'auto'} sx={{ m: 2 }}>
              {pantryLocal.map(({name, count}) => (
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
                    <Button variant='outlined' size='small' color='success' onClick={() => removeItem(forPantry, name, false)}>Remove</Button>
                    <Button variant='outlined' size='small' color='warning' onClick={() => removeItem(forPantry, name, true)}>Rmv All</Button>
                  </Box>
                </Grid>
                ))}
            </Grid>
          </Box>
        </Box>
      
      { /* Fridge Box */ }
      <Box 
        width='80vw'
        height='25vh'
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
            textAlign={'center'}
            border={'1px solid black'}
            borderRadius={'16px'}
            gap={'5px'}
          >
            <Typography color={'#D3F8CC'}>Fridge Items</Typography>
            <Button variant='contained' color='success' onClick={handleOpenAddFridge}>Add Item</Button>
            <TextField
              variant='outlined'
              color='success'
              placeholder='Search...'
              onChange={(e) => filterInventory(e, forFridge)}
              sx={{ 
                input: {color: '#D3F8CC'},
                width: '50%'
              }}
            ></TextField>
          </Box>
            { /* Fridge Items */ }
            <Grid container width='80%' height='80%' overflow={'auto'} sx={{ m: 2 }}>
              {fridgeLocal.map(({name, count}) => (
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
                    <Button variant='outlined' size='small' color='success' onClick={() => removeItem(forFridge, name, false)}>Remove</Button>
                    <Button variant='outlined' size='small' color='warning' onClick={() => removeItem(forFridge, name, true)}>Rmv All</Button>
                  </Box>
                </Grid>
                ))}
            </Grid>
          </Box>
        </Box>

      { /* Freezer Box */ }
      <Box 
        width='80vw'
        height='25vh'
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
            textAlign={'center'}
            border={'1px solid black'}
            borderRadius={'16px'}
            gap={'5px'}
          >
            <Typography color={'#D3F8CC'}>Freezer Items</Typography>
            <Button variant='contained' color='success' onClick={handleOpenAddFreezer}>Add Item</Button>
            <TextField
              variant='outlined'
              color='success'
              placeholder='Search...'
              onChange={(e) => filterInventory(e, forFreezer)}
              sx={{ 
                input: {color: '#D3F8CC'},
                width: '50%'
              }}
            ></TextField>
          </Box>
            { /* Freezer Items */ }
            <Grid container width='80%' height='80%' overflow={'auto'} sx={{ m: 2 }}>
              {freezerLocal.map(({name, count}) => (
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
                    <Button variant='outlined' size='small' color='success' onClick={() => removeItem(forFreezer, name, false)}>Remove</Button>
                    <Button variant='outlined' size='small' color='warning' onClick={() => removeItem(forFreezer, name, true)}>Rmv All</Button>
                  </Box>
                </Grid>
                ))}
            </Grid>
          </Box>
        </Box>
    </Box>
  )
}

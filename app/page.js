"use client"

import { Box, Stack, Typography, Button, Modal, TextField } from '@mui/material'
import { firestore } from '@/firebase'
import { query, collection, doc, getDoc, getDocs, setDoc, deleteDoc } from "firebase/firestore";
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
  class Food {
    constructor (name, count, newestDate, oldestDate) {
      this.name = name
      this.count = count
      this.newestDate = newestDate
      this.oldestDate = oldestDate
    }
    toString() {
      return this.name + ': ' + this.count + ', newest/oldest: ' + this.newestDate + '/' + this.oldestDate
    }
  }
  const foodConverter = {
    toFirestore: (food) => {
      return {
          name: food.name,
          count: food.count,
          newestDate: food.newestDate,
          oldestDate: food.oldestDate
          };
    },
    fromFirestore: (snapshot, options) => {
        const data = snapshot.data(options);
        return new Food(data.name, data.count, data.newestDate, data.oldestDate);
    }
  }

  const collectionName = 'pantry'

  // add modal (popup) states
  const [openAdd, setOpenAdd] = useState(false);
  const handleOpenAdd = () => setOpenAdd(true);
  const handleCloseAdd = () => setOpenAdd(false);

  // item states
  const [itemName, setItemName] = useState('')
  const [itemCount, setItemCount] = useState(1)

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

  // useEffect runs when something in dependency array changes (if there is no array, runs once upon page load)
  useEffect(() => { updatePantry() }, [])

  // using awaits to ensure processes and promises are resolved before moving on to next steps
  const addItem = async (item, itemCount) => {
    const docRef = doc(collection(firestore, collectionName), item)
    const docSnap = await getDoc(docRef)
    if (docSnap.exists()) {
      const {count, newest, oldest} = docSnap.data()
      await setDoc(docRef, {count: count + itemCount, newestDate: todaysDate, oldestDate: oldestDate})
    } else {
      await setDoc(docRef, {count: itemCount, newestDate: todaysDate, oldestDate: todaysDate})
    }
    await updatePantry()
  }

  const removeItem = async (item, all) => {
    const docRef = doc(collection(firestore, collectionName), item)
    const docSnap = await getDoc(docRef)
    const {count, oldest, newest} = docSnap.data()
    if (count === 1 || all) {
      await deleteDoc(docRef)
    } else {
      await setDoc(docRef, {count: count - 1}, {oldest}, {newest})
    }
    await updatePantry()
  }

  const todaysDate = async () => {
    let today = new Date()
    let dd = String(today.getDate()).padStart(2, '0');
    let mm = String(today.getMonth() + 1).padStart(2, '0'); //January is 0!
    let yyyy = today.getFullYear();
    today = mm + '/' + dd + '/' + yyyy;
    return today
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
              label='Item' 
              variant='outlined' 
              fullWidth
              value={itemName}
              onChange={(e) => setItemName(e.target.value)}
            ></TextField>
            <TextField
              label='Quantity'
              varient='outlined'
              fullWidth
              value={itemCount} //e.target.value automatically sets field as str, need to convert to int before storing in firebase
              onChange={(e) => setItemCount(parseInt(e.target.value))}> 
            </TextField>
            <Button variant='outlined'
              onClick={() => {
                addItem(itemName, itemCount)
                setItemName('') // empties text field after submission
                setItemCount(1)
                handleCloseAdd()
              }}
            >Add</Button>
          </Stack>
        </Box>
      </Modal>

      {/* pantry creation */}
      <Box border={'1px solid #333'}>
        <Box 
          width='800px' 
          height='100px' 
          bgcolor={'#add8e6'} 
          display={'flex'} 
          justifyContent={'center'} 
          alignItems={'center'} 
          borderBottom={'1px solid black'}
        >
          <Typography variant={'h2'} fontFamily={'Roboto'} color={'#333'} borderBottom={'1px solid black'} >
            Pantry Items
          </Typography>
        </Box>
          <Stack width='800px' height='400px' spacing={2} overflow={'auto'}>
            {pantry.map(({name, count, newestDate, oldestDate}) => (
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
              <Typography varient={'h3'} fontFamily={'Segoe UI'} color={'#333'} textAlign={'center'}>
                Newest: {newestDate}
              </Typography>
              <Box
                display={'flex'}
                flexDirection={'column'}
                alignItems={'column'}
                justifyContent={'space-around'}
                gap={1}
                sx={{ py: 1 }}
              >
                <Button variant='contained' onClick={() => removeItem(name, false)}>Remove</Button>
                <Button variant='outlined' color='warning' onClick={() => removeItem(name, true)}>Remove All</Button>
              </Box>
              </Box>
            ))}
          </Stack>
        </Box>
        <Button variant='contained' onClick={handleOpenAdd}>Add Item</Button>
    </Box>
  )
}

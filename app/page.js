'use client'

import React, { useState, useEffect } from 'react';
import { 
  Box, 
  Stack, 
  Typography, 
  Button, 
  Modal, 
  TextField, 
  Paper, 
  Container, 
  IconButton, 
  AppBar, 
  Toolbar,
  Fade,
  Divider,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle
} from '@mui/material';
import { Add, Remove, Inventory2, Edit, Delete, Search } from '@mui/icons-material';
import { firestore } from '@/firebase';
import {
  collection,
  doc,
  getDocs,
  query,
  setDoc,
  deleteDoc,
  getDoc,
} from 'firebase/firestore';

const modalStyle = {
  position: 'absolute',
  top: '50%',
  left: '50%',
  transform: 'translate(-50%, -50%)',
  width: 400,
  bgcolor: 'background.paper',
  boxShadow: 24,
  p: 4,
  borderRadius: 2,
};

const containerStyle = {
  minHeight: '100vh',
  display: 'flex',
  flexDirection: 'column',
  pt: 10,
  pb: 4,
  gap: 4,
  bgcolor: 'grey.100',
};

export default function Home() {
  const [inventory, setInventory] = useState([]);
  const [open, setOpen] = useState(false);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [itemName, setItemName] = useState('');
  const [itemQuantity, setItemQuantity] = useState(1);
  const [editMode, setEditMode] = useState(false);
  const [editItemOriginalName, setEditItemOriginalName] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [itemToDelete, setItemToDelete] = useState(null);

  const updateInventory = async () => {
    const snapshot = query(collection(firestore, 'inventory'));
    const docs = await getDocs(snapshot);
    const inventoryList = [];
    docs.forEach((doc) => {
      inventoryList.push({ name: doc.id, ...doc.data() });
    });
    setInventory(inventoryList);
  };

  useEffect(() => {
    updateInventory();
  }, []);

  const handleOpen = (item = null) => {
    if (item) {
      setEditMode(true);
      setEditItemOriginalName(item.name);
      setItemName(item.name);
      setItemQuantity(item.quantity);
    } else {
      setEditMode(false);
      setItemName('');
      setItemQuantity(1);
    }
    setOpen(true);
  };

  const handleClose = () => {
    setOpen(false);
    setEditMode(false);
    setItemName('');
    setItemQuantity(1);
  };

  const handleSubmit = async () => {
    if (!itemName.trim()) return;
    const docRef = doc(collection(firestore, 'inventory'), itemName.trim());
    if (editMode) {
      if (editItemOriginalName !== itemName) {
        await deleteDoc(doc(collection(firestore, 'inventory'), editItemOriginalName));
      }
    }
    await setDoc(docRef, { quantity: itemQuantity });
    await updateInventory();
    handleClose();
  };

  const handleDelete = async (item) => {
    setItemToDelete(item);
    setDeleteConfirmOpen(true);
  };

  const confirmDelete = async () => {
    if (itemToDelete) {
      await deleteDoc(doc(collection(firestore, 'inventory'), itemToDelete.name));
      await updateInventory();
    }
    setDeleteConfirmOpen(false);
    setItemToDelete(null);
  };

  const filteredInventory = inventory.filter(item =>
    item.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <>
      <AppBar position="fixed">
        <Toolbar>
          <Inventory2 sx={{ mr: 2 }} />
          <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
            Abstergo Inventory Store
          </Typography>
          <Button color="inherit" startIcon={<Add />} onClick={() => handleOpen()}>
            Add Item
          </Button>
        </Toolbar>
      </AppBar>
      <Container maxWidth="md" sx={containerStyle}>
        <Modal
          open={open}
          onClose={handleClose}
          closeAfterTransition
        >
          <Fade in={open}>
            <Box sx={modalStyle}>
              <Typography variant="h6" component="h2" gutterBottom>
                {editMode ? 'Edit Item' : 'Add New Item'}
              </Typography>
              <Divider sx={{ mb: 2 }} />
              <Stack spacing={2}>
                <TextField
                  label="Item Name"
                  variant="outlined"
                  fullWidth
                  value={itemName}
                  onChange={(e) => setItemName(e.target.value)}
                />
                <TextField
                  label="Quantity"
                  variant="outlined"
                  fullWidth
                  type="number"
                  value={itemQuantity}
                  onChange={(e) => setItemQuantity(parseInt(e.target.value) || 0)}
                />
                <Button 
                  variant="contained" 
                  startIcon={editMode ? <Edit /> : <Add />} 
                  onClick={handleSubmit}
                  disabled={!itemName.trim() || itemQuantity < 1}
                >
                  {editMode ? 'Update Item' : 'Add Item'}
                </Button>
              </Stack>
            </Box>
          </Fade>
        </Modal>
        <Dialog
          open={deleteConfirmOpen}
          onClose={() => setDeleteConfirmOpen(false)}
        >
          <DialogTitle>Confirm Delete</DialogTitle>
          <DialogContent>
            <DialogContentText>
              Are you sure you want to delete {itemToDelete?.name}?
            </DialogContentText>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setDeleteConfirmOpen(false)}>Cancel</Button>
            <Button onClick={confirmDelete} color="error">Delete</Button>
          </DialogActions>
        </Dialog>
        <Paper elevation={3} sx={{ width: '100%', p: 3, borderRadius: 2 }}>
          <Typography variant="h4" color="primary" gutterBottom>
             Items in Inventory
          </Typography>
          <Divider sx={{ mb: 2 }} />
          <TextField
            fullWidth
            variant="outlined"
            label="Search items"
            InputProps={{
              startAdornment: <Search color="action" />,
            }}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            sx={{ mb: 2 }}
          />
          {filteredInventory.length === 0 ? (
            <Typography variant="body1" color="text.secondary" align="center">
              No items found. Add some items or try a different search term.
            </Typography>
          ) : (
            <Stack spacing={2} sx={{ maxHeight: 400, overflow: 'auto' }}>
              {filteredInventory.map((item) => (
                <Paper key={item.name} elevation={2} sx={{ p: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderRadius: 1 }}>
                  <Typography variant="h6" color="text.primary">
                    {item.name.charAt(0).toUpperCase() + item.name.slice(1)}
                  </Typography>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    <Typography variant="body1" color="text.secondary">
                      Quantity: {item.quantity}
                    </Typography>
                    <IconButton color="primary" onClick={() => handleOpen(item)} size="small">
                      <Edit />
                    </IconButton>
                    <IconButton color="error" onClick={() => handleDelete(item)} size="small">
                      <Delete />
                    </IconButton>
                  </Box>
                </Paper>
              ))}
            </Stack>
          )}
        </Paper>
      </Container>
    </>
  );
}
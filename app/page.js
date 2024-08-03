'use client'

import React, { useState, useEffect, useRef } from 'react';
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
import { Add, Remove, Inventory2, Edit, Delete, Search, Camera } from '@mui/icons-material';
import { firestore, storage } from '@/firebase';
import {
  collection,
  doc,
  getDocs,
  query,
  setDoc,
  deleteDoc,
  getDoc,
} from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';

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
  const [cameraOpen, setCameraOpen] = useState(false);
  const [imageUrl, setImageUrl] = useState('');
  const videoRef = useRef(null);
  const canvasRef = useRef(null);

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
      setImageUrl(item.imageUrl || '');
    } else {
      setEditMode(false);
      setItemName('');
      setItemQuantity(1);
      setImageUrl('');
    }
    setOpen(true);
  };

  const handleClose = () => {
    setOpen(false);
    setEditMode(false);
    setItemName('');
    setItemQuantity(1);
    setImageUrl('');
  };

  const handleDelete = (item) => {
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

  const openCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
      setCameraOpen(true);
    } catch (error) {
      console.error('Error accessing camera:', error);
    }
  };

  const captureImage = () => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (video && canvas) {
      const context = canvas.getContext('2d');
      context.drawImage(video, 0, 0, canvas.width, canvas.height);
      const imageDataUrl = canvas.toDataURL('image/jpeg');
      setImageUrl(imageDataUrl);
      setCameraOpen(false);
      // Stop the camera stream
      const stream = video.srcObject;
      const tracks = stream.getTracks();
      tracks.forEach(track => track.stop());
    }
  };

  const uploadImage = async () => {
    if (!imageUrl) return;

    try {
      // Convert data URL to blob
      const response = await fetch(imageUrl);
      const blob = await response.blob();

      // Upload to Firebase Storage
      const storageRef = ref(storage, `inventory_images/${itemName}.jpg`);
      await uploadBytes(storageRef, blob);

      // Get download URL
      const downloadURL = await getDownloadURL(storageRef);

      return downloadURL;
    } catch (error) {
      console.error('Error uploading image:', error);
      return null;
    }
  };

  const handleSubmit = async () => {
    if (!itemName.trim()) return;
    
    let downloadURL = null;
    if (imageUrl) {
      downloadURL = await uploadImage();
    }

    const docRef = doc(collection(firestore, 'inventory'), itemName.trim());
    if (editMode) {
      if (editItemOriginalName !== itemName) {
        await deleteDoc(doc(collection(firestore, 'inventory'), editItemOriginalName));
      }
    }
    await setDoc(docRef, { 
      quantity: itemQuantity,
      ...(downloadURL && { imageUrl: downloadURL })
    }, { merge: true });
    
    await updateInventory();
    handleClose();
  };

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
                  variant="outlined" 
                  startIcon={<Camera />} 
                  onClick={openCamera}
                >
                  Take Photo
                </Button>
                {imageUrl && (
                  <Box sx={{ width: '100%', height: 200, backgroundImage: `url(${imageUrl})`, backgroundSize: 'cover', backgroundPosition: 'center' }} />
                )}
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
          open={cameraOpen}
          onClose={() => setCameraOpen(false)}
          maxWidth="sm"
          fullWidth
        >
          <DialogTitle>Take Photo</DialogTitle>
          <DialogContent>
            <Box sx={{ position: 'relative', width: '100%', height: 0, paddingBottom: '75%' }}>
              <video 
                ref={videoRef} 
                autoPlay 
                style={{ position: 'absolute', width: '100%', height: '100%', objectFit: 'cover' }}
              />
            </Box>
            <canvas ref={canvasRef} style={{ display: 'none' }} width={640} height={480} />
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setCameraOpen(false)}>Cancel</Button>
            <Button onClick={captureImage} variant="contained" color="primary">
              Capture
            </Button>
          </DialogActions>
        </Dialog>
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
          {inventory.length === 0 ? (
            <Typography variant="body1" color="text.secondary" align="center">
              No items found. Add some items or try a different search term.
            </Typography>
          ) : (
            <Stack spacing={2} sx={{ maxHeight: 400, overflow: 'auto' }}>
              {inventory.filter(item => 
                item.name.toLowerCase().includes(searchTerm.toLowerCase())
              ).map((item) => (
                <Paper key={item.name} elevation={2} sx={{ p: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderRadius: 1 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    {item.imageUrl && (
                      <Box 
                        sx={{ 
                          width: 50, 
                          height: 50, 
                          backgroundImage: `url(${item.imageUrl})`,
                          backgroundSize: 'cover',
                          backgroundPosition: 'center',
                          borderRadius: 1
                        }} 
                      />
                    )}
                    <Typography variant="h6" color="text.primary">
                      {item.name.charAt(0).toUpperCase() + item.name.slice(1)}
                    </Typography>
                  </Box>
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

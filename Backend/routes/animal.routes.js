import express from 'express';
import { addAnimal, getMyAnimals, updateAnimal, deleteAnimal, getAnimalHistory } from '../controllers/animal.controller.js';
import { protect } from '../middlewares/auth.middleware.js';

const router = express.Router();

// Route for getting all animals and adding a new one
router.route('/')
    .get(protect, getMyAnimals)
    .post(protect, addAnimal);

// Route for updating and deleting a specific animal by its ID
router.route('/:id')
    .put(protect, updateAnimal)
    .delete(protect, deleteAnimal);

// Route for getting animal history by ID
router.get('/:animalId/history', protect, getAnimalHistory);

export default router;
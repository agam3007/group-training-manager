import { Router } from 'express';
import { db } from '../data/db';
import { Training } from '../models/Training';

const router = Router();

// GET all trainings
router.get('/', (req, res) => {
  res.json(db.trainings);
});

// GET trainings by group
router.get('/group/:groupId', (req, res) => {
  const trainings = db.trainings.filter(t => t.groupId === req.params.groupId);
  res.json(trainings);
});

// GET trainings by athlete
router.get('/athlete/:athleteId', (req, res) => {
  const trainings = db.trainings.filter(t => t.athleteId === req.params.athleteId);
  res.json(trainings);
});

// POST new training
router.post('/', (req, res) => {
  const newTraining: Training = {
    id: Date.now().toString(),
    date: req.body.date,
    type: req.body.type,
    content: req.body.content,
    groupId: req.body.groupId,
    athleteId: req.body.athleteId
  };

  db.trainings.push(newTraining);
  res.status(201).json(newTraining);
});

export default router;
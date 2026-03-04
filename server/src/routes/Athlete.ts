import { Router } from 'express';
import { db } from '../data/db';
import { Athlete } from '../models/Athlete';

const router = Router();

// GET all athletes
router.get('/', (req, res) => {
  res.json(db.athletes);
});

// GET athletes by group
router.get('/group/:groupId', (req, res) => {
  const { groupId } = req.params;
  const athletes = db.athletes.filter(a => a.groupId === groupId);
  res.json(athletes);
});

// POST new athlete
router.post('/', (req, res) => {
  const newAthlete: Athlete = {
    id: Date.now().toString(),
    name: req.body.name,
    groupId: req.body.groupId,
    notes: req.body.notes
  };

  db.athletes.push(newAthlete);
  res.status(201).json(newAthlete);
});

export default router;
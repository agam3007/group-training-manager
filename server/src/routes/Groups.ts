import { Router } from 'express';
import { db } from '../data/db';
import { Group } from '../models/Group';

const router = Router();

router.get('/', (req, res) => {
  res.json(db.groups);
});

router.post('/', (req, res) => {
  const newGroup: Group = {
    id: Date.now().toString(),
    name: req.body.name,
    type: req.body.type
  };

  db.groups.push(newGroup);
  res.status(201).json(newGroup);
});

export default router;
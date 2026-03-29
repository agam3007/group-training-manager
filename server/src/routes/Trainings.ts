import { Router } from 'express'
import { readDb, writeDb } from '../utils/fileDb'
import { logger } from '../utils/logger'
import { Training } from '../models/Training'

const router = Router()

// GET all trainings
router.get('/',(req,res)=>{

  logger.info("GET /trainings")

  const db = readDb()

  res.json(db.trainings)

})

// GET trainings by group
router.get('/group/:groupId',(req,res)=>{

  const { groupId } = req.params

  logger.info(`GET trainings for group ${groupId}`)

  const db = readDb()

  const trainings =
    db.trainings.filter(
      (t:Training)=>t.groupId === groupId
    )

  res.json(trainings)

})

// GET trainings by athlete
router.get('/athlete/:athleteId',(req,res)=>{

  const { athleteId } = req.params

  logger.info(`GET trainings for athlete ${athleteId}`)

  const db = readDb()

  const trainings =
    db.trainings.filter(
      (t:Training)=>t.athleteId === athleteId
    )

  res.json(trainings)

})

// CREATE training
router.post('/',(req,res)=>{

  const db = readDb()

  const newTraining:Training = {

    id: Date.now().toString(),
    date: req.body.date,
    type: req.body.type,
    content: req.body.content,
    groupId: req.body.groupId,
    athleteId: req.body.athleteId

  }

  db.trainings.push(newTraining)

  writeDb(db)

  logger.info(
    `Training created for group ${newTraining.groupId}`
  )

  res.status(201).json(newTraining)

})

export default router
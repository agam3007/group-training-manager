import { Router } from 'express'
import { readDb, writeDb } from '../utils/fileDb'
import { logger } from '../utils/logger'
import { Group } from '../models/Group'

const router = Router()

// GET all groups
router.get('/', (req,res)=>{

  logger.info("GET /groups")

  const db = readDb()

  res.json(db.groups)

})

// CREATE group
router.post('/', (req,res)=>{

  const db = readDb()

  const newGroup: Group = {

    id: Date.now().toString(),
    name: req.body.name,
    type: req.body.type,
    athletes: req.body.athletes || [],
    schedule: req.body.schedule || []

  }

  db.groups.push(newGroup)

  writeDb(db)

  logger.info(`Group created: ${newGroup.name}`)

  res.status(201).json(newGroup)

})

// UPDATE group
router.put('/:id',(req,res)=>{

  const db = readDb()

  const { id } = req.params

  const index =
    db.groups.findIndex(
      (g:Group)=>g.id === id
    )

  if(index === -1){

    logger.error(`Group not found: ${id}`)

    return res.status(404).json({
      message:"Group not found"
    })

  }

  const updatedGroup:Group = {

    ...db.groups[index],
    ...req.body,
    id

  }

  db.groups[index] = updatedGroup

  writeDb(db)

  logger.info(`Group updated: ${updatedGroup.name}`)

  res.json(updatedGroup)

})

// DELETE group
router.delete('/:id',(req,res)=>{

  const db = readDb()

  const { id } = req.params

  const index =
    db.groups.findIndex(
      (g:Group)=>g.id === id
    )

  if(index === -1){

    logger.error(`Group not found for delete: ${id}`)

    return res.status(404).json({
      message:"Group not found"
    })

  }

  const removed =
    db.groups.splice(index,1)[0]

  writeDb(db)

  logger.info(`Group deleted: ${removed.name}`)

  res.json({
    message:"Group deleted",
    group:removed
  })

})

export default router
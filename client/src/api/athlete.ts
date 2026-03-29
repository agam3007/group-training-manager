import type { Athlete } from "../types/athlete"

const API = "http://localhost:3001/athletes"

export const getAthletes = async () => {

  const res = await fetch(API)

  return res.json()

}

export const getAthlete = async (id:string) => {

  const res = await fetch(`${API}/${id}`)
  return res.json()
}

export const createAthlete = async (data:Partial<Athlete>) => {

  const res = await fetch(API,{
    method:"POST",
    headers:{
      "Content-Type":"application/json"
    },
    body:JSON.stringify(data)
  })

  return res.json()

}

export const updateAthlete = async (id:string,data:Partial<Athlete>) => {

  const res = await fetch(`${API}/${id}`,{
    method:"PUT",
    headers:{
      "Content-Type":"application/json"
    },
    body:JSON.stringify(data)
  })

  return res.json()

}

export const deleteAthlete = async (id:string) => {

  await fetch(`${API}/${id}`,{
    method:"DELETE"
  })

}
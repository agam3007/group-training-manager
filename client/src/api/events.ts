import type { DayEvent } from "../types/dayEvent"

const API = "http://localhost:3001"

export async function getEvents():Promise<DayEvent[]>{

  const res = await fetch(`${API}/events`)
  return res.json()

}

export async function addEvent(event:DayEvent){

  await fetch(`${API}/events`,{

    method:"POST",

    headers:{
      "Content-Type":"application/json"
    },

    body:JSON.stringify(event)

  })

}

export async function updateEvent(event:DayEvent){

  await fetch(
    `http://localhost:3001/events/${event.id}`,
    {
      method:"PUT",
      headers:{
        "Content-Type":"application/json"
      },
      body:JSON.stringify(event)
    }
  )

}

export async function deleteEvent(id:string){

      await fetch(`http://localhost:3001/events/${id}`,{
    method:"DELETE"
  })
}
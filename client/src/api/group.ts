import type { Group } from "../types/group"

const API = "http://localhost:3001/groups"

export async function getGroup(id: string): Promise<Group> {

  const res = await fetch(`${API}/${id}`)

  if (!res.ok) {
    throw new Error("Failed to fetch group")
  }

  return res.json()

}

export async function getGroups(){

const res = await fetch(API)

return res.json()

}

export async function createGroup(group:any){

const res = await fetch(API,{

method:"POST",

headers:{
"Content-Type":"application/json"
},

body:JSON.stringify(group)

})

return res.json()

}

export async function updateGroup(id:string,data:Partial<Group>){

  const res = await fetch(`${API}/${id}`,{
    method:"PUT",
    headers:{ "Content-Type":"application/json" },
    body: JSON.stringify(data)
  })

  return res.json()

}

export async function deleteGroup(id:string){

  await fetch(`${API}/${id}`,{
    method:"DELETE"
  })

}
const API = "http://localhost:3001/athlete-groups"

export const getAthleteGroupsByAthleteId = async (athleteId: string) => {
  const res = await fetch(`${API}?athleteId=${athleteId}`)
  return res.json()
}

export const getAthleteGroupsByGroupId = async (groupId: string) => {
  const res = await fetch(`${API}?groupId=${groupId}`)
  return res.json()
}

export const createAthleteGroup = async (data:{
  athleteId:string
  groupId:string
}) => {

  const res = await fetch(API,{
    method:"POST",
    headers:{
      "Content-Type":"application/json"
    },
    body: JSON.stringify(data)
  })

  if(!res.ok){
    const err = await res.json()
    throw new Error(err.message || "Failed to create relation")
  }

  return res.json()
}

export const deleteAthleteGroup = async (id: string) => {
  await fetch(`${API}/${id}`, {
    method: "DELETE"
  })
}
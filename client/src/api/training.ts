const API = "http://localhost:3001/trainings"

export async function getTrainings(){

const res = await fetch(API)

return res.json()

}

export async function getTrainingsByGroup(groupId:string){

const res = await fetch(`${API}/group/${groupId}`)

return res.json()

}

export async function getTrainingsByAthlete(athleteId:string){

const res = await fetch(`${API}/athlete/${athleteId}`)

return res.json()

}

export async function createTraining(training:any){

const res = await fetch(API,{

method:"POST",

headers:{
"Content-Type":"application/json"
},

body:JSON.stringify(training)

})

return res.json()

}
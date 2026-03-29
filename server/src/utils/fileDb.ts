import fs from "fs"
import path from "path"

const dbPath = path.join(__dirname, "../db/database.json")

export function readDb(){

  const data = fs.readFileSync(dbPath,"utf-8")

  return JSON.parse(data)

}

export function writeDb(data:any){

  fs.writeFileSync(
    dbPath,
    JSON.stringify(data,null,2)
  )

}
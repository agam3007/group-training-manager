import Sidebar from "./SideBar"
import { Outlet } from "react-router-dom"

export default function AppLayout(){

  return(

    <div style={{display:"flex"}}>

      <Sidebar/>

      <div style={{flex:1, padding:"40px"}}>

        <Outlet/>

      </div>

    </div>

  )

}
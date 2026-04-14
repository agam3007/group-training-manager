import { Outlet, useLocation } from "react-router-dom";
import Sidebar from "../sideBar/SideBar";
import "./AppLayout.css";

export default function AppLayout() {
  const location = useLocation();

  const isNoPaddingPage = location.pathname.startsWith("/schedule");

  return (
    <div className="app-layout">
      <Sidebar />

      <div className={`app-content ${isNoPaddingPage ? "no-padding" : ""}`}>
        <Outlet />
      </div>
    </div>
  );
}
import { Outlet, useLocation } from "react-router-dom";
import Sidebar from "../sideBar/SideBar";
import AppHeader from "../header/AppHeader";
import "./AppLayout.css";

export default function AppLayout() {
  const location = useLocation();

  const isNoPaddingPage = location.pathname.startsWith("/schedule") || location.pathname.startsWith("/training-plans/");

  return (
    <div className="app-layout">
      <Sidebar />

      <div className="app-main">
        <AppHeader />
        <div className={`app-content ${isNoPaddingPage ? "no-padding" : ""}`}>
          <Outlet />
        </div>
      </div>
    </div>
  );
}
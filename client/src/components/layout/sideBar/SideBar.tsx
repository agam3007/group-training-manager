import { Home, Calendar, Users, Dumbbell, User } from "lucide-react";
import { NavLink } from "react-router-dom";
import "./Sidebar.css";

export default function Sidebar() {
  return (
    <div className="sidebar">
      <div className="sidebar-logo">
        <Dumbbell size={28} />
      </div>

      <div className="sidebar-menu">
        <NavLink
          to="/"
          className={({ isActive }) =>
            isActive ? "sidebar-item active" : "sidebar-item"
          }
        >
          <Home size={22} />
          <span className="tooltip">Dashboard</span>
        </NavLink>

        <NavLink
          to="/schedule"
          className={({ isActive }) =>
            isActive ? "sidebar-item active" : "sidebar-item"
          }
        >
          <Calendar size={22} />
          <span className="tooltip">Schedule</span>
        </NavLink>

        <NavLink
          to="/groups"
          className={({ isActive }) =>
            isActive ? "sidebar-item active" : "sidebar-item"
          }
        >
          <Users size={22} />
          <span className="tooltip">Groups</span>
        </NavLink>

        <NavLink
          to="/athletes"
          className={({ isActive }) =>
            isActive ? "sidebar-item active" : "sidebar-item"
          }
        >
          <User size={22} />
          <span className="tooltip">Athletes</span>
        </NavLink>
      </div>
    </div>
  );
}

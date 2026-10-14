import { Home, Calendar, Users, Dumbbell, User, Folder, LogOut, Shield } from "lucide-react";
import { NavLink, useNavigate } from "react-router-dom";
import "./SideBar.css";
import { useAuth } from "@/auth/AuthContext";

export default function Sidebar() {
  const { session, profile, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate("/login");
  };

  return (
    <div className="sidebar">
      <div className="sidebar-logo">
        <Dumbbell size={28}/>
      </div>

      <div className="sidebar-menu">
        <NavLink
          to="/"
          className={({isActive}) =>
            isActive ? "sidebar-item active" : "sidebar-item"
          }
        >
          <Home size={22}/>
          <span className="tooltip">Dashboard</span>
        </NavLink>

        <NavLink
          to="/schedule"
          className={({isActive}) =>
            isActive ? "sidebar-item active" : "sidebar-item"
          }
        >
          <Calendar size={22}/>
          <span className="tooltip">Schedule</span>
        </NavLink>

        <NavLink
          to="/groups"
          className={({isActive}) =>
            isActive ? "sidebar-item active" : "sidebar-item"
          }
        >
          <Users size={22}/>
          <span className="tooltip">Groups</span>
        </NavLink>

        <NavLink
          to="/athletes"
          className={({isActive}) =>
            isActive ? "sidebar-item active" : "sidebar-item"
          }
        >
          <User size={22}/>
          <span className="tooltip">Athletes</span>
        </NavLink>

        <NavLink
          to="/training-plans"
          className={({isActive}) =>
            isActive ? "sidebar-item active" : "sidebar-item"
          }
        >
          <Folder size={22}/>
          <span className="tooltip">Training Plans</span>
        </NavLink>

        {profile?.isPlatformAdmin && (
          <NavLink
            to="/admin"
            className={({isActive}) =>
              isActive ? "sidebar-item active" : "sidebar-item"
            }
          >
            <Shield size={22}/>
            <span className="tooltip">Platform Admin</span>
          </NavLink>
        )}
      </div>

      <div className="sidebar-user">
        <div className="sidebar-user-email" title={session?.user?.email ?? ""}>
          {session?.user?.email}
        </div>
        <button className="sidebar-logout" onClick={handleLogout}>
          <LogOut size={18}/>
          <span className="tooltip">Sign out</span>
        </button>
      </div>
    </div>
  );
}
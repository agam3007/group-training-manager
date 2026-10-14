import { Home, Calendar, Users, Dumbbell, User, Folder, LogOut, Shield } from "lucide-react";
import { NavLink, useNavigate } from "react-router-dom";
import "./SideBar.css";
import { useAuth } from "@/auth/AuthContext";
import { useLang } from "@/i18n/LanguageContext";

export default function Sidebar() {
  const { session, profile, logout } = useAuth();
  const { t } = useLang();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate("/login");
  };

  const items = [
    { to: "/", icon: Home, label: t("nav.dashboard") },
    { to: "/schedule", icon: Calendar, label: t("nav.schedule") },
    { to: "/groups", icon: Users, label: t("nav.groups") },
    { to: "/athletes", icon: User, label: t("nav.athletes") },
    { to: "/training-plans", icon: Folder, label: t("nav.trainingPlans") },
    ...(profile?.isPlatformAdmin
      ? [{ to: "/admin", icon: Shield, label: t("nav.admin") }]
      : []),
  ];

  return (
    <div className="sidebar">
      <div className="sidebar-logo">
        <Dumbbell size={28}/>
      </div>

      <div className="sidebar-menu">
        {items.map(item => (
          <NavLink
            key={item.to}
            to={item.to}
            className={({isActive}) =>
              isActive ? "sidebar-item active" : "sidebar-item"
            }
          >
            <item.icon size={22}/>
            <span className="tooltip">{item.label}</span>
          </NavLink>
        ))}
      </div>

      <div className="sidebar-user">
        <div className="sidebar-user-email" title={session?.user?.email ?? ""}>
          {session?.user?.email}
        </div>
        <button className="sidebar-logout" onClick={handleLogout} title={t("nav.signOut")}>
          <LogOut size={18}/>
        </button>
      </div>
    </div>
  );
}
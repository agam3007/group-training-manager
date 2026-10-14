import { useEffect, useState } from "react";
import { ChevronDown, Building2, Languages } from "lucide-react";
import { useAuth } from "@/auth/AuthContext";
import { getSelectedTenant, setSelectedTenant } from "@/auth/attachAuth";
import { useLang } from "@/i18n/LanguageContext";
import "./AppHeader.css";

interface Tenant {
  id: string;
  name: string;
  tenant_type: string;
  plan: string;
}

export default function AppHeader() {
  const { session } = useAuth();
  const { lang, toggle } = useLang();
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [selected, setSelected] = useState<Tenant | null>(null);
  const [dropdownOpen, setDropdownOpen] = useState(false);

  useEffect(() => {
    if (!session) return;
    (async () => {
      try {
        const res = await fetch(`${import.meta.env.VITE_API_URL ?? "http://localhost:3001"}/auth/tenants`);
        const data = await res.json();
        setTenants(data);
        const saved = getSelectedTenant();
        const current = data.find((t: Tenant) => t.id === saved) ?? data[0];
        if (current) {
          setSelected(current);
          setSelectedTenant(current.id);
        }
      } catch {
        console.error("Failed to load tenants");
      }
    })();
  }, [session?.user?.id]);

  const selectTenant = (tenant: Tenant) => {
    setSelected(tenant);
    setSelectedTenant(tenant.id);
    setDropdownOpen(false);
    // Reload the page so all data refreshes with the new tenant
    window.location.reload();
  };

  if (!tenants.length) return null;

  return (
    <div className="app-header">
      <div className="header-left">
        <div className="tenant-switcher">
          <Building2 size={16} className="tenant-icon" />
          <button
            className="tenant-select"
            onClick={() => setDropdownOpen(!dropdownOpen)}
          >
            <span className="tenant-name">{selected?.name}</span>
            <ChevronDown size={14} className="tenant-arrow" />
          </button>
          {dropdownOpen && tenants.length > 1 && (
            <div className="tenant-dropdown">
              {tenants.map((t) => (
                <div
                  key={t.id}
                  className={`tenant-option ${t.id === selected?.id ? "active" : ""}`}
                  onClick={() => selectTenant(t)}
                >
                  <span>{t.name}</span>
                  <span className="tenant-type">{t.tenant_type}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
      <div className="header-right">
        <button className="lang-toggle" onClick={toggle} type="button">
          <Languages size={18} />
          <span>{lang === "he" ? "EN" : "עב"}</span>
        </button>
        <span className="user-email">{session?.user?.email}</span>
      </div>
    </div>
  );
}
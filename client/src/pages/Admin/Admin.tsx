import { useEffect, useState } from "react";
import { Building2, Plus, Trash2, Edit3 } from "lucide-react";
import { useAuth } from "@/auth/AuthContext";
import "./Admin.css";

const API = import.meta.env.VITE_API_URL ?? "http://localhost:3001";

interface Tenant {
  id: string;
  name: string;
  tenant_type: string;
  plan: string;
  timezone: string;
  athleteCount?: number;
}

interface ModalState {
  open: boolean;
  mode: "create" | "edit";
  tenant: Tenant | null;
  name: string;
  tenantType: string;
  plan: string;
}

export default function Admin() {
  const { profile } = useAuth();
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState<ModalState>({
    open: false,
    mode: "create",
    tenant: null,
    name: "",
    tenantType: "club",
    plan: "free",
  });
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);

  const load = async () => {
    try {
      const res = await fetch(`${API}/auth/platform/tenants`);
      const data = await res.json();
      setTenants(data);
    } catch {
      console.error("Failed to load tenants");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const openCreate = () => {
    setModal({ open: true, mode: "create", tenant: null, name: "", tenantType: "club", plan: "free" });
  };

  const openEdit = (t: Tenant) => {
    setModal({ open: true, mode: "edit", tenant: t, name: t.name, tenantType: t.tenant_type, plan: t.plan });
  };

  const save = async () => {
    if (!modal.name.trim()) return;

    try {
      if (modal.mode === "create") {
        await fetch(`${API}/auth/platform/tenants`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name: modal.name, tenantType: modal.tenantType }),
        });
      } else if (modal.tenant) {
        await fetch(`${API}/auth/platform/tenants/${modal.tenant.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name: modal.name, tenantType: modal.tenantType, plan: modal.plan }),
        });
      }
      setModal(m => ({ ...m, open: false }));
      load();
    } catch {
      alert("Failed to save tenant");
    }
  };

  const remove = async (id: string) => {
    try {
      await fetch(`${API}/auth/platform/tenants/${id}`, { method: "DELETE" });
      setConfirmDelete(null);
      load();
    } catch {
      alert("Failed to delete tenant");
    }
  };

  if (!profile?.isPlatformAdmin) {
    return <div style={{ padding: 40, color: "#666" }}>You need platform admin access to view this page.</div>;
  }

  return (
    <div className="admin-page">
      <div className="admin-header">
        <h1>
          <Building2 size={24} /> Platform Administration
        </h1>
        <button className="admin-add-btn" onClick={openCreate}>
          <Plus size={18} /> New Tenant
        </button>
      </div>

      {loading ? (
        <div>Loading…</div>
      ) : (
        <div className="tenants-grid">
          {tenants.map(t => (
            <div key={t.id} className="tenant-card">
              <div className="tenant-card-header">
                <h3>{t.name}</h3>
                <span className={`tenant-plan ${t.plan}`}>{t.plan}</span>
              </div>
              <div className="tenant-card-meta">
                <span className="tenant-type">{t.tenant_type}</span>
                <span className="tenant-athletes">{t.athleteCount ?? 0} athletes</span>
              </div>
              <div className="tenant-card-actions">
                <button className="tenant-action" onClick={() => openEdit(t)} title="Edit">
                  <Edit3 size={16} />
                </button>
                <button
                  className="tenant-action danger"
                  onClick={() => setConfirmDelete(t.id)}
                  title="Delete"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {modal.open && (
        <div className="admin-modal-overlay" onClick={() => setModal(m => ({ ...m, open: false }))}>
          <div className="admin-modal" onClick={e => e.stopPropagation()}>
            <h3>{modal.mode === "create" ? "New Tenant" : "Edit Tenant"}</h3>

            <div className="admin-field">
              <label>Name</label>
              <input
                value={modal.name}
                onChange={e => setModal(m => ({ ...m, name: e.target.value }))}
                placeholder="Club name"
              />
            </div>

            <div className="admin-field">
              <label>Type</label>
              <select
                value={modal.tenantType}
                onChange={e => setModal(m => ({ ...m, tenantType: e.target.value }))}
              >
                <option value="club">Club</option>
                <option value="practice">Practice (D23)</option>
              </select>
            </div>

            {modal.mode === "edit" && (
              <div className="admin-field">
                <label>Plan</label>
                <select
                  value={modal.plan}
                  onChange={e => setModal(m => ({ ...m, plan: e.target.value }))}
                >
                  <option value="free">Free</option>
                  <option value="pro">Pro</option>
                </select>
              </div>
            )}

            <div className="admin-modal-actions">
              <button onClick={() => setModal(m => ({ ...m, open: false }))}>Cancel</button>
              <button className="primary" onClick={save}>
                {modal.mode === "create" ? "Create" : "Save"}
              </button>
            </div>
          </div>
        </div>
      )}

      {confirmDelete && (
        <div className="admin-modal-overlay" onClick={() => setConfirmDelete(null)}>
          <div className="admin-modal" onClick={e => e.stopPropagation()}>
            <h3>Delete Tenant</h3>
            <p>
              This will permanently delete <b>{tenants.find(t => t.id === confirmDelete)?.name}</b> and
              ALL its data (athletes, groups, trainings, payments, etc.).
              This action cannot be undone.
            </p>
            <div className="admin-modal-actions">
              <button onClick={() => setConfirmDelete(null)}>Cancel</button>
              <button className="danger" onClick={() => remove(confirmDelete)}>Delete Forever</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
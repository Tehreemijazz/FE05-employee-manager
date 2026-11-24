import { useEffect, useMemo, useState } from "react";
import {
  fetchEmployees, createEmployee, updateEmployee, deleteEmployee,
} from "./api/employees";
import { getErrorMessage } from "./api/client";

const PAGE_SIZE = Number(import.meta.env.VITE_PAGE_SIZE) || 10;
const EMPTY = { firstName: "", lastName: "", email: "", phone: "", age: "", department: "", title: "" };

export default function App() {
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [saving, setSaving] = useState(false);

  const [search, setSearch] = useState("");
  const [department, setDepartment] = useState("");
  const [sort, setSort] = useState({ key: "firstName", dir: "asc" });
  const [page, setPage] = useState(1);

  const [form, setForm] = useState(EMPTY);
  const [editingId, setEditingId] = useState(null);

  const load = async () => {
    setLoading(true);
    setError("");
    try {
      setEmployees(await fetchEmployees());
    } catch (e) {
      setError(getErrorMessage(e));
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => { load(); }, []);

  const departments = useMemo(
    () => [...new Set(employees.map((e) => e.department).filter(Boolean))].sort(),
    [employees]
  );

  // Search -> filter -> sort -> paginate, all on the client.
  const processed = useMemo(() => {
    const q = search.trim().toLowerCase();
    const rows = employees.filter((e) =>
      (!department || e.department === department) &&
      (!q || `${e.firstName} ${e.lastName} ${e.email} ${e.title}`.toLowerCase().includes(q))
    );
    const { key, dir } = sort;
    rows.sort((a, b) => {
      const r = typeof a[key] === "number" ? a[key] - b[key] : String(a[key]).localeCompare(String(b[key]));
      return dir === "asc" ? r : -r;
    });
    return rows;
  }, [employees, search, department, sort]);

  const totalPages = Math.max(1, Math.ceil(processed.length / PAGE_SIZE));
  const current = Math.min(page, totalPages);
  const visible = processed.slice((current - 1) * PAGE_SIZE, current * PAGE_SIZE);

  const toggleSort = (key) => {
    setSort((s) => ({ key, dir: s.key === key && s.dir === "asc" ? "desc" : "asc" }));
  };
  const arrow = (key) => (sort.key === key ? (sort.dir === "asc" ? " ▲" : " ▼") : "");

  const onField = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const submit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError("");
    setNotice("");
    const payload = { ...form, age: Number(form.age) };
    try {
      if (editingId) {
        const target = employees.find((x) => x.id === editingId);
        // Records created in this session only exist locally (the demo API doesn't persist).
        const saved = target.local ? { ...target, ...payload } : await updateEmployee(editingId, payload);
        setEmployees((list) => list.map((x) => (x.id === editingId ? { ...saved, local: target.local } : x)));
        setNotice("Employee updated.");
      } else {
        const created = await createEmployee(payload);
        setEmployees((list) => [{ ...created, id: Date.now() }, ...list]);
        setNotice("Employee added.");
      }
      setForm(EMPTY);
      setEditingId(null);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  const edit = (emp) => {
    setEditingId(emp.id);
    setForm({ ...EMPTY, ...emp, age: String(emp.age) });
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const remove = async (emp) => {
    if (!window.confirm(`Delete ${emp.firstName} ${emp.lastName}?`)) return;
    setError("");
    setNotice("");
    try {
      if (!emp.local) await deleteEmployee(emp.id);
      setEmployees((list) => list.filter((x) => x.id !== emp.id));
      setNotice("Employee deleted.");
    } catch (err) {
      setError(getErrorMessage(err));
    }
  };

  return (
    <main className="wrap">
      <h1>Employees</h1>

      {error && (
        <div className="banner error" role="alert">
          {error} {!employees.length && <button onClick={load}>Retry</button>}
        </div>
      )}
      {notice && <div className="banner ok" role="status">{notice}</div>}

      <form className="form" onSubmit={submit}>
        <h2>{editingId ? "Edit employee" : "Add employee"}</h2>
        <div className="grid">
          <input name="firstName" placeholder="First name" value={form.firstName} onChange={onField} required />
          <input name="lastName" placeholder="Last name" value={form.lastName} onChange={onField} required />
          <input name="email" type="email" placeholder="Email" value={form.email} onChange={onField} required />
          <input name="phone" placeholder="Phone" value={form.phone} onChange={onField} />
          <input name="age" type="number" min="18" max="100" placeholder="Age" value={form.age} onChange={onField} required />
          <input name="department" placeholder="Department" value={form.department} onChange={onField} required />
          <input name="title" placeholder="Job title" value={form.title} onChange={onField} />
        </div>
        <div className="actions">
          <button type="submit" disabled={saving}>
            {saving ? "Saving…" : editingId ? "Save changes" : "Add employee"}
          </button>
          {editingId && (
            <button type="button" className="ghost" onClick={() => { setEditingId(null); setForm(EMPTY); }}>
              Cancel
            </button>
          )}
        </div>
      </form>

      <div className="toolbar">
        <input
          type="search" placeholder="Search name, email or title"
          value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }}
        />
        <select value={department} onChange={(e) => { setDepartment(e.target.value); setPage(1); }}>
          <option value="">All departments</option>
          {departments.map((d) => <option key={d}>{d}</option>)}
        </select>
        <span className="count">{processed.length} found</span>
      </div>

      {loading ? (
        <p className="state">Loading employees…</p>
      ) : (
        <div className="tablewrap">
          <table>
            <thead>
              <tr>
                {[["firstName", "First name"], ["lastName", "Last name"], ["email", "Email"],
                  ["department", "Department"], ["title", "Title"], ["age", "Age"]].map(([k, label]) => (
                  <th key={k} onClick={() => toggleSort(k)} className="sortable">{label}{arrow(k)}</th>
                ))}
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {visible.map((emp) => (
                <tr key={emp.id}>
                  <td>{emp.firstName}</td><td>{emp.lastName}</td><td>{emp.email}</td>
                  <td>{emp.department}</td><td>{emp.title}</td><td>{emp.age}</td>
                  <td className="row-actions">
                    <button className="ghost" onClick={() => edit(emp)}>Edit</button>
                    <button className="danger" onClick={() => remove(emp)}>Delete</button>
                  </td>
                </tr>
              ))}
              {!visible.length && (
                <tr><td colSpan="7" className="state">No employees match your search.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      <nav className="pager" aria-label="Pagination">
        <button className="ghost" disabled={current === 1} onClick={() => setPage(current - 1)}>Previous</button>
        <span>Page {current} of {totalPages}</span>
        <button className="ghost" disabled={current === totalPages} onClick={() => setPage(current + 1)}>Next</button>
      </nav>
    </main>
  );
}

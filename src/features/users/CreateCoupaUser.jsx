import { useState } from "react";

export default function CreateCoupaUser() {
  const [form, setForm] = useState({
    login: "",
    email: "",
    firstname: "",
    lastname: ""
  });
  const [log, setLog] = useState("");

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  const submit = async (e) => {
    e.preventDefault();
    setLog("Creating user in Coupa…");

    try {
      const res = await fetch("/api/create-coupa-user", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });

      const data = await res.json().catch(() => ({}));
      if (res.ok) {
        setLog(`✅ Created. Response:\n${JSON.stringify(data, null, 2)}`);
      } else {
        setLog(`❌ Error ${res.status}:\n${JSON.stringify(data, null, 2)}`);
      }
    } catch (err) {
      setLog(`❌ Network/Unexpected error:\n${String(err)}`);
    }
  };

  return (
    <div style={styles.card}>
      <h3 style={{ margin: 0, marginBottom: 10 }}>Create Coupa User</h3>
      <form onSubmit={submit} style={styles.form}>
        <label style={styles.label}>
          Login
          <input style={styles.input} value={form.login} onChange={set("login")} required />
        </label>
        <label style={styles.label}>
          Email
          <input style={styles.input} type="email" value={form.email} onChange={set("email")} required />
        </label>
        <label style={styles.label}>
          First name
          <input style={styles.input} value={form.firstname} onChange={set("firstname")} required />
        </label>
        <label style={styles.label}>
          Last name
          <input style={styles.input} value={form.lastname} onChange={set("lastname")} required />
        </label>

        <button type="submit" style={styles.button}>Create</button>
      </form>

      <textarea readOnly value={log} style={styles.log} />
    </div>
  );
}

const styles = {
  card: {
    padding: 16,
    background: "#fff",
    border: "1px solid #e6e8eb",
    borderRadius: 8,
    maxWidth: 520
  },
  form: { display: "grid", gap: 10 },
  label: { display: "grid", gap: 6, fontSize: 14 },
  input: { padding: "8px 10px", borderRadius: 6, border: "1px solid #cbd5e1" },
  button: {
    marginTop: 6, padding: "10px 12px", background: "#0ea5e9",
    color: "#fff", border: "none", borderRadius: 6, cursor: "pointer"
  },
  log: {
    width: "100%", height: 180, marginTop: 10, padding: 8,
    borderRadius: 6, border: "1px solid #cbd5e1", fontFamily: "monospace", fontSize: 12, whiteSpace: "pre"
  }
};
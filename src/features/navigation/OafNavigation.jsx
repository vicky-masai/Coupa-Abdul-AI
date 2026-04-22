// src/features/navigation/OafNavigation.jsx
import { useEffect, useState } from "react";
import { useOaf } from "../oaf/useOaf";

// Direct client calls for diagnostics & window tests
import {
  getUserContext,
  getPageContext,
  ensureOafClient,
  getOafAppEventsSync,
  setSize,
  moveAppToLocation,
} from "../oaf/oafClient";
import oafConfig from "../oaf/oafConfig";

export default function OafNavigation() {
  const [input, setInput] = useState("/requisition_headers");
  const [log, setLog] = useState("Ready.");
  const { oafNavigatePath } = useOaf();

  const append = (line) => setLog((prev) => (prev ? `${prev}\n${line}` : line));

  // Subscribe to OAF host events (some builds emit errors/info via events)
  useEffect(() => {
    let cancelled = false;
    const evRef = { current: null };
    const handler = (evt) => {
      console.log("[OAF EVENT]", evt?.type || evt, evt);
      append(`[OAF EVENT] ${evt?.type || "message"} ${JSON.stringify(evt)}`);
    };

    (async () => {
      await ensureOafClient();
      if (cancelled) return;
      const ev = getOafAppEventsSync();
      evRef.current = ev;
      if (ev?.on) {
        ev.on("error", handler);
        ev.on("oafError", handler);
        ev.on("message", handler);
        ev.on("subscribedAttributeResponse", handler);
      }
    })();

    return () => {
      cancelled = true;
      const ev = evRef.current;
      if (ev?.off) {
        ev.off("error", handler);
        ev.off("oafError", handler);
        ev.off("message", handler);
        ev.off("subscribedAttributeResponse", handler);
      }
    };
  }, []);

  // --- Diagnostics: prove we are embedded and permitted ---
  const runDiagnostics = async () => {
    setLog("Running diagnostics…");
    try {
      const uc = await getUserContext();
      append("getUserContext:");
      append(JSON.stringify(uc, null, 2));
    } catch (e) {
      append("getUserContext threw:");
      append(String(e?.message || e));
    }

    try {
      const pc = await getPageContext();
      append("getPageContext:");
      append(JSON.stringify(pc, null, 2));
    } catch (e) {
      append("getPageContext threw:");
      append(String(e?.message || e));
    }
  };

  // --- Window management (proves host permissions are honored) ---
  const testResize = async () => {
    try {
      append("Resizing iFrame to 500x360 (host-side) …");
      const r = await setSize(500, 360);
      append(`setSize => ${JSON.stringify(r, null, 2)}`);
    } catch (e) {
      append(`setSize threw => ${String(e?.message || e)}`);
    }
  };

  const testMove = async () => {
    try {
      append("Moving iFrame to top-left (host-side) …");
      const r = await moveAppToLocation(50, 30, false);
      append(`moveToLocation => ${JSON.stringify(r, null, 2)}`);
    } catch (e) {
      append(`moveToLocation threw => ${String(e?.message || e)}`);
    }
  };

  // --- Navigate button action ---
  /** @param {string} [path] — use when firing from quick-path before `input` state has updated */
  const handleNavigate = async (path) => {
    const target = (path ?? input).trim();
    if (!target) {
      append("Navigate: enter a path first.");
      return;
    }
    append(`Navigating to: ${target}`);
    const resp = await oafNavigatePath(target);
    append("navigateToPath response:");
    append(JSON.stringify(resp, null, 2));
  };

  // Show current URL and the effective config we passed to the SDK
  const showConfig = () => {
    append("[LOCATION HREF]:");
    append(window.location.href);
    append("[OAF CONFIG]:");
    append(JSON.stringify(oafConfig, null, 2));
  };

  // Show parent window details (helps confirm we are embedded under the right host)
  const showParentAndOrigin = () => {
    const lines = [
      `[window.origin]: ${window.origin}`,
      `[document.referrer]: ${document.referrer}`,
      `[iframe?]: ${window.top === window ? "no (top/self)" : "yes (embedded)"}`
    ];
    append(lines.join("\n"));
  };

  const quickPaths = [
    "/requisition_headers",
    "/order_headers/1",
    "/purchase_orders",
    "/suppliers/new",
    "/invoices?status=pending",
  ];

  return (
    <div style={styles.card}>
      <h3 style={styles.title}>OAF Navigation</h3>

      <div style={styles.row}>
        <input
          style={styles.input}
          placeholder="Enter Coupa path (e.g., /requisition_headers)"
          value={input}
          onChange={(e) => setInput(e.target.value)}
        />
        <button style={styles.button} onClick={handleNavigate}>
          Navigate to Path
        </button>
      </div>

      <div style={{ marginTop: 8 }}>
        <strong>Quick tests:</strong>
        <div style={styles.testRow}>
          {quickPaths.map((p) => (
            <button
              key={p}
              style={styles.testBtn}
              onClick={() => {
                setInput(p);
                void handleNavigate(p);
              }}
            >
              {p}
            </button>
          ))}
        </div>
      </div>

      <div style={{ marginTop: 8, display: "flex", gap: 8, flexWrap: "wrap" }}>
        <button style={styles.buttonGhost} onClick={runDiagnostics}>
          Run Diagnostics
        </button>
        <button style={styles.buttonGhost} onClick={testResize}>
          Test Resize
        </button>
        <button style={styles.buttonGhost} onClick={testMove}>
          Test Move
        </button>
        <button style={styles.buttonGhost} onClick={showConfig}>
          Show Config & URL
        </button>
        <button style={styles.buttonGhost} onClick={showParentAndOrigin}>
          Show Parent & Origin
        </button>
      </div>

      <textarea
        readOnly
        value={log}
        style={styles.log}
        aria-label="Diagnostics log"
      />
    </div>
  );
}

const styles = {
  card: {
    padding: 16,
    background: "#fff",
    border: "1px solid #e6e8eb",
    borderRadius: 8,
  },
  title: { margin: 0, marginBottom: 12 },
  row: { display: "flex", gap: 8, alignItems: "center" },
  input: {
    flex: 1,
    padding: "8px 10px",
    border: "1px solid #c9cdd2",
    borderRadius: 6,
  },
  button: {
    padding: "8px 12px",
    background: "#0d6efd",
    color: "#fff",
    border: "none",
    borderRadius: 6,
    cursor: "pointer",
  },
  buttonGhost: {
    padding: "8px 12px",
    background: "transparent",
    color: "#0d6efd",
    border: "1px solid #0d6efd",
    borderRadius: 6,
    cursor: "pointer",
  },
  testRow: { display: "flex", flexWrap: "wrap", gap: 8, marginTop: 6 },
  testBtn: {
    padding: "6px 10px",
    background: "#f3f4f6",
    border: "1px solid #d1d5db",
    borderRadius: 6,
    cursor: "pointer",
  },
  log: {
    width: "100%",
    height: 260,
    marginTop: 12,
    padding: 10,
    border: "1px solid #d1d5db",
    borderRadius: 6,
    fontFamily: "monospace",
    fontSize: 12,
    whiteSpace: "pre",
  },
};
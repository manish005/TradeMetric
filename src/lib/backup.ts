"use client";

const DATA_KEYS = [
  "trademetric:journal",
  "trademetric:target",
  "trademetric:balance",
  "trademetric:goals",
];

export type BackupPayload = {
  app: "trademetric";
  exportedAt: string;
  uid: string | null;
  data: Record<string, unknown>;
};

export function buildBackup(uid: string | null, prefsKey?: string): BackupPayload {
  const data: Record<string, unknown> = {};
  for (const key of DATA_KEYS) {
    try {
      const raw = localStorage.getItem(key);
      if (raw) data[key] = JSON.parse(raw);
    } catch {
      // skip
    }
  }
  if (prefsKey) {
    try {
      const raw = localStorage.getItem(prefsKey);
      if (raw) data[prefsKey] = JSON.parse(raw);
    } catch {
      // skip
    }
  }
  return { app: "trademetric", exportedAt: new Date().toISOString(), uid, data };
}

export function downloadBackup(uid: string | null) {
  const payload = buildBackup(uid);
  const blob = new Blob([JSON.stringify(payload, null, 2)], {
    type: "application/json",
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `trademetric-backup-${new Date().toISOString().slice(0, 10)}.json`;
  a.click();
  URL.revokeObjectURL(url);
}

export function importBackup(jsonText: string): { ok: boolean; written: string[] } {
  try {
    const raw = JSON.parse(jsonText) as Partial<BackupPayload>;
    if (raw.app !== "trademetric" || !raw.data) {
      return { ok: false, written: [] };
    }
    const written: string[] = [];
    for (const [key, value] of Object.entries(raw.data)) {
      if (key.startsWith("trademetric:")) {
        localStorage.setItem(key, JSON.stringify(value));
        written.push(key);
      }
    }
    return { ok: true, written };
  } catch {
    return { ok: false, written: [] };
  }
}

export function fullBackup(uid: string | null): BackupPayload {
  const prefsKey = uid ? `trademetric:prefs:${uid}` : undefined;
  return buildBackup(uid, prefsKey);
}
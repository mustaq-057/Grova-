/**
 * Black-box API smoke test — hits every authenticated route group.
 * Run: pnpm --filter @workspace/scripts exec tsx ./src/api-smoke-test.ts
 */
const BASE = process.env.API_BASE ?? "http://127.0.0.1:5001/api";
const COUPLE_CODE = process.env.COUPLE_CODE ?? "grova2024";
const PRIMARY_EMAIL = process.env.PRIMARY_AUTH_EMAIL ?? "";
const PRIMARY_PASSWORD = process.env.PRIMARY_AUTH_PASSWORD_1 ?? process.env.PRIMARY_AUTH_PASSWORDS?.split(",")[0] ?? "";

type Result = { name: string; ok: boolean; status?: number; detail?: string };

const results: Result[] = [];

function record(name: string, ok: boolean, status?: number, detail?: string) {
  results.push({ name, ok, status, detail });
  const mark = ok ? "PASS" : "FAIL";
  console.log(`${mark}  ${name}${status != null ? ` (${status})` : ""}${detail ? ` — ${detail}` : ""}`);
}

async function req(
  path: string,
  opts: RequestInit & { token?: string; csrf?: string } = {},
): Promise<Response> {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(opts.headers as Record<string, string>),
  };
  if (opts.token) headers.Authorization = `Bearer ${opts.token}`;
  if (opts.csrf) headers["X-CSRF-Token"] = opts.csrf;
  const { token: _t, csrf: _c, ...init } = opts;
  return fetch(`${BASE}${path}`, { ...init, credentials: "include", headers });
}

async function main() {
  console.log(`\nAPI smoke test → ${BASE}\n`);

  const health = await fetch(`${BASE}/healthz`);
  record("healthz", health.ok, health.status);

  if (PRIMARY_EMAIL && PRIMARY_PASSWORD) {
    const primaryRes = await req("/auth/primary-login", {
      method: "POST",
      body: JSON.stringify({ email: PRIMARY_EMAIL, password: PRIMARY_PASSWORD }),
    });
    record("auth/primary-login", primaryRes.ok, primaryRes.status, primaryRes.ok ? undefined : (await primaryRes.text()).slice(0, 120));
    if (!primaryRes.ok) {
      printSummary();
      process.exit(1);
    }
  }

  const loginRes = await req("/auth/login", {
    method: "POST",
    body: JSON.stringify({ userId: "me", code: COUPLE_CODE }),
  });
  if (!loginRes.ok) {
    record("auth/login", false, loginRes.status, await loginRes.text());
    printSummary();
    process.exit(1);
  }
  const session = (await loginRes.json()) as {
    token: string;
    csrfToken: string;
  };
  record("auth/login", true, loginRes.status);
  const { token, csrfToken: csrf } = session;

  const authed: Array<{ name: string; path: string; method?: string; body?: unknown }> = [
    { name: "auth/profiles", path: "/auth/profiles" },
    { name: "messages GET", path: "/messages" },
    { name: "duas GET", path: "/duas" },
    { name: "tasks GET", path: "/tasks" },
    { name: "calendar/events GET", path: "/calendar/events" },
    { name: "checkins GET", path: "/checkins" },
    { name: "milestones GET", path: "/milestones" },
    { name: "secret-notes GET", path: "/secret-notes" },
    { name: "couple/prefs GET", path: "/couple/prefs" },
    { name: "couple/notes GET", path: "/couple/notes" },
    { name: "couple/activity GET", path: "/couple/activity" },
    { name: "posts GET", path: "/posts" },
    { name: "stories GET", path: "/stories" },
    { name: "pin GET", path: "/pin/me" },
    { name: "hidden-messages GET", path: "/hidden-messages/me" },
    { name: "schedule GET", path: "/schedule/me" },
    { name: "presence GET", path: "/presence" },
    { name: "profile/users GET", path: "/users" },
  ];

  for (const t of authed) {
    const res = await req(t.path, { token, csrf, method: t.method ?? "GET", body: t.body ? JSON.stringify(t.body) : undefined });
    record(t.name, res.ok, res.status, res.ok ? undefined : (await res.text()).slice(0, 120));
  }

  // Write flows (create + cleanup where possible)
  const msgRes = await req("/messages", {
    method: "POST",
    token,
    csrf,
    body: JSON.stringify({
      senderId: "me",
      text: `[smoke] ${Date.now()}`,
      type: "text",
      timestamp: new Date().toISOString(),
    }),
  });
  record("messages POST", msgRes.ok, msgRes.status);
  let messageId: string | undefined;
  if (msgRes.ok) {
    const body = (await msgRes.json()) as { id?: string; message?: { id: string } };
    messageId = body.id ?? body.message?.id;
  }

  if (messageId) {
    const pinRes = await req("/pin", {
      method: "POST",
      token,
      csrf,
      body: JSON.stringify({ userId: "me", messageId }),
    });
    record("pin POST", pinRes.ok, pinRes.status);

    const hideRes = await req("/hidden-messages", {
      method: "POST",
      token,
      csrf,
      body: JSON.stringify({ userId: "me", messageId }),
    });
    record("hidden-messages POST", hideRes.ok, hideRes.status);

    const schedRes = await req("/schedule", {
      method: "POST",
      token,
      csrf,
      body: JSON.stringify({
        senderId: "me",
        type: "text",
        text: "[smoke scheduled]",
        scheduledAt: new Date(Date.now() + 3600_000).toISOString(),
      }),
    });
    record("schedule POST", schedRes.ok, schedRes.status);
  }

  const taskRes = await req("/tasks", {
    method: "POST",
    token,
    csrf,
    body: JSON.stringify({
      title: "[smoke] task",
      assignedTo: "both",
      priority: "low",
      author: "me",
    }),
  });
  record("tasks POST", taskRes.ok, taskRes.status);

  printSummary();
  const failed = results.filter((r) => !r.ok).length;
  process.exit(failed > 0 ? 1 : 0);
}

function printSummary() {
  const passed = results.filter((r) => r.ok).length;
  const failed = results.filter((r) => !r.ok).length;
  console.log(`\n--- ${passed} passed, ${failed} failed, ${results.length} total ---\n`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});

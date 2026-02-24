import { FullConfig, request } from "@playwright/test";

const LOGIN_PAGE_PATTERN = /ログイン|Email:|メールアドレス:/;

export default async function globalSetup(config: FullConfig): Promise<void> {
  const project = config.projects[0];
  const baseURL = project?.use?.baseURL;

  if (typeof baseURL !== "string" || baseURL.length === 0) {
    return;
  }

  const api = await request.newContext({ baseURL });
  try {
    const response = await api.get("/login", { timeout: 5000 });
    const body = await response.text();

    if (response.status() >= 400 || !LOGIN_PAGE_PATTERN.test(body)) {
      throw new Error(
        [
          `[E2E preflight] Unexpected /login response at ${baseURL}.`,
          `status=${response.status()}`,
          "Likely wrong dev server or wrong port is already in use.",
          "Set E2E_PORT explicitly (e.g. E2E_PORT=3001) and retry.",
        ].join(" ")
      );
    }
  } finally {
    await api.dispose();
  }
}

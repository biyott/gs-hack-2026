import { access, readdir } from "node:fs/promises";
import { homedir } from "node:os";
import { join } from "node:path";
import { pathToFileURL } from "node:url";

export async function loadPlaywright() {
  if (process.env.PLAYWRIGHT_MODULE_PATH) {
    return import(pathToFileURL(process.env.PLAYWRIGHT_MODULE_PATH).href);
  }
  try {
    return await import("playwright");
  } catch (error) {
    throw new Error("Install the project's playwright dev dependency, or set PLAYWRIGHT_MODULE_PATH to its index.mjs.", { cause: error });
  }
}

export async function launchBrowser(chromium) {
  const launchOptions = { headless: true };
  if (process.env.QA_BROWSER_CHANNEL) {
    launchOptions.channel = process.env.QA_BROWSER_CHANNEL;
  } else if (process.env.QA_BROWSER_EXECUTABLE) {
    launchOptions.executablePath = process.env.QA_BROWSER_EXECUTABLE;
  } else {
    const cache = join(homedir(), ".cache", "ms-playwright");
    const revisions = await readdir(cache).catch(() => []);
    for (const revision of revisions.filter((name) => /^chromium-\d+$/.test(name)).sort().reverse()) {
      const executable = join(cache, revision, "chrome-linux64", "chrome");
      if (await access(executable).then(() => true, () => false)) {
        launchOptions.executablePath = executable;
        break;
      }
    }
  }
  return chromium.launch(launchOptions);
}

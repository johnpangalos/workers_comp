// What the three steps share: the GitHub API with the job's token, and step outputs.

import { appendFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

export function env(name: string): string {
  const value = process.env[name];
  if (!value) throw new Error(`${name} is not set`);
  return value;
}

/** Calls the GitHub REST API with the job's own token; throws on any non-2xx answer. */
export async function github<T>(path: string, init: RequestInit = {}): Promise<T> {
  const response = await fetch(`${process.env.GITHUB_API_URL ?? "https://api.github.com"}${path}`, {
    ...init,
    headers: {
      accept: "application/vnd.github+json",
      authorization: `Bearer ${env("GH_TOKEN")}`,
      "x-github-api-version": "2022-11-28",
      ...init.headers,
    },
  });
  if (!response.ok) {
    throw new Error(`GitHub ${init.method ?? "GET"} ${path}: ${response.status} ${await response.text()}`);
  }
  return (await response.json()) as T;
}

/** Every page of a list endpoint (100 a page, as far as the API goes). */
export async function githubAll<T>(path: string): Promise<T[]> {
  const all: T[] = [];
  for (let page = 1; ; page++) {
    let separator = "?";
    if (path.includes("?")) separator = "&";
    const items = await github<T[]>(`${path}${separator}per_page=100&page=${page}`);
    all.push(...items);
    if (items.length < 100) return all;
  }
}

/** A step output; the value has to be one line. */
export function output(name: string, value: string): void {
  if (value.includes("\n")) throw new Error(`output ${name} spans lines`);
  appendFileSync(env("GITHUB_OUTPUT"), `${name}=${value}\n`);
}

/** A line in the run's summary. */
export function summary(line: string): void {
  const file = process.env.GITHUB_STEP_SUMMARY;
  if (file) appendFileSync(file, `${line}\n`);
  console.log(line);
}

/** Keeps a value out of the run's logs. */
export function mask(value: string): void {
  console.log(`::add-mask::${value}`);
}

/** Runs `main` when the file is run, not when a test imports it; a failure fails the step. */
export function runIfMain(url: string, main: () => Promise<void>): void {
  if (process.argv[1] !== fileURLToPath(url)) return;
  main().catch((error: unknown) => {
    let message = String(error);
    if (error instanceof Error) message = error.message;
    console.log(`::error::${message}`);
    process.exit(1);
  });
}

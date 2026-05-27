const BASE_RAW = "https://raw.githubusercontent.com";
const BASE_API = "https://api.github.com";

export async function fetchFile(
  owner: string,
  repo: string,
  branch: string,
  path: string
): Promise<string> {
  const url = `${BASE_RAW}/${owner}/${repo}/${branch}/${path}`;
  const res = await fetch(url);
  if (!res.ok) {
    throw new Error(`Not found: ${path} (HTTP ${res.status})`);
  }
  return res.text();
}

export async function listTree(
  owner: string,
  repo: string,
  branch: string
): Promise<string[]> {
  const url = `${BASE_API}/repos/${owner}/${repo}/git/trees/${branch}?recursive=1`;
  const res = await fetch(url, {
    headers: { Accept: "application/vnd.github.v3+json" },
  });
  if (!res.ok) {
    throw new Error(`Failed to fetch tree (HTTP ${res.status})`);
  }
  const data = (await res.json()) as {
    tree: Array<{ path: string; type: string }>;
  };
  return data.tree
    .filter((item) => item.type === "blob")
    .map((item) => item.path);
}

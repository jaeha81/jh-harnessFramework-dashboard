// Google Drive API utility using Google Identity Services (GIS)
// Uses implicit OAuth flow — no backend needed

declare global {
    interface Window {
          google: {
                  accounts: {
                            oauth2: {
                                        initTokenClient: (config: TokenClientConfig) => TokenClient;
                                      };
                          };
                };
        }
  }

interface TokenClientConfig {
    client_id: string;
    scope: string;
    callback: (response: TokenResponse) => void;
  }

interface TokenClient {
    requestAccessToken: (opts?: { prompt?: string }) => void;
  }

interface TokenResponse {
    access_token?: string;
    error?: string;
  }


const CLIENT_ID = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID!;
const PARENT_FOLDER = "Obsidian Vault";
const FOLDER_NAME = "JH 하네스 대시보드";
const SCOPE = "https://www.googleapis.com/auth/drive.file";

let tokenClient: TokenClient | null = null;
let accessToken: string | null = null;

function loadGisScript(): Promise<void> {
    return new Promise((resolve) => {
          if (window.google?.accounts?.oauth2) {
                  resolve();
                  return;
                }
          const script = document.createElement("script");
          script.src = "https://accounts.google.com/gsi/client";
          script.onload = () => resolve();
          document.head.appendChild(script);
        });
  }


async function getAccessToken(): Promise<string> {
    if (accessToken) return accessToken;

    await loadGisScript();

    return new Promise((resolve, reject) => {
          tokenClient = window.google.accounts.oauth2.initTokenClient({
                  client_id: CLIENT_ID,
                  scope: SCOPE,
                  callback: (response: TokenResponse) => {
                            if (response.error || !response.access_token) {
                                        reject(new Error(response.error ?? "토큰 발급 실패"));
                                        return;
                                      }
                            accessToken = response.access_token;
                            resolve(accessToken);
                          },
                });
          tokenClient.requestAccessToken({ prompt: "consent" });
        });
  }

async function findOrCreateFolder(token: string, name: string, parentId?: string): Promise<string> {
  const parentClause = parentId ? ` and '${parentId}' in parents` : " and 'root' in parents";
  const q = encodeURIComponent(
    `name='${name}' and mimeType='application/vnd.google-apps.folder' and trashed=false${parentClause}`
  );
  const searchRes = await fetch(
    `https://www.googleapis.com/drive/v3/files?q=${q}&fields=files(id,name)`,
    { headers: { Authorization: `Bearer ${token}` } }
  );
  const searchData = await searchRes.json() as { files: Array<{ id: string; name: string }> };
  const files = searchData.files ?? [];
  if (files.length > 0) return files[0].id;

  const body: Record<string, unknown> = { name, mimeType: "application/vnd.google-apps.folder" };
  if (parentId) body.parents = [parentId];
  const createRes = await fetch("https://www.googleapis.com/drive/v3/files", {
    method: "POST",
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const folder = await createRes.json() as { id: string };
  return folder.id;
}

async function ensureFolder(token: string): Promise<string> {
  const parentId = await findOrCreateFolder(token, PARENT_FOLDER);
  return findOrCreateFolder(token, FOLDER_NAME, parentId);
}

export async function saveToGoogleDrive(
    filename: string,
    content: string
  ): Promise<string> {
    const token = await getAccessToken();
    const folderId = await ensureFolder(token);

    // multipart upload
    const metadata = {
          name: filename,
          mimeType: "text/markdown",
          parents: [folderId],
        };

    const boundary = "jhd_boundary_" + Date.now();
    const body = [
          `--${boundary}`,
          "Content-Type: application/json; charset=UTF-8",
          "",
          JSON.stringify(metadata),
          `--${boundary}`,
          "Content-Type: text/markdown; charset=UTF-8",
          "",
          content,
          `--${boundary}--`,
        ].join("\r\n");

    const res = await fetch(
          "https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart",
          {
                  method: "POST",
                  headers: {
                            Authorization: `Bearer ${token}`,
                            "Content-Type": `multipart/related; boundary=${boundary}`,
                          },
                  body,
                }
        );

    if (!res.ok) {
          const err = await res.json();
          throw new Error(err.error?.message ?? "Drive 저장 실패");
        }

    const file = await res.json();
    return file.id as string;
  }

export async function saveRequestToGoogleDrive(
  filename: string,
  data: object
): Promise<string> {
  const token = await getAccessToken();
  const folderId = await ensureFolder(token);

  const content = JSON.stringify(data, null, 2);
  const metadata = {
    name: filename,
    mimeType: "application/json",
    parents: [folderId],
  };

  const boundary = "jhd_boundary_" + Date.now();
  const body = [
    `--${boundary}`,
    "Content-Type: application/json; charset=UTF-8",
    "",
    JSON.stringify(metadata),
    `--${boundary}`,
    "Content-Type: application/json; charset=UTF-8",
    "",
    content,
    `--${boundary}--`,
  ].join("\r\n");

  const res = await fetch(
    "https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart",
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": `multipart/related; boundary=${boundary}`,
      },
      body,
    }
  );

  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.error?.message ?? "Drive 저장 실패");
  }

  const file = await res.json();
  return file.id as string;
}

export function clearDriveToken() {
    accessToken = null;
    tokenClient = null;
  }

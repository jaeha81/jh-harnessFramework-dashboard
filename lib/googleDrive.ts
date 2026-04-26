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
  expires_in?: number;
}

const CLIENT_ID = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID!;
const FOLDER_NAME = "JH 하네스 대시보드";
// drive.file: access only to files/folders created by this app
const SCOPE = "https://www.googleapis.com/auth/drive.file";

const SESSION_TOKEN_KEY = "jhd_drive_token";
const SESSION_EXPIRY_KEY = "jhd_drive_expiry";

let tokenClient: TokenClient | null = null;
let memToken: string | null = null;

function loadStoredToken(): string | null {
  try {
    const token = sessionStorage.getItem(SESSION_TOKEN_KEY);
    const expiry = sessionStorage.getItem(SESSION_EXPIRY_KEY);
    if (token && expiry && Date.now() < Number(expiry)) return token;
  } catch {}
  return null;
}

function persistToken(token: string) {
  memToken = token;
  try {
    // GIS implicit tokens last 3600s — store with 5 min buffer
    sessionStorage.setItem(SESSION_TOKEN_KEY, token);
    sessionStorage.setItem(SESSION_EXPIRY_KEY, String(Date.now() + 3300 * 1000));
  } catch {}
}

function clearStoredToken() {
  memToken = null;
  try {
    sessionStorage.removeItem(SESSION_TOKEN_KEY);
    sessionStorage.removeItem(SESSION_EXPIRY_KEY);
  } catch {}
}

function loadGisScript(): Promise<void> {
  return new Promise((resolve) => {
    if (window.google?.accounts?.oauth2) { resolve(); return; }
    const script = document.createElement("script");
    script.src = "https://accounts.google.com/gsi/client";
    script.onload = () => resolve();
    document.head.appendChild(script);
  });
}

async function getAccessToken(): Promise<string> {
  // 1. Check in-memory
  if (memToken) return memToken;
  // 2. Check sessionStorage
  const stored = loadStoredToken();
  if (stored) { memToken = stored; return stored; }

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
        persistToken(response.access_token);
        resolve(response.access_token);
      },
    });
    // No prompt:"consent" — GIS will skip consent screen for already-granted users
    tokenClient.requestAccessToken({});
  });
}

async function findOrCreateFolder(token: string, name: string, parentId?: string): Promise<string> {
  const parentClause = parentId
    ? ` and '${parentId}' in parents`
    : " and 'root' in parents";
  const q = encodeURIComponent(
    `name='${name}' and mimeType='application/vnd.google-apps.folder' and trashed=false${parentClause}`
  );
  const searchRes = await fetch(
    `https://www.googleapis.com/drive/v3/files?q=${q}&fields=files(id,name)`,
    { headers: { Authorization: `Bearer ${token}` } }
  );

  // If search fails due to stale token, clear and reject
  if (searchRes.status === 401) {
    clearStoredToken();
    throw new Error("Drive 인증이 만료됐습니다. 다시 시도해주세요.");
  }

  const searchData = await searchRes.json() as { files: Array<{ id: string; name: string }> };
  const files = searchData.files ?? [];
  if (files.length > 0) return files[0].id;

  const body: Record<string, unknown> = {
    name,
    mimeType: "application/vnd.google-apps.folder",
  };
  if (parentId) body.parents = [parentId];

  const createRes = await fetch("https://www.googleapis.com/drive/v3/files", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });
  const folder = await createRes.json() as { id: string };
  return folder.id;
}

async function ensureFolder(token: string): Promise<string> {
  // Single-level: "JH 하네스 대시보드" at Drive root
  return findOrCreateFolder(token, FOLDER_NAME);
}

async function uploadMultipart(
  token: string,
  filename: string,
  mimeType: string,
  content: string,
  folderId: string
): Promise<string> {
  const metadata = { name: filename, mimeType, parents: [folderId] };
  const boundary = "jhd_" + Date.now();
  const body = [
    `--${boundary}`,
    "Content-Type: application/json; charset=UTF-8",
    "",
    JSON.stringify(metadata),
    `--${boundary}`,
    `Content-Type: ${mimeType}; charset=UTF-8`,
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

  if (res.status === 401) { clearStoredToken(); throw new Error("Drive 인증 만료. 다시 시도해주세요."); }
  if (!res.ok) {
    const err = await res.json() as { error?: { message?: string } };
    throw new Error(err.error?.message ?? "Drive 저장 실패");
  }
  const file = await res.json() as { id: string };
  return file.id;
}

export async function saveToGoogleDrive(filename: string, content: string): Promise<string> {
  const token = await getAccessToken();
  const folderId = await ensureFolder(token);
  return uploadMultipart(token, filename, "text/markdown", content, folderId);
}

export async function saveRequestToGoogleDrive(filename: string, data: object): Promise<string> {
  const token = await getAccessToken();
  const folderId = await ensureFolder(token);
  return uploadMultipart(token, filename, "application/json", JSON.stringify(data, null, 2), folderId);
}

export function clearDriveToken() {
  clearStoredToken();
  tokenClient = null;
}

export interface DriveFileInfo {
  id: string;
  name: string;
  modifiedTime: string;
}

export async function listDriveRequests(): Promise<DriveFileInfo[]> {
  const token = await getAccessToken();
  const folderId = await ensureFolder(token);
  const q = encodeURIComponent(
    `'${folderId}' in parents and mimeType='application/json' and trashed=false`
  );
  const res = await fetch(
    `https://www.googleapis.com/drive/v3/files?q=${q}&fields=files(id,name,modifiedTime)&orderBy=modifiedTime%20desc`,
    { headers: { Authorization: `Bearer ${token}` } }
  );
  if (res.status === 401) { clearStoredToken(); throw new Error("Drive 인증 만료. 다시 시도해주세요."); }
  if (!res.ok) {
    const err = await res.json() as { error?: { message?: string } };
    throw new Error(err.error?.message ?? "Drive 목록 조회 실패");
  }
  const data = await res.json() as { files: DriveFileInfo[] };
  return data.files ?? [];
}

export async function readDriveFile(fileId: string): Promise<string> {
  const token = await getAccessToken();
  const res = await fetch(
    `https://www.googleapis.com/drive/v3/files/${fileId}?alt=media`,
    { headers: { Authorization: `Bearer ${token}` } }
  );
  if (res.status === 401) { clearStoredToken(); throw new Error("Drive 인증 만료. 다시 시도해주세요."); }
  if (!res.ok) throw new Error("파일 읽기 실패");
  return res.text();
}

const FOLDER_NAME = "JH 하네스 대시보드";
const SCOPE = "https://www.googleapis.com/auth/drive.file";
const CLIENT_ID = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID ?? "";

declare global {
  interface Window {
    google?: {
      accounts: {
        oauth2: {
          initTokenClient: (config: {
            client_id: string;
            scope: string;
            callback: (resp: { access_token?: string; error?: string }) => void;
          }) => { requestAccessToken: () => void };
        };
      };
    };
  }
}

function loadGisScript(): Promise<void> {
  return new Promise((resolve) => {
    if (window.google?.accounts) { resolve(); return; }
    const s = document.createElement("script");
    s.src = "https://accounts.google.com/gsi/client";
    s.onload = () => resolve();
    document.head.appendChild(s);
  });
}

async function getAccessToken(): Promise<string> {
  await loadGisScript();
  return new Promise((resolve, reject) => {
    const client = window.google!.accounts.oauth2.initTokenClient({
      client_id: CLIENT_ID,
      scope: SCOPE,
      callback: (resp) => {
        if (resp.error || !resp.access_token) reject(new Error(resp.error ?? "인증 실패"));
        else resolve(resp.access_token);
      },
    });
    client.requestAccessToken();
  });
}

async function findOrCreateFolder(token: string): Promise<string> {
  // 기존 폴더 검색
  const q = encodeURIComponent(`name='${FOLDER_NAME}' and mimeType='application/vnd.google-apps.folder' and trashed=false`);
  const res = await fetch(`https://www.googleapis.com/drive/v3/files?q=${q}&fields=files(id)`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  const data = await res.json() as { files: { id: string }[] };
  if (data.files.length > 0) return data.files[0].id;

  // 없으면 생성
  const create = await fetch("https://www.googleapis.com/drive/v3/files", {
    method: "POST",
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
    body: JSON.stringify({ name: FOLDER_NAME, mimeType: "application/vnd.google-apps.folder" }),
  });
  const folder = await create.json() as { id: string };
  return folder.id;
}

export async function saveToDrive(filename: string, content: string): Promise<string> {
  const token = await getAccessToken();
  const folderId = await findOrCreateFolder(token);

  const meta = JSON.stringify({ name: filename, parents: [folderId] });
  const blob = new Blob([content], { type: "text/markdown" });

  const form = new FormData();
  form.append("metadata", new Blob([meta], { type: "application/json" }));
  form.append("file", blob);

  const res = await fetch("https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&fields=id,webViewLink", {
    method: "POST",
    headers: { Authorization: `Bearer ${token}` },
    body: form,
  });
  const file = await res.json() as { id: string; webViewLink: string };
  return file.webViewLink;
}

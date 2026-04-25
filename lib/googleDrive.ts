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
          gapi: {
                  load: (lib: string, cb: () => void) => void;
                  client: {
                            init: (config: object) => Promise<void>;
                            request: (config: RequestConfig) => Promise<GapiResponse>;
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

interface RequestConfig {
    path: string;
    method: string;
    headers?: Record<string, string>;
    body?: string;
  }

interface GapiResponse {
    result: {
          id?: string;
          files?: Array<{ id: string; name: string }>;
        };
  }

const CLIENT_ID = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID!;
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

function loadGapiScript(): Promise<void> {
    return new Promise((resolve) => {
          if (window.gapi?.client) {
                  resolve();
                  return;
                }
          const script = document.createElement("script");
          script.src = "https://apis.google.com/js/api.js";
          script.onload = () => {
                  window.gapi.load("client", () => resolve());
                };
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

async function ensureFolder(token: string): Promise<string> {
    await loadGapiScript();
    await window.gapi.client.init({});

    // 폴더 검색
    const searchRes = await window.gapi.client.request({
          path: "https://www.googleapis.com/drive/v3/files",
          method: "GET",
          headers: {
                  Authorization: `Bearer ${token}`,
                },
          body: JSON.stringify({
                  q: `name='${FOLDER_NAME}' and mimeType='application/vnd.google-apps.folder' and trashed=false`,
                  fields: "files(id,name)",
                }),
        });

    const files = searchRes.result.files ?? [];
    if (files.length > 0) return files[0].id;

    // 폴더 생성
    const createRes = await fetch("https://www.googleapis.com/drive/v3/files", {
          method: "POST",
          headers: {
                  Authorization: `Bearer ${token}`,
                  "Content-Type": "application/json",
                },
          body: JSON.stringify({
                  name: FOLDER_NAME,
                  mimeType: "application/vnd.google-apps.folder",
                }),
        });
    const folder = await createRes.json();
    return folder.id as string;
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

export function clearDriveToken() {
    accessToken = null;
    tokenClient = null;
  }

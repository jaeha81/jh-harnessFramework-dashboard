import { NextRequest, NextResponse } from "next/server";

interface CreateRepoBody {
  token: string;
  repoName: string;
  description: string;
  isPrivate: boolean;
}

interface GitHubRepo {
  html_url: string;
  clone_url: string;
  ssh_url: string;
  full_name: string;
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json() as CreateRepoBody;
    const { token, repoName, description, isPrivate } = body;

    if (!token || !repoName) {
      return NextResponse.json({ success: false, error: "GitHub 토큰과 레포 이름이 필요합니다" }, { status: 400 });
    }

    // 레포 이름 안전화: 한글/공백 → 하이픈
    const safeName = repoName
      .toLowerCase()
      .replace(/[^\w\s-]/g, "")
      .replace(/[\s_]+/g, "-")
      .replace(/-+/g, "-")
      .replace(/^-|-$/g, "")
      .slice(0, 100) || "new-project";

    const res = await fetch("https://api.github.com/user/repos", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: "application/vnd.github+json",
        "X-GitHub-Api-Version": "2022-11-28",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        name: safeName,
        description,
        private: isPrivate,
        auto_init: true,
      }),
    });

    if (!res.ok) {
      const err = await res.json() as { message?: string };
      return NextResponse.json(
        { success: false, error: err.message ?? "GitHub 레포 생성 실패" },
        { status: res.status }
      );
    }

    const repo = await res.json() as GitHubRepo;
    return NextResponse.json({
      success: true,
      repo: {
        html_url: repo.html_url,
        clone_url: repo.clone_url,
        ssh_url: repo.ssh_url,
        full_name: repo.full_name,
        safe_name: safeName,
      },
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "서버 오류";
    return NextResponse.json({ success: false, error: msg }, { status: 500 });
  }
}

import { verifySession } from "@/lib/dal";

function parseGithubUrl(url: string) {
  try {
    const { pathname, hostname } = new URL(url);
    if (!hostname.includes("github.com")) return null;
    const [, owner, repo] = pathname.split("/");
    if (!owner || !repo) return null;
    return { owner, repo: repo.replace(/\.git$/, "") };
  } catch {
    return null;
  }
}

export async function GET(request: Request) {
  await verifySession();

  const { searchParams } = new URL(request.url);
  const repoUrl = searchParams.get("repo_url");
  if (!repoUrl) {
    return Response.json({ error: "Falta el parámetro repo_url." }, { status: 400 });
  }

  const parsed = parseGithubUrl(repoUrl);
  if (!parsed) {
    return Response.json({ error: "URL de repositorio inválida." }, { status: 400 });
  }

  const headers: Record<string, string> = {
    Accept: "application/vnd.github+json",
    "X-GitHub-Api-Version": "2022-11-28",
  };
  if (process.env.GITHUB_TOKEN) {
    headers.Authorization = `Bearer ${process.env.GITHUB_TOKEN}`;
  }

  try {
    const [repoRes, commitsRes, issuesRes] = await Promise.all([
      fetch(`https://api.github.com/repos/${parsed.owner}/${parsed.repo}`, { headers }),
      fetch(`https://api.github.com/repos/${parsed.owner}/${parsed.repo}/commits?per_page=1`, {
        headers,
      }),
      fetch(
        `https://api.github.com/search/issues?q=repo:${parsed.owner}/${parsed.repo}+type:issue+state:open`,
        { headers }
      ),
    ]);

    if (repoRes.status === 404) {
      return Response.json({ error: "Repositorio no encontrado o privado." }, { status: 404 });
    }
    if (!repoRes.ok) {
      return Response.json(
        { error: "GitHub rechazó la solicitud (rate limit o token inválido)." },
        { status: repoRes.status }
      );
    }

    const repoData = await repoRes.json();
    const commits = commitsRes.ok ? await commitsRes.json() : [];
    const issuesData = issuesRes.ok ? await issuesRes.json() : { total_count: 0 };
    const lastCommit = Array.isArray(commits) ? commits[0] : null;

    return Response.json({
      defaultBranch: repoData.default_branch,
      stars: repoData.stargazers_count,
      openIssues: issuesData.total_count ?? 0,
      lastCommit: lastCommit
        ? {
            message: lastCommit.commit?.message?.split("\n")[0] ?? "",
            date: lastCommit.commit?.author?.date ?? null,
            author: lastCommit.commit?.author?.name ?? null,
            url: lastCommit.html_url,
            sha: (lastCommit.sha as string)?.slice(0, 7),
          }
        : null,
    });
  } catch {
    return Response.json({ error: "No se pudo contactar a GitHub." }, { status: 502 });
  }
}

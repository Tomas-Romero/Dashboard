"use client";

import { useEffect, useState } from "react";
import { formatDistanceToNow } from "date-fns";
import { es } from "date-fns/locale";
import { GitCommit, CircleDot, Star, ExternalLink } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

interface GithubInfo {
  defaultBranch: string;
  stars: number;
  openIssues: number;
  lastCommit: {
    message: string;
    date: string | null;
    author: string | null;
    url: string;
    sha: string;
  } | null;
}

export function GithubCard({ repoUrl }: { repoUrl: string }) {
  const [data, setData] = useState<GithubInfo | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);

    fetch(`/api/github?repo_url=${encodeURIComponent(repoUrl)}`)
      .then((res) => res.json())
      .then((json) => {
        if (cancelled) return;
        if (json.error) setError(json.error);
        else setData(json);
      })
      .catch(() => {
        if (!cancelled) setError("No se pudo cargar la información de GitHub.");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [repoUrl]);

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center gap-3 py-3">
          <Skeleton className="size-8 rounded-full" />
          <div className="flex-1 space-y-1.5">
            <Skeleton className="h-3 w-40" />
            <Skeleton className="h-2.5 w-24" />
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error || !data) {
    return (
      <Card>
        <CardContent className="py-3 text-xs text-muted-foreground">
          {error ?? "Sin datos de GitHub."}
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardContent className="flex flex-wrap items-center gap-4 py-3 text-sm">
        {data.lastCommit && (
          <a
            href={data.lastCommit.url}
            target="_blank"
            rel="noreferrer"
            className="group flex min-w-0 items-center gap-2 hover:text-primary"
          >
            <GitCommit className="size-4 shrink-0 text-muted-foreground group-hover:text-primary" />
            <span className="truncate">{data.lastCommit.message}</span>
            <code className="shrink-0 text-xs text-muted-foreground">{data.lastCommit.sha}</code>
            {data.lastCommit.date && (
              <span className="shrink-0 text-xs text-muted-foreground">
                ·{" "}
                {formatDistanceToNow(new Date(data.lastCommit.date), {
                  addSuffix: true,
                  locale: es,
                })}
              </span>
            )}
          </a>
        )}
        <span className="ml-auto flex shrink-0 items-center gap-3 text-xs text-muted-foreground">
          <span className="inline-flex items-center gap-1">
            <CircleDot className="size-3.5" /> {data.openIssues} abiertas
          </span>
          <span className="inline-flex items-center gap-1">
            <Star className="size-3.5" /> {data.stars}
          </span>
          <ExternalLink className="size-3.5" />
        </span>
      </CardContent>
    </Card>
  );
}

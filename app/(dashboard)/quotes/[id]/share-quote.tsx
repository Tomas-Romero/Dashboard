"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Copy, ExternalLink, FileDown, Check } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export function ShareQuote({ token }: { token: string }) {
  const [copied, setCopied] = useState(false);
  const publicUrl =
    typeof window !== "undefined" ? `${window.location.origin}/p/${token}` : `/p/${token}`;

  async function copyLink() {
    try {
      await navigator.clipboard.writeText(publicUrl);
      setCopied(true);
      toast.success("Link copiado.");
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error("No se pudo copiar. Copialo manualmente.");
    }
  }

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-base">Compartir con el cliente</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-3">
        <div className="flex gap-2">
          <Input readOnly value={publicUrl} className="text-xs" onFocus={(e) => e.target.select()} />
          <Button variant="outline" size="icon" onClick={copyLink} className="shrink-0">
            {copied ? <Check className="size-4" /> : <Copy className="size-4" />}
          </Button>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" size="sm" asChild>
            <a href={publicUrl} target="_blank" rel="noreferrer">
              <ExternalLink /> Ver como lo ve el cliente
            </a>
          </Button>
          <Button variant="outline" size="sm" asChild>
            <a href={`/api/quotes/${token}/pdf`} target="_blank" rel="noreferrer">
              <FileDown /> Descargar PDF
            </a>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

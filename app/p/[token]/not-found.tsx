import { FileQuestion } from "lucide-react";

export default function PublicQuoteNotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-3 bg-background px-4 text-center">
      <FileQuestion className="size-10 text-muted-foreground" />
      <p className="font-medium">No encontramos este presupuesto</p>
      <p className="text-sm text-muted-foreground">
        Puede que el link esté mal copiado.
      </p>
    </div>
  );
}

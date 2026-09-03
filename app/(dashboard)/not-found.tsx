import Link from "next/link";
import { Compass } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function DashboardNotFound() {
  return (
    <div className="mx-auto flex max-w-md flex-col items-center gap-4 py-24 text-center">
      <div className="flex size-14 items-center justify-center rounded-2xl bg-muted text-muted-foreground">
        <Compass className="size-7" />
      </div>
      <div>
        <h2 className="font-semibold">No encontramos esta página</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Puede que el recurso haya sido eliminado o la URL sea incorrecta.
        </p>
      </div>
      <Button asChild variant="outline">
        <Link href="/">Volver al inicio</Link>
      </Button>
    </div>
  );
}

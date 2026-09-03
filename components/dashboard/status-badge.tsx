import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

type Tone = "default" | "secondary" | "success" | "warning" | "destructive" | "outline";

const TONE_CLASSES: Record<Tone, string> = {
  default: "",
  secondary: "",
  destructive: "",
  outline: "",
  success: "border-transparent bg-success/15 text-success",
  warning: "border-transparent bg-warning/15 text-warning",
};

export function StatusBadge({ label, tone }: { label: string; tone: Tone }) {
  const variant = tone === "success" || tone === "warning" ? "outline" : tone;

  return (
    <Badge variant={variant} className={cn(TONE_CLASSES[tone])}>
      {label}
    </Badge>
  );
}

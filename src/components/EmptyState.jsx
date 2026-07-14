import { cn } from "@/lib/utils";

/** État vide générique : icône + titre + description + action optionnelle. */
export default function EmptyState({ icon: Icon, title, description, action, className }) {
  return (
    <div
      className={cn(
        "bg-card rounded-2xl border border-dashed border-border p-10 text-center",
        className
      )}
    >
      {Icon && <Icon className="h-8 w-8 mx-auto mb-3 text-muted-foreground/40" />}
      <p className="font-medium text-foreground">{title}</p>
      {description && <p className="text-sm text-muted-foreground mt-1">{description}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}

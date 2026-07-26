import { LucideIcon } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

interface ToolCardProps {
  title: string;
  description: string;
  icon: LucideIcon;
}

export function ToolCard({ title, description, icon: Icon }: ToolCardProps) {
  return (
    <Card className="hover:border-primary/30 hover:bg-card/80 transition-colors">
      <CardHeader>
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-muted text-primary">
            <Icon className="h-4 w-4" />
          </div>
          <CardTitle data-testid="tool-card-title">{title}</CardTitle>
        </div>
      </CardHeader>
      <CardContent>
        <CardDescription className="text-sm leading-relaxed">
          {description}
        </CardDescription>
      </CardContent>
    </Card>
  );
}

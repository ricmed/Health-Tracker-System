import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { FileText, Info, BookOpen, Database, Lightbulb } from 'lucide-react';
import type { DashboardTextBlock } from '@/types';

interface TextBlockRendererProps {
  block: DashboardTextBlock;
}

const BLOCK_ICONS = {
  header: FileText,
  description: Info,
  note: Lightbulb,
  source: Database,
  methodology: BookOpen,
};

const BLOCK_STYLES = {
  header: 'bg-primary/5 border-primary/20',
  description: 'bg-muted/50',
  note: 'bg-yellow-500/5 border-yellow-500/20',
  source: 'bg-blue-500/5 border-blue-500/20',
  methodology: 'bg-green-500/5 border-green-500/20',
};

export function TextBlockRenderer({ block }: TextBlockRendererProps) {
  if (!block.is_visible) return null;

  const Icon = BLOCK_ICONS[block.block_type] || FileText;
  const styleClass = BLOCK_STYLES[block.block_type] || '';

  if (block.block_type === 'header') {
    return (
      <div className={`p-4 rounded-lg border ${styleClass}`} data-testid={`text-block-${block.id}`}>
        {block.title && (
          <h2 className="text-xl font-semibold mb-2">{block.title}</h2>
        )}
        <p className="text-muted-foreground">{block.content}</p>
      </div>
    );
  }

  return (
    <Card className={`${styleClass}`} data-testid={`text-block-${block.id}`}>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium flex items-center gap-2">
          <Icon className="w-4 h-4" />
          {block.title || block.block_type.charAt(0).toUpperCase() + block.block_type.slice(1)}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-muted-foreground whitespace-pre-wrap">
          {block.content}
        </p>
      </CardContent>
    </Card>
  );
}

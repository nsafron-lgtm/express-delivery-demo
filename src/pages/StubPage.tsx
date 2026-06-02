import { Construction } from 'lucide-react';

export default function StubPage({ title }: { title: string }) {
  return (
    <div className="space-y-6">
      <h2 className="text-xl font-semibold text-foreground">{title}</h2>
      <div className="rounded-lg border border-border bg-card flex flex-col items-center justify-center py-24">
        <Construction className="h-10 w-10 text-muted-foreground mb-3" />
        <p className="text-sm text-muted-foreground">Coming soon</p>
      </div>
    </div>
  );
}

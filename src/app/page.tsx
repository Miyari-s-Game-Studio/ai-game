import { GameUI } from '@/components/game/GameUI';
import { Leaf, Wrench } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { defaultGameRules } from '@/lib/game-rules';

export default function Home() {
  const gameTitle = defaultGameRules.title || 'Interactive Narrative Game';

  return (
    <main className="container mx-auto p-4 md:p-8">
      <header className="mb-8 flex justify-between items-center">
        <div className="flex items-center gap-4">
           <Leaf className="w-12 h-12 text-primary" />
           <div>
            <h1 className="text-4xl md:text-5xl font-headline font-bold text-primary">{gameTitle}</h1>
            <p className="text-lg text-muted-foreground">
              An interactive narrative game about navigating a crisis.
            </p>
           </div>
        </div>
        <Button asChild variant="outline">
            <Link href="/admin/rules">
                <Wrench className="mr-2 h-4 w-4" />
                Manage Rules
            </Link>
        </Button>
      </header>
      <GameUI />
    </main>
  );
}

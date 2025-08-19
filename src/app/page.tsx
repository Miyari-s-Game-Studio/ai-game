import { GameUI } from '@/components/game/GameUI';
import { Leaf } from 'lucide-react';

export default function Home() {
  return (
    <main className="container mx-auto p-4 md:p-8">
      <header className="mb-8 text-center">
        <div className="flex justify-center items-center gap-4 mb-2">
           <Leaf className="w-12 h-12 text-primary" />
           <h1 className="text-4xl md:text-5xl font-headline font-bold text-primary">EcoTrouble</h1>
        </div>
        <p className="text-lg text-muted-foreground">
          An interactive narrative game about navigating an environmental crisis.
        </p>
      </header>
      <GameUI />
    </main>
  );
}

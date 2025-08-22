
// src/app/page.tsx
import Link from 'next/link';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { BookOpen } from 'lucide-react';
import { gameRulesets, getRuleset } from '@/lib/rulesets';
import type { GameRules } from '@/types/game';

export default function GameSelectionPage() {
  const allRules: GameRules[] = gameRulesets.map(id => getRuleset(id)).filter(Boolean) as GameRules[];

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-background p-4 md:p-8">
      <header className="mb-8 text-center">
        <h1 className="text-4xl md:text-5xl font-bold text-primary font-headline">
          Select a Scenario
        </h1>
        <p className="text-muted-foreground mt-2 text-lg">
          Choose an interactive story to begin.
        </p>
      </header>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-5xl w-full">
        {allRules.map(rules => (
          <Card key={rules.id} className="flex flex-col">
            <CardHeader>
              <CardTitle className="font-headline text-2xl">{rules.title}</CardTitle>
              <CardDescription>{rules.description}</CardDescription>
            </CardHeader>
            <CardContent className="flex-grow">
                <p className="text-sm text-muted-foreground">Version: {rules.version}</p>
            </CardContent>
            <CardFooter>
              <Button asChild className="w-full">
                <Link href={`/play/${rules.id}`}>
                  <BookOpen className="mr-2" />
                  Play Scenario
                </Link>
              </Button>
            </CardFooter>
          </Card>
        ))}
         <Card className="flex flex-col items-center justify-center border-dashed">
            <CardHeader>
                <CardTitle className="font-headline text-2xl">Your Story</CardTitle>
                 <CardDescription>Create a new scenario.</CardDescription>
            </CardHeader>
            <CardContent>
                 <Button asChild variant="outline">
                     <Link href="/admin/rules">Create New</Link>
                </Button>
            </CardContent>
        </Card>
      </div>
       <div className="mt-12">
            <Button asChild variant="outline">
                <Link href="/admin/rules">Manage Game Rules</Link>
            </Button>
        </div>
    </div>
  );
}

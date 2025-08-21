// src/app/admin/rules/page.tsx
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { RulesEditor } from '@/components/admin/RulesEditor';
import { defaultGameRules } from '@/lib/game-rules';
import { Home } from 'lucide-react';

async function getRules() {
  // We can directly import the object and stringify it to ensure it's valid JSON.
  try {
    return JSON.stringify(defaultGameRules, null, 2);
  } catch (error) {
    console.error("Failed to stringify rules:", error);
    return "{}";
  }
}

export default async function AdminRulesPage() {
  const rules = await getRules();

  return (
    <main className="container mx-auto p-4 md:p-8">
      <header className="mb-8 flex justify-between items-center">
        <h1 className="text-4xl md:text-5xl font-headline font-bold text-primary">
          Game Rules Management
        </h1>
        <Button asChild>
          <Link href="/">
            <Home className="mr-2"/>
            Back to Game
          </Link>
        </Button>
      </header>
      <RulesEditor initialRules={rules} />
    </main>
  );
}

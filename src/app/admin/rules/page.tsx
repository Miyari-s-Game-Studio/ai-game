// src/app/admin/rules/page.tsx
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { RulesEditor } from '@/components/admin/RulesEditor';
import { promises as fs } from 'fs';
import path from 'path';

async function getRules() {
  // In a real app, you might have multiple rule files.
  // For now, we'll just read the default one.
  try {
    const filePath = path.join(process.cwd(), 'src', 'lib', 'eco-rules.ts');
    // This is a simplified way to get the object. We will remove the export and import statements.
    const fileContent = await fs.readFile(filePath, 'utf-8');
    const jsonString = fileContent
      .replace(/import type[^;]+;/g, '')
      .replace('export const ecoPollutionRules: GameRules = ', '')
      .replace(/;$/, '')
      .trim();
    
    // This is a hacky way to parse a TS object. A better way would be to store rules in JSON from the start.
    // For now, we will assume it's close enough to JSON.
    // A more robust solution might involve a bundler or transpiler if the object is complex.
    return jsonString;
  } catch (error) {
    console.error("Failed to read rules:", error);
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
          <Link href="/">Back to Game</Link>
        </Button>
      </header>
      <RulesEditor initialRules={rules} />
    </main>
  );
}

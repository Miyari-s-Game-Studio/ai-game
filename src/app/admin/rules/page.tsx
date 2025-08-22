
// src/app/admin/rules/page.tsx
'use client';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { RulesEditor } from '@/components/admin/RulesEditor';
import { gameRulesets, getRuleset } from '@/lib/rulesets';
import { Home, PlusCircle } from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import type { GameRules } from '@/types/game';

export default function AdminRulesPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialRulesId = searchParams.get('id');

  const [selectedRulesId, setSelectedRulesId] = useState<string | null>(initialRulesId);
  const [rules, setRules] = useState<string>("{}");
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (initialRulesId && gameRulesets.includes(initialRulesId)) {
        setSelectedRulesId(initialRulesId);
    } else if (gameRulesets.length > 0) {
        setSelectedRulesId(gameRulesets[0]);
    } else {
        setIsLoading(false);
    }
  }, [initialRulesId]);

  useEffect(() => {
    if (selectedRulesId) {
      setIsLoading(true);
      const rulesData = getRuleset(selectedRulesId);
      if (rulesData) {
        setRules(JSON.stringify(rulesData, null, 2));
      } else {
        setRules("{}");
      }
      setIsLoading(false);
      
      // Update URL without navigating
      const newUrl = new URL(window.location.href);
      newUrl.searchParams.set('id', selectedRulesId);
      router.replace(newUrl.toString(), { scroll: false });

    }
  }, [selectedRulesId, router]);
  
  const handleCreateNew = () => {
    // This would ideally involve a prompt for a new ID and creating a new file.
    // For now, we can link to a "new" page or have a modal here.
    // For simplicity, we'll just log it. A real implementation needs more UX.
    console.log("TODO: Implement 'Create New' functionality.");
    alert("Please manually create a new JSON file in `/src/lib/rulesets` and refresh.");
  };

  return (
    <main className="container mx-auto p-4 md:p-8">
      <header className="mb-8">
        <div className="flex justify-between items-center mb-4">
            <h1 className="text-4xl md:text-5xl font-headline font-bold text-primary">
              Game Rules Management
            </h1>
            <Button asChild>
              <Link href="/">
                <Home className="mr-2"/>
                Back to Scenarios
              </Link>
            </Button>
        </div>
        <div className="flex items-center gap-4">
            <Select onValueChange={setSelectedRulesId} value={selectedRulesId || ''} disabled={isLoading}>
                <SelectTrigger className="w-[280px]">
                    <SelectValue placeholder="Select a ruleset to edit..." />
                </SelectTrigger>
                <SelectContent>
                    {gameRulesets.map(id => (
                        <SelectItem key={id} value={id}>{id}</SelectItem>
                    ))}
                </SelectContent>
            </Select>
             <Button variant="outline" onClick={handleCreateNew}>
                <PlusCircle className="mr-2" />
                Create New
            </Button>
        </div>
      </header>
      {isLoading ? (
          <p>Loading rules...</p>
      ) : selectedRulesId ? (
          <RulesEditor 
            key={selectedRulesId} // Force re-mount on change
            rulesId={selectedRulesId} 
            initialRules={rules} 
          />
      ) : (
          <div className="text-center p-8 border-dashed border-2 rounded-lg">
              <p className="text-muted-foreground">No rulesets found.</p>
              <p className="text-muted-foreground mt-2">Create a new JSON file in <code>/src/lib/rulesets</code> to get started.</p>
          </div>
      )}
    </main>
  );
}

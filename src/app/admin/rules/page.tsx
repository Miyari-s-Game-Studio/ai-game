

'use client';
import Link from 'next/link';
import {Button} from '@/components/ui/button';
import {RulesEditor} from '@/components/admin/RulesEditor';
import {getAllRulesetIds, getRuleset, isCustomRuleset} from '@/lib/rulesets';
import {Home, PlusCircle, Trash2} from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {useState, useEffect, useMemo} from 'react';
import {useRouter, useSearchParams} from 'next/navigation';
import type {GameRules} from '@/types/game';
import { Suspense } from 'react'
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
    DialogClose,
} from "@/components/ui/dialog"
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { deleteCustomRuleset, saveCustomRuleset } from '@/lib/rulesets';
import { useToast } from '@/hooks/use-toast';



const createBoilerplateRules = (id: string, language: 'en' | 'zh'): GameRules => {
    if (language === 'zh') {
        return {
            id: id,
            version: 1,
            title: `新剧本: ${id}`,
            language: language,
            theme: 'theme-default',
            description: "一个新的冒险开始了。",
            actions: {
                observe: { icon: "Eye", label: "观察" },
                reflect: { icon: "Archive", label: "反思" }
            },
            initial: {
                situation: "start",
                counters: {},
            },
            tracks: {},
            situations: {
                start: {
                    label: "起点",
                    description: "这是你新冒险的起点。你可以从这里添加更多的行动和情境。",
                    ending: true,
                    on_action: [
                        {
                            when: { actionId: "observe" },
                            do: [{ log: "你环顾四周，审视着眼前的景象。" }]
                        }
                    ]
                }
            }
        };
    }

    // Default to English
    return {
        id: id,
        version: 1,
        title: `New Scenario: ${id}`,
        language: language,
        theme: 'theme-default',
        description: "A new adventure begins.",
        actions: {
            observe: { icon: "Eye", label: "Observe" },
            reflect: { icon: "Archive", label: "Reflect" }
        },
        initial: {
            situation: "start",
            counters: {},
        },
        tracks: {},
        situations: {
            start: {
                label: "The Beginning",
                description: "This is the starting point of your new adventure. You can add more actions and situations from here.",
                ending: true,
                on_action: [
                    {
                        when: { actionId: "observe" },
                        do: [{ log: "You look around, taking in the scene." }]
                    }
                ]
            }
        }
    };
};


function AdminRulesPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { toast } = useToast();

  const [allRulesetIds, setAllRulesetIds] = useState<string[]>([]);
  const [selectedRulesId, setSelectedRulesId] = useState<string | null>(null);
  const [rules, setRules] = useState<string>("{}");
  const [isLoading, setIsLoading] = useState(true);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [newRulesetId, setNewRulesetId] = useState('');
  const [newRulesetLanguage, setNewRulesetLanguage] = useState<'en' | 'zh'>('en');


  useEffect(() => {
    // This now runs on the client and can access localStorage via the helper functions
    const ids = getAllRulesetIds();
    setAllRulesetIds(ids);

    const initialRulesId = searchParams.get('id');
    if (initialRulesId && ids.includes(initialRulesId)) {
        setSelectedRulesId(initialRulesId);
    } else if (ids.length > 0) {
        setSelectedRulesId(ids[0]);
    } else {
        setIsLoading(false);
    }
  }, [searchParams]);

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

      if (window.location.search !== `?id=${selectedRulesId}`) {
        router.push(`/admin/rules?id=${selectedRulesId}`, {scroll: false});
      }
    }
  }, [selectedRulesId, router]);

  const handleConfirmCreate = () => {
    const baseId = newRulesetId.trim();
    if (!baseId || !/^[a-z0-9_]+$/.test(baseId)) {
        toast({ variant: 'destructive', title: 'Invalid ID', description: 'Please use only lowercase letters, numbers, and underscores.' });
        return;
    }

    const finalId = `${baseId}_${newRulesetLanguage}`;

    if (allRulesetIds.includes(finalId)) {
        toast({ variant: 'destructive', title: 'ID In Use', description: `The ID "${finalId}" is already in use. Please choose another one.` });
        return;
    }

    const boilerplate = createBoilerplateRules(finalId, newRulesetLanguage);
    saveCustomRuleset(boilerplate);

    // Refresh list and select the new one
    const updatedIds = getAllRulesetIds();
    setAllRulesetIds(updatedIds);
    setSelectedRulesId(finalId);
    toast({ title: 'Success', description: `New ruleset "${finalId}" created locally.` });
    
    // Close dialog and reset input
    setIsCreateDialogOpen(false);
    setNewRulesetId('');
    setNewRulesetLanguage('en');
  };

  const handleDelete = () => {
    if (!selectedRulesId || !isCustomRuleset(selectedRulesId)) {
      toast({ variant: 'destructive', title: 'Error', description: 'Only custom rulesets can be deleted.' });
      return;
    }
    
    deleteCustomRuleset(selectedRulesId);
    
    const updatedIds = getAllRulesetIds();
    setAllRulesetIds(updatedIds);
    setSelectedRulesId(updatedIds.length > 0 ? updatedIds[0] : null);
    
    toast({ title: 'Success', description: `Custom ruleset "${selectedRulesId}" has been deleted.` });
  };
  
  const selectedIsCustom = useMemo(() => selectedRulesId ? isCustomRuleset(selectedRulesId) : false, [selectedRulesId]);


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
              <SelectValue placeholder="Select a ruleset to edit..."/>
            </SelectTrigger>
            <SelectContent>
              {allRulesetIds.map(id => (
                <SelectItem key={id} value={id}>
                    {isCustomRuleset(id) ? `* ${id}` : id}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          
          <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="outline">
                <PlusCircle className="mr-2"/>
                Create New
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create New Custom Ruleset</DialogTitle>
                <DialogDescription>
                  Enter a unique ID and select a language for your new scenario. The language suffix (_en or _zh) will be added automatically. This will be stored in your browser's local storage.
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                  <div className="grid grid-cols-4 items-center gap-4">
                      <Label htmlFor="ruleset-id" className="text-right">
                          ID
                      </Label>
                      <Input 
                          id="ruleset-id" 
                          value={newRulesetId}
                          onChange={(e) => setNewRulesetId(e.target.value)}
                          className="col-span-3"
                          placeholder="e.g., my_awesome_story"
                      />
                  </div>
                   <div className="grid grid-cols-4 items-center gap-4">
                      <Label htmlFor="ruleset-language" className="text-right">
                          Language
                      </Label>
                       <Select value={newRulesetLanguage} onValueChange={(value) => setNewRulesetLanguage(value as 'en' | 'zh')}>
                            <SelectTrigger className="col-span-3">
                                <SelectValue placeholder="Select a language" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="en">English</SelectItem>
                                <SelectItem value="zh">Chinese</SelectItem>
                            </SelectContent>
                        </Select>
                  </div>
              </div>
              <DialogFooter>
                  <DialogClose asChild>
                      <Button variant="outline">Cancel</Button>
                  </DialogClose>
                  <Button onClick={handleConfirmCreate}>Create</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

           {selectedIsCustom && (
            <AlertDialog>
                <AlertDialogTrigger asChild>
                    <Button variant="destructive">
                        <Trash2 className="mr-2" />
                        Delete
                    </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                        <AlertDialogDescription>
                            This will permanently delete the custom ruleset <strong>{selectedRulesId}</strong> from your local browser storage. This action cannot be undone.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={handleDelete}>Confirm Delete</AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
           )}
        </div>
         <p className="text-sm text-muted-foreground mt-2">* Custom rulesets are saved in your browser's local storage.</p>
      </header>
      {isLoading ? (
        <p>Loading rules...</p>
      ) : selectedRulesId ? (
        <RulesEditor
          key={selectedRulesId} // Force re-mount on change
          rulesId={selectedRulesId}
          initialRules={rules}
          isCustom={selectedIsCustom}
        />
      ) : (
        <div className="text-center p-8 border-dashed border-2 rounded-lg">
          <p className="text-muted-foreground">No rulesets found.</p>
          <p className="text-muted-foreground mt-2">Click 'Create New' to get started.</p>
        </div>
      )}
    </main>
  );
}

export default function Page() {
  return (
    <Suspense fallback={<div className="p-8 text-center">Loading...</div>}>
      <AdminRulesPage />
    </Suspense>
  );
}

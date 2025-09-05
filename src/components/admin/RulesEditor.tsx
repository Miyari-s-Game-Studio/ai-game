// src/components/admin/RulesEditor.tsx
'use client';

import React, { useState, useRef, useEffect, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { saveRules as saveBuiltinRules } from '@/lib/rules-actions';
import { saveCustomRuleset } from '@/lib/rulesets';
import { Download, Upload, Edit, Eye, ShieldCheck, AlertTriangle, CheckCircle2, XCircle } from 'lucide-react';
import { JsonTreeView } from './JsonTreeView';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { validateRules, type ValidationError } from '@/lib/rule-validator';
import type { GameRules } from '@/types/game';
import { cn } from '@/lib/utils';


interface RulesEditorProps {
  rulesId: string;
  initialRules: string;
  isCustom: boolean;
}

const ValidatorDisplay: React.FC<{ validationResults: ValidationError[] }> = ({ validationResults }) => {
    if (validationResults.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center h-full text-center text-muted-foreground p-8">
                <CheckCircle2 className="w-16 h-16 text-emerald-500 mb-4" />
                <h3 className="text-xl font-bold">All Checks Passed</h3>
                <p>Your ruleset appears to be valid and well-formed.</p>
            </div>
        );
    }
    
    return (
        <div className="space-y-4">
            {validationResults.map((result, index) => (
                <div key={index} className={cn("flex items-start gap-4 p-4 rounded-lg border", {
                    'bg-destructive/10 border-destructive/20 text-destructive': result.type === 'error',
                    'bg-amber-500/10 border-amber-500/20 text-amber-700 dark:text-amber-400': result.type === 'warning',
                })}>
                    {result.type === 'error' ? 
                        <XCircle className="w-6 h-6 mt-1 flex-shrink-0" /> : 
                        <AlertTriangle className="w-6 h-6 mt-1 flex-shrink-0" />
                    }
                    <div>
                        <p className="font-bold">{result.message}</p>
                        {result.path && <p className="text-sm font-mono opacity-80 mt-1">Path: {result.path}</p>}
                    </div>
                </div>
            ))}
        </div>
    );
};


export function RulesEditor({ rulesId, initialRules, isCustom }: RulesEditorProps) {
  const [rules, setRules] = useState(initialRules);
  const [isSaving, setIsSaving] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();
  
  // Update state if the initialRules prop changes (e.g., when selecting a new file)
  useEffect(() => {
    setRules(initialRules);
  }, [initialRules]);


  const { parsedRules, validationResults } = useMemo(() => {
    let parsed: GameRules | { error: string };
    let validation: ValidationError[] = [];
    try {
        parsed = JSON.parse(rules);
        // Don't run detailed validation if basic parsing fails
        if (typeof parsed === 'object' && parsed !== null && !('error' in parsed)) {
             validation = validateRules(parsed as GameRules);
        }
    } catch (e: any) {
        parsed = { error: `Invalid JSON: ${e.message}` };
        validation.push({ type: 'error', message: 'The entire file is not valid JSON. Please correct the syntax errors.' });
    }
    return { parsedRules: parsed, validationResults: validation };
  }, [rules]);


  const handleSave = async () => {
    setIsSaving(true);
    try {
      const rulesObject = JSON.parse(rules);

      if (validationResults.some(r => r.type === 'error')) {
          toast({ variant: 'destructive', title: 'Validation Failed', description: 'Cannot save rules with critical errors. Please check the Validator tab.' });
          setIsSaving(false);
          return;
      }

       if (rulesObject.id !== rulesId) {
        toast({ variant: 'destructive', title: 'ID Mismatch', description: `The 'id' in the JSON ("${rulesObject.id}") does not match the selected ruleset ID ("${rulesId}").` });
        setIsSaving(false);
        return;
      }

      if (isCustom) {
        // Save to localStorage
        saveCustomRuleset(rulesObject);
        toast({ title: 'Success', description: `Custom ruleset "${rulesId}" saved to local storage.` });
      } else {
        // Save to filesystem via server action
        const result = await saveBuiltinRules(rulesId, rules);
        if (result.success) {
          toast({ title: 'Success', description: 'Game rules saved successfully.' });
        } else {
          toast({ variant: 'destructive', title: 'Error', description: result.error });
        }
      }
    } catch (e) {
      toast({ variant: 'destructive', title: 'Invalid JSON', description: 'The rules are not valid JSON. Please correct it.' });
    } finally {
      setIsSaving(false);
    }
  };

  const handleExport = () => {
    try {
        const parsed = JSON.parse(rules);
        const blob = new Blob([JSON.stringify(parsed, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${rulesId}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        toast({ title: 'Exported', description: `Rules exported as ${rulesId}.json` });
    } catch (e) {
        toast({ variant: 'destructive', title: 'Invalid JSON', description: 'Cannot export invalid JSON.' });
    }
  };

  const handleImportClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const content = e.target?.result as string;
          const parsed = JSON.parse(content);
          setRules(JSON.stringify(parsed, null, 2));
          toast({ title: 'Imported', description: 'Rules loaded into the editor. Note: you still need to save to apply them.' });
        } catch (err) {
          toast({ variant: 'destructive', title: 'Import Error', description: 'Could not parse the JSON file.' });
        }
      };
      reader.readAsText(file);
    }
  };

  const errorCount = validationResults.filter(v => v.type === 'error').length;
  const warningCount = validationResults.filter(v => v.type === 'warning').length;

  return (
    <div className="space-y-4">
       <div className="flex justify-end gap-2">
        <Button onClick={handleImportClick} variant="outline">
          <Upload className="mr-2 h-4 w-4" /> Import JSON
        </Button>
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileChange}
          accept="application/json"
          className="hidden"
        />
        <Button onClick={handleExport} variant="outline">
          <Download className="mr-2 h-4 w-4" /> Export JSON
        </Button>
        <Button onClick={handleSave} disabled={isSaving}>
          {isSaving ? 'Saving...' : (isCustom ? 'Save to Local Storage' : 'Save to File')}
        </Button>
      </div>

      <Tabs defaultValue="validator" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="validator">
                <ShieldCheck className="mr-2"/>Validator
                {errorCount > 0 && <span className="ml-2 bg-destructive text-destructive-foreground w-5 h-5 rounded-full flex items-center justify-center text-xs">{errorCount}</span>}
                {warningCount > 0 && <span className="ml-2 bg-amber-500 text-white w-5 h-5 rounded-full flex items-center justify-center text-xs">{warningCount}</span>}
            </TabsTrigger>
            <TabsTrigger value="view"><Eye className="mr-2"/>Tree View</TabsTrigger>
            <TabsTrigger value="edit"><Edit className="mr-2"/>Raw JSON</TabsTrigger>
        </TabsList>
        <TabsContent value="validator" className="p-4 border rounded-md bg-background/50 min-h-[500px]">
            <ValidatorDisplay validationResults={validationResults} />
        </TabsContent>
        <TabsContent value="view" className="p-4 border rounded-md bg-background/50 min-h-[500px]">
            <JsonTreeView data={parsedRules} />
        </TabsContent>
        <TabsContent value="edit">
            <Textarea
                value={rules}
                onChange={(e) => setRules(e.target.value)}
                rows={30}
                className="font-mono text-sm bg-background/50"
                placeholder="Enter game rules as JSON..."
            />
        </TabsContent>
      </Tabs>
       <p className="text-sm text-muted-foreground">
        Note: {isCustom 
            ? `This is a custom ruleset. Saving will update it in your browser's local storage.` 
            : `Saving will update the built-in ${rulesId}.json file on the server.`
        }
      </p>
    </div>
  );
}

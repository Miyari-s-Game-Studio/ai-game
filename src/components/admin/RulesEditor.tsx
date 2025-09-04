// src/components/admin/RulesEditor.tsx
'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { saveRules as saveBuiltinRules } from '@/lib/rules-actions';
import { saveCustomRuleset } from '@/lib/rulesets';
import { Download, Upload, Edit, Eye } from 'lucide-react';
import { JsonTreeView } from './JsonTreeView';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';


interface RulesEditorProps {
  rulesId: string;
  initialRules: string;
  isCustom: boolean;
}

export function RulesEditor({ rulesId, initialRules, isCustom }: RulesEditorProps) {
  const [rules, setRules] = useState(initialRules);
  const [isSaving, setIsSaving] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();
  
  // Update state if the initialRules prop changes (e.g., when selecting a new file)
  useEffect(() => {
    setRules(initialRules);
  }, [initialRules]);


  let parsedRules: any;
  try {
    parsedRules = JSON.parse(rules);
  } catch {
    parsedRules = { error: "Invalid JSON structure" };
  }

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const rulesObject = JSON.parse(rules);
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

      <Tabs defaultValue="view" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="view"><Eye className="mr-2"/>Tree View</TabsTrigger>
            <TabsTrigger value="edit"><Edit className="mr-2"/>Raw JSON</TabsTrigger>
        </TabsList>
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

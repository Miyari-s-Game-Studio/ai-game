// src/components/admin/RulesEditor.tsx
'use client';

import React, { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { saveRules } from '@/lib/rules-actions';
import { Download, Upload } from 'lucide-react';

interface RulesEditorProps {
  initialRules: string;
}

export function RulesEditor({ initialRules }: RulesEditorProps) {
  const [rules, setRules] = useState(initialRules);
  const [isSaving, setIsSaving] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const handleSave = async () => {
    setIsSaving(true);
    try {
      // Basic validation
      JSON.parse(rules);
      const result = await saveRules(rules);
      if (result.success) {
        toast({ title: 'Success', description: 'Game rules saved successfully.' });
      } else {
        toast({ variant: 'destructive', title: 'Error', description: result.error });
      }
    } catch (e) {
      toast({ variant: 'destructive', title: 'Invalid JSON', description: 'The rules are not valid JSON. Please correct it.' });
    } finally {
      setIsSaving(false);
    }
  };

  const handleExport = () => {
    try {
        const parsedRules = JSON.parse(rules);
        const blob = new Blob([JSON.stringify(parsedRules, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'eco-rules.json';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        toast({ title: 'Exported', description: 'Rules exported as eco-rules.json' });
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
          toast({ title: 'Imported', description: 'Rules loaded into the editor.' });
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
          {isSaving ? 'Saving...' : 'Save Rules'}
        </Button>
      </div>
      <Textarea
        value={rules}
        onChange={(e) => setRules(e.target.value)}
        rows={30}
        className="font-mono text-sm bg-background/50"
        placeholder="Enter game rules as JSON..."
      />
       <p className="text-sm text-muted-foreground">
        Note: For now, editing here modifies the `eco-rules.ts` file. Be careful with the structure.
      </p>
    </div>
  );
}

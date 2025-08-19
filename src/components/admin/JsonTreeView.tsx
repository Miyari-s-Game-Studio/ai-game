// src/components/admin/JsonTreeView.tsx
'use client';

import React from 'react';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible"
import { ChevronRight, ChevronsUpDown } from 'lucide-react';

interface JsonTreeViewProps {
    data: any;
    level?: number;
}

const getDataType = (value: any) => {
    if (Array.isArray(value)) return 'array';
    if (typeof value === 'object' && value !== null) return 'object';
    if (typeof value === 'string') return 'string';
    if (typeof value === 'number') return 'number';
    if (typeof value === 'boolean') return 'boolean';
    return 'null';
};

const TypeBadge: React.FC<{ type: string; length?: number }> = ({ type, length }) => {
    const typeStyles: Record<string, string> = {
        object: 'text-blue-500',
        array: 'text-green-500',
        string: 'text-rose-500',
        number: 'text-amber-500',
        boolean: 'text-violet-500',
        null: 'text-gray-500'
    };
    return (
        <span className={`text-xs font-mono ml-2 ${typeStyles[type]}`}>
            {type}{length !== undefined ? `[${length}]` : ''}
        </span>
    );
}

const JsonNode: React.FC<{ nodeKey: string, nodeValue: any, level: number }> = ({ nodeKey, nodeValue, level }) => {
    const dataType = getDataType(nodeValue);
    const isCollapsible = dataType === 'object' || dataType === 'array';

    const renderValue = () => {
        switch (dataType) {
            case 'string':
                return <span className="text-rose-600 dark:text-rose-400">"{nodeValue}"</span>;
            case 'number':
                return <span className="text-amber-600 dark:text-amber-400">{nodeValue}</span>;
            case 'boolean':
                return <span className="text-violet-600 dark:text-violet-400">{String(nodeValue)}</span>;
            case 'null':
                return <span className="text-gray-500">null</span>;
            default:
                return null;
        }
    };

    if (isCollapsible) {
        const entries = Object.entries(nodeValue);
        return (
            <Collapsible defaultOpen={level < 2}>
                <CollapsibleTrigger asChild>
                    <div className="flex items-center cursor-pointer hover:bg-muted/50 p-1 rounded-md">
                        <ChevronRight className="w-4 h-4 mr-2 transform transition-transform duration-200 [&[data-state=open]]:rotate-90" />
                        <span className="font-semibold text-primary/80">{nodeKey}:</span>
                        <TypeBadge type={dataType} length={entries.length} />
                    </div>
                </CollapsibleTrigger>
                <CollapsibleContent style={{ paddingLeft: `${(level + 1) * 20}px` }} className="border-l border-dashed border-primary/20 ml-[7px]">
                   {entries.map(([key, value]) => (
                        <JsonNode key={key} nodeKey={key} nodeValue={value} level={level + 1} />
                   ))}
                </CollapsibleContent>
            </Collapsible>
        )
    }

    return (
        <div className="flex items-center p-1" style={{ paddingLeft: '20px' }}>
            <span className="font-semibold text-primary/80 mr-2">{nodeKey}:</span>
            {renderValue()}
        </div>
    );
};

export const JsonTreeView: React.FC<JsonTreeViewProps> = ({ data, level = 0 }) => {
    if (typeof data !== 'object' || data === null) {
        return <div className="p-4 font-mono">Not a valid JSON object.</div>
    }
    
    if (data.error) {
        return <div className="p-4 font-mono text-destructive">{data.error}</div>
    }

    return (
        <div className="font-mono text-sm space-y-1">
            {Object.entries(data).map(([key, value]) => (
                <JsonNode key={key} nodeKey={key} nodeValue={value} level={level} />
            ))}
        </div>
    );
};


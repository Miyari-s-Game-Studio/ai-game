import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CheckCircle2, XCircle } from 'lucide-react';
import * as LucideIcons from 'lucide-react';

interface CountersDisplayProps {
  counters: Record<string, number | boolean>;
  iconMap?: Record<string, string>;
}

const getDynamicIcon = (iconName: string): React.ElementType => {
    if (LucideIcons[iconName as keyof typeof LucideIcons]) {
        return LucideIcons[iconName as keyof typeof LucideIcons];
    }
    return LucideIcons.Star; // Default icon
};


// Function to find an icon based on keywords in the counter's name
const getIconForCounter = (label: string, iconMap?: Record<string, string>): React.ElementType => {
    if (!iconMap) return LucideIcons.Star;
    const lowerLabel = label.toLowerCase();
    for (const keyword in iconMap) {
        if (lowerLabel.includes(keyword)) {
            const iconName = iconMap[keyword];
            return getDynamicIcon(iconName);
        }
    }
    return getDynamicIcon(iconMap.default || 'Star');
}


const CounterItem: React.FC<{ label: string; value: number | boolean; iconMap?: Record<string, string> }> = ({ label, value, iconMap }) => {
    const Icon = getIconForCounter(label, iconMap);

    return (
        <div className="flex items-center justify-between p-2 rounded-lg bg-background/70">
            <div className="flex items-center gap-2">
                <Icon className="w-5 h-5 text-primary" />
                <span className="font-medium capitalize">{label.replace(/_/g, ' ')}</span>
            </div>
            {typeof value === 'boolean' ? (
                <Badge variant={value ? 'default' : 'secondary'} className={value ? 'bg-green-600' : ''}>
                    {value ? <CheckCircle2 className="w-4 h-4 mr-1" /> : <XCircle className="w-4 h-4 mr-1" />}
                    {value ? 'Obtained' : 'Missing'}
                </Badge>
            ) : (
                <Badge variant="default" className="text-lg">{value}</Badge>
            )}
        </div>
    );
};

const CountersDisplay: React.FC<CountersDisplayProps> = ({ counters, iconMap }) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-xl font-headline">Key Items & Info</CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        {Object.entries(counters).map(([key, value]) => (
          <CounterItem key={key} label={key} value={value} iconMap={iconMap} />
        ))}
      </CardContent>
    </Card>
  );
};

export default CountersDisplay;

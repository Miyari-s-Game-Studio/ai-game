import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Beaker, FileText, CheckCircle2, XCircle, Handshake, Key, Star } from 'lucide-react';

interface CountersDisplayProps {
  counters: Record<string, number | boolean>;
}

// A more generic mapping of keywords to icons.
const counterIcons: { [key: string]: React.ElementType } = {
    clues: FileText,
    clue: FileText,
    notes: FileText,
    samples: Beaker,
    sample: Beaker,
    testimony: Handshake,
    agreement: Handshake,
    key: Key,
    item: Star,
    shutdown_ok: CheckCircle2,
};

// Function to find an icon based on keywords in the counter's name
const getIconForCounter = (label: string): React.ElementType => {
    const lowerLabel = label.toLowerCase();
    for (const keyword in counterIcons) {
        if (lowerLabel.includes(keyword)) {
            return counterIcons[keyword];
        }
    }
    return Star; // Default icon
}


const CounterItem: React.FC<{ label: string; value: number | boolean }> = ({ label, value }) => {
    const Icon = getIconForCounter(label);

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

const CountersDisplay: React.FC<CountersDisplayProps> = ({ counters }) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-xl font-headline">Key Items & Info</CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        {Object.entries(counters).map(([key, value]) => (
          <CounterItem key={key} label={key} value={value} />
        ))}
      </CardContent>
    </Card>
  );
};

export default CountersDisplay;

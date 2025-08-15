import type { MatchEvent } from '@/types/kabaddi';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { History, Zap, Timer as TimerIcon, Hourglass, Play, Flag } from 'lucide-react';

const eventIcons: Record<MatchEvent['type'], React.ReactNode> = {
    raid: <Zap className="h-4 w-4 text-accent" />,
    penalty: <Flag className="h-4 w-4 text-destructive" />,
    timeout: <TimerIcon className="h-4 w-4 text-blue-400" />,
    half: <Hourglass className="h-4 w-4 text-primary" />,
    start: <Play className="h-4 w-4 text-green-500" />,
    end: <Flag className="h-4 w-4 text-destructive" />,
};

interface MatchHistoryProps {
  history: MatchEvent[];
}

export function MatchHistory({ history }: MatchHistoryProps) {
  return (
    <Card className="mt-8">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 font-headline">
          <History className="h-6 w-6 text-primary" />
          Match Log
        </CardTitle>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-64 w-full">
          <div className="p-4">
            {history.length > 0 ? (
                [...history].reverse().map((event, index) => (
                    <div key={index}>
                        <div className="flex items-start gap-4">
                            <div className="mt-1">{eventIcons[event.type]}</div>
                            <div className="flex-1">
                                <p className="text-sm font-medium">{event.summary}</p>
                                <p className="text-xs text-muted-foreground">
                                    {new Date(event.timestamp).toLocaleTimeString()}
                                </p>
                            </div>
                        </div>
                        {index < history.length - 1 && <Separator className="my-4" />}
                    </div>
                ))
            ) : (
                <p className="text-center text-muted-foreground">Match events will appear here.</p>
            )}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}

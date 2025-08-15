import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Timer, Play, Pause, Hourglass } from 'lucide-react';
import type { MatchStatus } from '@/types/kabaddi';

interface TimerControlProps {
  timer: number;
  half: 1 | 2;
  status: MatchStatus;
  onTogglePause: () => void;
  onStartHalfTime: () => void;
}

const formatTime = (seconds: number) => {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
};

export function TimerControl({ timer, half, status, onTogglePause, onStartHalfTime }: TimerControlProps) {
  return (
    <Card className="text-center">
      <CardHeader>
        <CardTitle className="font-headline flex items-center justify-center gap-2">
          <Timer className="h-6 w-6 text-primary" />
          <span>Half {half}</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-6xl font-bold font-mono text-primary tabular-nums">
          {formatTime(timer)}
        </p>
        <div className="flex justify-center gap-4">
          <Button onClick={onTogglePause} variant="outline" disabled={status !== 'playing' && status !== 'paused'}>
            {status === 'playing' ? <Pause className="mr-2 h-4 w-4" /> : <Play className="mr-2 h-4 w-4" />}
            {status === 'playing' ? 'Pause' : 'Resume'}
          </Button>
          {half === 1 && timer === 0 && (
            <Button onClick={onStartHalfTime}>
              <Hourglass className="mr-2 h-4 w-4" />
              Start Half Time
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

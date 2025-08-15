import type { Team, TeamId, Player } from '@/types/kabaddi';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { User, UserX, ShieldCheck, Timer, Zap } from 'lucide-react';
import { Separator } from '../ui/separator';

interface TeamPanelProps {
  team: Team;
  teamId: TeamId;
  isRaiding: boolean;
  onTakeTimeout: (teamId: TeamId) => void;
}

function PlayerListItem({ player }: { player: Player }) {
    return (
        <li className="flex items-center justify-between p-2 rounded-md hover:bg-muted/50 transition-colors">
            <div className="flex items-center gap-2">
                {player.status === 'active' ? <User className="h-4 w-4 text-green-500" /> : <UserX className="h-4 w-4 text-destructive" />}
                <span className="font-medium">{player.name}</span>
            </div>
            <div className="flex gap-2 text-xs">
                <Badge variant="outline" className="px-1.5 py-0.5">R: {player.stats.raidPoints}</Badge>
                <Badge variant="outline" className="px-1.5 py-0.5">T: {player.stats.tacklePoints}</Badge>
            </div>
        </li>
    )
}

export function TeamPanel({ team, teamId, isRaiding, onTakeTimeout }: TeamPanelProps) {
  const activePlayers = team.players.filter((p) => p.status === 'active');
  const outPlayers = team.players.filter((p) => p.status === 'out');

  return (
    <Card className={isRaiding ? 'border-primary ring-2 ring-primary shadow-lg' : ''}>
      <CardHeader>
        <CardTitle className="flex items-center justify-between font-headline">
          <div className="flex items-center gap-2">
            {isRaiding && <Zap className="h-6 w-6 text-primary animate-pulse" />}
            {team.name}
          </div>
          <span className="text-4xl text-primary">{team.score}</span>
        </CardTitle>
        <div className="flex items-center justify-between text-sm text-muted-foreground">
            <div className="flex items-center gap-1">
                <ShieldCheck className="h-4 w-4" />
                <span>Active: {activePlayers.length}</span>
            </div>
            <Button variant="ghost" size="sm" onClick={() => onTakeTimeout(teamId)} disabled={team.timeouts === 0}>
                <Timer className="mr-2 h-4 w-4" />
                Timeouts: {team.timeouts}
            </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div>
            <h4 className="font-semibold text-sm mb-2">Active Players</h4>
            <ul className="space-y-1">
                {activePlayers.map((player) => <PlayerListItem key={player.id} player={player} />)}
            </ul>
        </div>
        {outPlayers.length > 0 && (
            <>
                <Separator className="my-4" />
                <div>
                    <h4 className="font-semibold text-sm mb-2">Out Players</h4>
                    <ul className="space-y-1 opacity-60">
                         {outPlayers.sort((a,b) => a.outOrder! - b.outOrder!).map((player) => <PlayerListItem key={player.id} player={player} />)}
                    </ul>
                </div>
            </>
        )}
      </CardContent>
    </Card>
  );
}

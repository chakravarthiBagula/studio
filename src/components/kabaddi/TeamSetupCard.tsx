'use client';

import { useState } from 'react';
import type { Player, Team, TeamId } from '@/types/kabaddi';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Trash2, UserPlus, PlayCircle, Shield } from 'lucide-react';
import { ScrollArea } from '../ui/scroll-area'; // Assuming ScrollArea might be needed if player list grows

interface TeamSetupCardProps {
    teamId: TeamId;
    team: Team;
    onAddPlayer: (teamId: TeamId, playerName: string) => void;
    onRemovePlayer: (teamId: TeamId, playerId: string) => void;
    onUpdateTeamName: (teamId: TeamId, name: string) => void;
}

export function TeamSetupCard({ teamId, team, onAddPlayer, onRemovePlayer, onUpdateTeamName }: TeamSetupCardProps) {
    const [playerName, setPlayerName] = useState('');
    const [playerPhoneNumber, setPlayerPhoneNumber] = useState('');

    const handleAddPlayer = () => {
        if (playerName.trim()) {
            onAddPlayer(teamId, playerName.trim());
            setPlayerName('');
        }
    };

    return (
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <Shield className="text-primary" />
                    <Input
                        id={`${teamId}-name`}
                        value={team.name}
                        onChange={(e) => onUpdateTeamName(teamId, e.target.value)}
                        className="text-2xl font-bold font-headline border-0 shadow-none focus-visible:ring-0 p-0 h-auto"
                    />
                </CardTitle>
                <CardDescription>Add at least 7 players to the team.</CardDescription>
            </CardHeader>
            <CardContent>
                <div className="space-y-4">
                    <div className="flex items-center gap-2">
                        <Input
                            id={`${teamId}-player`}
                            placeholder="New Player Name"
                            value={playerName}
                            onChange={(e) => setPlayerName(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && handleAddPlayer()}
                        />
                        <Button onClick={handleAddPlayer} size="icon" variant="outline">
                            <UserPlus className="h-4 w-4" />
                        </Button>
                    </div>
                    <Separator />
                    <div className="space-y-2">
                        <h4 className="font-medium text-sm">Player List ({team.players.length}/7)</h4>
                         <ScrollArea className="h-32 mt-2 p-2 border rounded-md"> {/* Added ScrollArea */}
                            <ul className="space-y-2">
                                {team.players.map((player) => (
                                    <li key={player.id} className="flex items-center justify-between bg-muted/50 p-2 rounded-md">
                                        <span>{player.name}</span>
                                        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => onRemovePlayer(teamId, player.id)}>
                                            <Trash2 className="h-4 w-4 text-destructive" />
                                        </Button>
                                    </li>
                                ))}
                            </ul>
                        </ScrollArea> {/* Closed ScrollArea */}
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}
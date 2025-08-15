'use client';

import { useState } from 'react';
import type { Team, RaidData } from '@/types/kabaddi';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { KabaddiRaiderIcon } from './icons';
import { useToast } from "@/hooks/use-toast";
import { ScrollArea } from '../ui/scroll-area';

interface RaidFormProps {
  raidingTeam: Team;
  defendingTeam: Team;
  onProcessRaid: (raidData: RaidData) => void;
}

export function RaidForm({ raidingTeam, defendingTeam, onProcessRaid }: RaidFormProps) {
  const [raiderId, setRaiderId] = useState<string | null>(null);
  const [touchedPlayerIds, setTouchedPlayerIds] = useState<string[]>([]);
  const [bonus, setBonus] = useState(false);
  const [isTackled, setIsTackled] = useState(false);
  const [tackledById, setTackledById] = useState<string | null>(null);
  const { toast } = useToast();

  const activeRaiders = raidingTeam.players.filter((p) => p.status === 'active');
  const activeDefenders = defendingTeam.players.filter((p) => p.status === 'active');

  const handleTouchedChange = (playerId: string) => {
    setTouchedPlayerIds((prev) =>
      prev.includes(playerId) ? prev.filter((id) => id !== playerId) : [...prev, playerId]
    );
  };

  const resetForm = () => {
    setRaiderId(null);
    setTouchedPlayerIds([]);
    setBonus(false);
    setIsTackled(false);
    setTackledById(null);
  };

  const handleSubmit = () => {
    if (!raiderId) {
      toast({ title: "Validation Error", description: "Please select a raider.", variant: "destructive" });
      return;
    }
    if (isTackled && !tackledById) {
        toast({ title: "Validation Error", description: "Please select the tackler.", variant: "destructive" });
        return;
    }
    if (!isTackled && touchedPlayerIds.length === 0 && !bonus) {
        // Empty raid
    }
    
    onProcessRaid({
      raiderId,
      touchedPlayerIds: isTackled ? [] : touchedPlayerIds,
      bonus: isTackled ? false : bonus,
      tackledById,
    });
    resetForm();
  };
  
  const isBonusAvailable = activeDefenders.length >= 6;

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 font-headline">
          <KabaddiRaiderIcon className="h-6 w-6 text-primary" />
          Raid Log: {raidingTeam.name}
        </CardTitle>
        <CardDescription>Record the outcome of the current raid.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-2">
          <Label htmlFor="raider-select">Select Raider</Label>
          <Select value={raiderId ?? ''} onValueChange={setRaiderId}>
            <SelectTrigger id="raider-select">
              <SelectValue placeholder="Choose a raider..." />
            </SelectTrigger>
            <SelectContent>
              {activeRaiders.map((player) => (
                <SelectItem key={player.id} value={player.id}>
                  {player.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        
        <Separator />

        <div className="space-y-4">
            <div className="flex items-center space-x-2">
                <Checkbox id="tackled-checkbox" checked={isTackled} onCheckedChange={(checked) => setIsTackled(Boolean(checked))} />
                <Label htmlFor="tackled-checkbox" className="font-medium">Raider Tackled?</Label>
            </div>
            {isTackled && (
                 <div className="space-y-2 pl-6">
                    <Label htmlFor="tackler-select">Tackled By</Label>
                    <Select value={tackledById ?? ''} onValueChange={setTackledById}>
                        <SelectTrigger id="tackler-select">
                        <SelectValue placeholder="Choose tackler..." />
                        </SelectTrigger>
                        <SelectContent>
                        {activeDefenders.map((player) => (
                            <SelectItem key={player.id} value={player.id}>
                            {player.name}
                            </SelectItem>
                        ))}
                        </SelectContent>
                    </Select>
                 </div>
            )}
        </div>

        {!isTackled && (
            <div className="space-y-4">
                <div>
                    <Label className="font-medium">Defenders Touched ({touchedPlayerIds.length})</Label>
                    <ScrollArea className="h-32 mt-2 p-2 border rounded-md">
                        <div className="space-y-2">
                        {activeDefenders.map((player) => (
                            <div key={player.id} className="flex items-center space-x-2">
                            <Checkbox
                                id={`touch-${player.id}`}
                                checked={touchedPlayerIds.includes(player.id)}
                                onCheckedChange={() => handleTouchedChange(player.id)}
                            />
                            <Label htmlFor={`touch-${player.id}`}>{player.name}</Label>
                            </div>
                        ))}
                        </div>
                    </ScrollArea>
                </div>
                
                <div className="flex items-center space-x-2">
                    <Checkbox id="bonus-checkbox" disabled={!isBonusAvailable} checked={bonus} onCheckedChange={(checked) => setBonus(Boolean(checked))} />
                    <Label htmlFor="bonus-checkbox" className={`${!isBonusAvailable ? 'text-muted-foreground' : ''}`}>Bonus Point</Label>
                    {!isBonusAvailable && <p className="text-xs text-muted-foreground">(Needs 6+ defenders)</p>}
                </div>
            </div>
        )}

        <Button onClick={handleSubmit} className="w-full bg-accent hover:bg-accent/90 text-accent-foreground">
          Submit Raid
        </Button>
      </CardContent>
    </Card>
  );
}

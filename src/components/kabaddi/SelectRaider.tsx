'use client';

import { useState } from 'react';
import type { Team } from '@/types/kabaddi';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface SelectRaiderProps {
  raidingTeam: Team;
  onRaiderSelected: (raiderId: string) => void;
  startRaidTimer: () => void;
}

export function SelectRaider({ raidingTeam, onRaiderSelected }: SelectRaiderProps) {
  const [selectedRaiderId, setSelectedRaiderId] = useState<string | null>(null);

  const activeRaiders = raidingTeam.players.filter(player => player.status === 'active');

  const handleNextClick = () => {
    if (selectedRaiderId) {
      onRaiderSelected(selectedRaiderId);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="font-headline text-xl">Select Raider for {raidingTeam.name}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {activeRaiders.length > 0 ? (
          <RadioGroup onValueChange={setSelectedRaiderId} value={selectedRaiderId ?? ''}>
            {activeRaiders.map(player => (
              <div key={player.id} className="flex items-center space-x-2">
                <RadioGroupItem value={player.id} id={`raider-${player.id}`} />
                <Label htmlFor={`raider-${player.id}`}>{player.name}</Label>
              </div>
            ))}
          </RadioGroup>
        ) : (
          <p className="text-muted-foreground">No active players available to raid.</p>
        )}
        <Button onClick={handleNextClick} disabled={!selectedRaiderId || activeRaiders.length === 0}>
          Next
        </Button>
      </CardContent>
    </Card>
  );
}
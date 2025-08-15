'use client';

import { useState } from 'react'; // Import useState
import type { useKabaddiMatch } from '@/hooks/useKabaddiMatch';
import { TeamPanel } from './TeamPanel';
import { RaidForm } from './RaidForm'; // We will modify or replace this later
import { TimerControl } from './TimerControl';
import { MatchHistory } from './MatchHistory';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button'; // Import Button
import { Trophy } from 'lucide-react';
import { SelectRaider } from './SelectRaider'; // Import SelectRaider

type ScoreboardProps = ReturnType<typeof useKabaddiMatch>;

export function Scoreboard({ state, processRaid, takeTimeout, togglePause, startHalfTime, raidTimer, startRaidTimer, stopRaidTimer }: ScoreboardProps) {
  const [raidState, setRaidState] = useState<'idle' | 'selectRaider' | 'processRaid' | 'displayScore'>('idle'); // Declare raidState

  const [currentRaiderId, setCurrentRaiderId] = useState<string | null>(null); // Add state for current raider
  const raidingTeam = state.teams[state.raidingTeam];
  const defendingTeam = state.teams[state.raidingTeam === 'teamA' ? 'teamB' : 'teamA'];

  const getWinner = () => {
    if (state.teams.teamA.score > state.teams.teamB.score) return state.teams.teamA.name;
    if (state.teams.teamB.score > state.teams.teamA.score) return state.teams.teamB.name;
    return "It's a tie!";
  }

  return (
    <div className="space-y-6">
       {state.status === 'finished' && (
        <Card className="text-center bg-primary/10 border-primary">
          <CardHeader>
            <CardTitle className="font-headline text-3xl text-primary flex items-center justify-center gap-2">
                <Trophy /> Match Finished
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{getWinner() === "It's a tie!" ? getWinner() : `${getWinner()} wins!`}</p>
            <p className="text-4xl font-headline mt-2">{state.teams.teamA.score} - {state.teams.teamB.score}</p>
          </CardContent>
        </Card>
      )}

      {/* Conditional rendering based on raidState and match status */}
      {state.status === 'playing' && raidState === 'idle' && (
        <div className="flex justify-center">
          <Button size="lg" onClick={() => setRaidState('selectRaider')}>
            Start New Raid
          </Button>
        </div>
      )}

      {/* Render SelectRaider when in 'selectRaider' state */}
      {state.status === 'playing' && raidState === 'selectRaider' && (
          <SelectRaider
              raidingTeam={raidingTeam}
              onRaiderSelected={(raiderId) => {
                  setCurrentRaiderId(raiderId);
                  setRaidState('processRaid');
                  startRaidTimer(); // Start the raid timer when raider is selected
              }}
              startRaidTimer={startRaidTimer} // Pass startRaidTimer
          />
      )}

      {/* Render RaidForm or raid processing UI when in 'processRaid' state */}
      {(state.status !== 'finished' && state.status !== 'halftime' && raidState === 'processRaid') && (
           // Existing layout for TimerControl, RaidForm, TeamPanels
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
                <TeamPanel team={state.teams.teamA} teamId="teamA" isRaiding={state.raidingTeam === 'teamA'} onTakeTimeout={takeTimeout} />
                <div className="space-y-6 lg:order-none order-first">
                    {/* TimerControl always visible during playing state */}
                    <TimerControl
                        timer={state.timer}
                        half={state.currentHalf}
                        raidTimer={raidTimer} // Pass raidTimer to TimerControl
                        status={state.status}
                        onTogglePause={togglePause}
                        onStartHalfTime={startHalfTime}
                    />
                     {/* RaidForm handles processing raid details */}
                    <RaidForm
                        defendingTeam={defendingTeam}
                        raiderId={currentRaiderId!} // Pass the selected raider ID
                        onProcessRaid={(raidData) => {
                            processRaid(raidData); // Process the raid
                            setRaidState('idle'); // Go back to idle state
                            stopRaidTimer(); // Stop the raid timer after processing
                            setCurrentRaiderId(null); // Reset the current raider
                        }}
                        stopRaidTimer={stopRaidTimer} // Pass stopRaidTimer - ADDED THIS LINE
                    />
                </div>

                <TeamPanel team={state.teams.teamB} teamId="teamB" isRaiding={state.raidingTeam === 'teamB'} onTakeTimeout={takeTimeout} />
            </div>
        )}

        {/* Render the scoreboard layout when in 'displayScore' state or similar intermediate states if needed */}
        {state.status === 'playing' && raidState === 'displayScore' && (
             <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
                <TeamPanel team={state.teams.teamA} teamId="teamA" isRaiding={state.raidingTeam === 'teamA'} onTakeTimeout={takeTimeout} />
                <div className="space-y-6 lg:order-none order-first">
                    <TimerControl
                        timer={state.timer}
                        half={state.currentHalf}
                        raidTimer={raidTimer} // Pass raidTimer to TimerControl
                        status={state.status}
                        onTogglePause={togglePause}
                        onStartHalfTime={startHalfTime}
                    />
                    {/* Potentially display a brief score update or just the TimerControl */}
                    {/* Then transition back to 'idle' to start a new raid */}
                </div>
                <TeamPanel team={state.teams.teamB} teamId="teamB" isRaiding={state.raidingTeam === 'teamB'} onTakeTimeout={takeTimeout} />
            </div>
        )}


      {/* Existing halftime card */}
      {state.status === 'halftime' && (
          <Card className="text-center">
              <CardHeader>
                  <CardTitle className="font-headline text-2xl">Half Time</CardTitle>
              </CardHeader>
              <CardContent>
                  <p>Second half will begin shortly.</p>
              </CardContent>
           </Card>
      )}

      {/* Match History will always be visible below */}
      <MatchHistory history={state.matchHistory} />
    </div>
  );
}

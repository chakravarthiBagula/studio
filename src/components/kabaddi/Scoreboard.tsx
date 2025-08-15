import type { useKabaddiMatch } from '@/hooks/useKabaddiMatch';
import { TeamPanel } from './TeamPanel';
import { RaidForm } from './RaidForm';
import { TimerControl } from './TimerControl';
import { MatchHistory } from './MatchHistory';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Trophy } from 'lucide-react';

type ScoreboardProps = ReturnType<typeof useKabaddiMatch>;

export function Scoreboard({ state, processRaid, takeTimeout, togglePause, startHalfTime }: ScoreboardProps) {
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

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        <TeamPanel team={state.teams.teamA} teamId="teamA" isRaiding={state.raidingTeam === 'teamA'} onTakeTimeout={takeTimeout} />
        
        <div className="space-y-6 lg:order-none order-first">
            <TimerControl 
                timer={state.timer} 
                half={state.currentHalf}
                status={state.status}
                onTogglePause={togglePause}
                onStartHalfTime={startHalfTime}
            />
            {state.status !== 'finished' && state.status !== 'halftime' && (
                <RaidForm 
                    raidingTeam={raidingTeam} 
                    defendingTeam={defendingTeam} 
                    onProcessRaid={processRaid} 
                />
            )}
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
        </div>

        <TeamPanel team={state.teams.teamB} teamId="teamB" isRaiding={state.raidingTeam === 'teamB'} onTakeTimeout={takeTimeout} />
      </div>

      <MatchHistory history={state.matchHistory} />
    </div>
  );
}

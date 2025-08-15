'use client';

import { MatchSetup } from '@/components/kabaddi/MatchSetup';
import { Scoreboard } from '@/components/kabaddi/Scoreboard';
import { useKabaddiMatch } from '@/hooks/useKabaddiMatch';

export default function KabaddiScoreMasterPage() {
  const kabaddiMatch = useKabaddiMatch();

  console.log('kabaddiMatch.state.status:', kabaddiMatch.state.status);
  console.log('kabaddiMatch.state.teams:', kabaddiMatch.state.teams);

  return (
    <div className="bg-background min-h-screen text-foreground font-body p-4 sm:p-6 lg:p-8">
      <div className="container mx-auto">
        <header className="text-center mb-8">
          <h1 className="text-4xl sm:text-5xl font-headline font-bold text-primary">
            Kabaddi ScoreMaster
          </h1>
          <p className="text-muted-foreground mt-2">
            The ultimate tool for scoring Kabaddi matches in real-time.
          </p>
        </header>

        <main>
          {kabaddiMatch.state.status === 'setup' ? (
            <MatchSetup
              teams={kabaddiMatch.state.teams}
              onStartMatch={kabaddiMatch.startMatch}
              onAddPlayer={kabaddiMatch.addPlayer}
              onRemovePlayer={kabaddiMatch.removePlayer}
              onUpdateTeamName={kabaddiMatch.updateTeamName}
            />
          ) : (
            <Scoreboard {...kabaddiMatch} />
          )}
        </main>
      </div>
    </div>
  );
}
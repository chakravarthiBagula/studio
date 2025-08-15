'use client';

import { useParams } from 'next/navigation';
import { useKabaddiMatch } from '@/hooks/useKabaddiMatch';
import { Scoreboard } from '@/components/kabaddi/Scoreboard';
import { MatchState } from '@/types/kabaddi'; // Assuming MatchState type is available

export default function ScoringPage() {
  const params = useParams();
  const matchId = params.matchId as string;

  const kabaddiMatch = useKabaddiMatch(matchId);

  // Optional: Add loading state or check if the match data is loaded
  // You might need to add a 'loading' state to your useKabaddiMatch hook
  // For simplicity, we'll just check if the initial state has been loaded or is in 'setup'
  if (!kabaddiMatch.state || (kabaddiMatch.state.status === 'setup' && !matchId)) {
      return <div>Loading Match...</div>; // Basic loading indicator
  }


  return (
    <Scoreboard {...kabaddiMatch} />
  );
}
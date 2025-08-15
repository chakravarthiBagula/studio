'use client';

import React, { useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
// You might need to import types for Team if passing team data
import type { Team, TeamId } from '@/types/kabaddi'; // Import Team and TeamId types
import { v4 as uuidv4 } from 'uuid'; // Import uuidv4

export default function TossPage() {
  const [tossWinner, setTossWinner] = useState<'teamA' | 'teamB' | null>(null);
  const [winnerChoice, setWinnerChoice] = useState<'raid' | 'court' | null>(null);

  // Placeholder for teams (you'll receive this data from Match Setup page)
  // const teamA = { name: 'Team A' }; // Replace with actual team data
  // const teamB = { name: 'Team B' }; // Replace with actual team data

  const searchParams = useSearchParams();
  const router = useRouter(); // Initialize useRouter

  const teamsParam = searchParams.get('teams');
  const durationParam = searchParams.get('duration');

  // State to store retrieved data
  const [matchTeams, setMatchTeams] = useState<Record<TeamId, Team> | null>(null); // Use a proper type later
  const [matchDuration, setMatchDuration] = useState<number | undefined>(undefined);

  // Parse data on component mount or when params change
  React.useEffect(() => {
    if (teamsParam) {
      try {
        setMatchTeams(JSON.parse(decodeURIComponent(teamsParam)));
      } catch (error) {
        console.error("Failed to parse teams data from URL:", error);
        // Handle error (e.g., redirect to setup page)
      }
    }
    if (durationParam) {
      setMatchDuration(parseInt(durationParam, 10) || undefined); // Handle potential parsing errors
    }
  }, [teamsParam, durationParam]); // Re-run effect if params change

  const handleSimulateToss = () => {
    if (!matchTeams) {
      console.error("Teams data not loaded yet.");
      return; // Don't simulate if teams data is missing
    }

    // Simulate a random winner between teamA and teamB
    // You might want to make this more interactive later
    const winner = Math.random() < 0.5 ? 'teamA' : 'teamB';
    setTossWinner(winner);
  };

  const handleWinnerChoice = (choice: 'raid' | 'court') => {
     if (!tossWinner) return; // Should not happen if the UI is correct
    setWinnerChoice(choice);
  };

  // Effect to handle navigation after winnerChoice is set
  React.useEffect(() => {
    if (winnerChoice && tossWinner && matchTeams !== null && matchDuration !== undefined) {
      // Determine the initial raiding team
      const initialRaidingTeam: TeamId =
        (winnerChoice === 'raid') ? tossWinner : (tossWinner === 'teamA' ? 'teamB' : 'teamA');

      // Generate a unique match ID
      const matchId = uuidv4();

      // Navigate to the New Match Initiation page, passing all data
      const matchData = JSON.stringify({ teams: matchTeams, duration: matchDuration, initialRaidingTeam });
      router.push(`/start-match/new?data=${encodeURIComponent(matchData)}`);

    }
  }, [winnerChoice, tossWinner, matchTeams, matchDuration, router]); // Dependencies

  // Render loading state or error if data is not ready
  if (!matchTeams || matchDuration === undefined) {
    return <div>Loading match data...</div>;
  }
  const teamA = matchTeams.teamA;
  const teamB = matchTeams.teamB;

  return (
    <div className="space-y-8 p-4">
      <h1 className="text-2xl font-bold mb-4">Match Toss</h1>

        <h2 className="text-xl font-bold">Toss Simulation</h2>
        <p>Teams: {teamA.name} vs {teamB.name}</p>
        <p>Duration per half: {matchDuration} minutes</p> {/* Display duration */}
        <button
          onClick={handleSimulateToss}
          className="px-4 py-2 bg-blue-500 text-white rounded disabled:opacity-50"
          disabled={tossWinner !== null} // Disable after toss
        >
          Simulate Toss
        </button>
        {tossWinner && (
          <p className="text-lg font-bold">Winner: {tossWinner === 'teamA' ? teamA.name : teamB.name}</p>
        )} {/* Use matchTeams here eventually */}
      </div>

      {tossWinner && winnerChoice === null && ( // Show choice options only after toss and before choice
        <div className="space-y-4">
          <h2 className="text-xl font-bold">{tossWinner === 'teamA' ? teamA.name : teamB.name}'s Choice</h2>
          <p>Choose to:</p>
          <div className="flex gap-4">
            <button
              onClick={() => handleWinnerChoice('raid')}
              className="px-4 py-2 bg-green-500 text-white rounded"
            >
              Raid First
            </button>
            <button
              onClick={() => handleWinnerChoice('court')}
              className="px-4 py-2 bg-yellow-500 text-white rounded"
            >
              Choose Court
            </button>
          </div>
        </div>
      )}

    </div>
  );
}
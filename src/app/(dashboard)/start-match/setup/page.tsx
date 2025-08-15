'use client';

import { useState } from 'react';
import { TeamSetupCard } from '@/components/kabaddi/TeamSetupCard'; // Adjust the path if necessary
import type { Team, TeamId, Player } from '@/types/kabaddi'; // Import Player type
import { Button } from '@/components/ui/button';
import { searchPlayerByName, addPlayer, searchPlayerByPhoneNumber } from '@/lib/firestore/players'; // Import player database functions
import { searchPlayerByName, addPlayer } from '@/lib/firestore/players'; // Import player database functions
import { useRouter } from 'next/navigation'; // Import useRouter for navigation
// Assuming initialPlayerStats is defined in your types or a constants file
// For now, let's define it here for completeness
const initialPlayerStats = {
  raidPoints: 0,
  tacklePoints: 0,
  totalRaids: 0,
  successfulRaids: 0,
  unsuccessfulRaids: 0,
  emptyRaids: 0,
  superRaids: 0,
  superTackles: 0,
};

const createPlayer = (name: string, phoneNumber?: string): Player => ({
  id: uuidv4(),
  name,
  status: 'active',
  outOrder: null,
  stats: { ...initialPlayerStats },
});


export default function MatchSetupPage() {

  const [teams, setTeams] = useState<Record<TeamId, Team>>({
    teamA: { name: 'Team A', score: 0, players: [], timeouts: 0 }, // Initialize with empty players and timeouts
    teamB: { name: 'Team B', score: 0, players: [], timeouts: 0 },
  });

  // Placeholder for Time Controls state
  const [matchDuration, setMatchDuration] = useState(20); // Default 20 minutes

  // Placeholder for handling player search and add (will integrate database here later)
  const handleAddPlayer = async (teamId: TeamId, playerName: string, playerPhoneNumber?: string) => {
    if (playerName.trim() === '') {
      console.log("Player name cannot be empty."); // Replace with toast later
      return;
    }
    if (teams[teamId].players.length >= 7) {
      console.log("A team can have a maximum of 7 players in this version."); // Replace with toast later
      return;
    }

    // Search for player in the database
    let playerToAdd: Player;
    let foundPlayer = null;

    if (playerPhoneNumber && playerPhoneNumber.trim() !== '') {
        // First, try searching by phone number if provided
        const playersByPhone = await searchPlayerByPhoneNumber(playerPhoneNumber.trim());
        if (playersByPhone.length > 0) {
            foundPlayer = playersByPhone[0]; // Use the first player found by phone
        }
    }

    if (!foundPlayer && playerName.trim() !== '') {
        // If not found by phone, or no phone provided, try searching by name
        const playersByName = await searchPlayerByName(playerName.trim());
        if (playersByName.length > 0) {
             foundPlayer = playersByName[0]; // Use the first player found by name
        }
    }

    if (foundPlayer) {
      // Use existing player data
      playerToAdd = { ...foundPlayer, status: 'active', outOrder: null, stats: { ...foundPlayer.stats || initialPlayerStats } }; // Ensure player object matches type and preserve existing stats
    } else {
      // Add new player to the database and use the new ID
      const newPlayerId = await addPlayer({ name: playerName.trim(), phoneNumber: playerPhoneNumber?.trim() });
      playerToAdd = createPlayer(playerName.trim(), playerPhoneNumber?.trim()); // Create a new player object with name and phone
      playerToAdd.id = newPlayerId; // Override with Firestore generated ID
    }

      setTeams(prevTeams => ({
      ...prevTeams,
      [teamId]: {
        ...prevTeams[teamId],
        players: [...prevTeams[teamId].players, newPlayer],
      },
    }));
  };


  const handleRemovePlayer = (teamId: TeamId, playerId: string) => {
    setTeams(prevTeams => ({
      ...prevTeams,
      [teamId]: {
        ...prevTeams[teamId],
        players: prevTeams[teamId].players.filter(player => player.id !== playerId),
      },
    }));
  };

  const handleUpdateTeamName = (teamId: TeamId, name: string) => {
    setTeams(prevTeams => ({
        ...prevTeams,
        [teamId]: {
            ...prevTeams[teamId],
            name: name,
        },
    }));
  };

  // Placeholder for checking if match can start (at least 7 players per team)
  const canStart = teams.teamA.players.length >= 7 && teams.teamB.players.length >= 7;

  // Function to proceed to the next step (Toss)
  const handleProceedToToss = () => {
    // In a real application, you would save the match setup to the database here
    // and then navigate to the Toss page, passing the match ID and setup data.
    console.log("Proceeding to Toss with teams:", teams, "and duration:", matchDuration);
    // Stringify and encode the teams data to pass it as a URL parameter
    const teamsData = encodeURIComponent(JSON.stringify(teams));
    router.push(`/start-match/toss?teams=${teamsData}&duration=${matchDuration}`);
  };

  return (
    <div className="space-y-8 p-4">
      <h1 className="text-2xl font-bold mb-4">Match Setup</h1>

      <div className="grid md:grid-cols-2 gap-8">
        {/* Team A Setup */}
        <TeamSetupCard
          teamId="teamA"
          team={teams.teamA}
          onAddPlayer={handleAddPlayer}
          onRemovePlayer={handleRemovePlayer}
          onUpdateTeamName={handleUpdateTeamName}
        />

        {/* Team B Setup */}
        <TeamSetupCard
          teamId="teamB"
          team={teams.teamB}
          onAddPlayer={handleAddPlayer}
          onRemovePlayer={handleRemovePlayer}
          onUpdateTeamName={handleUpdateTeamName}
        />
      </div>

      {/* Time Controls Section */}\
      <div className="space-y-4">
        <h2 className="text-xl font-bold">Time Controls</h2>
        {/* Add UI elements for time controls here */}
        {/* Example: Input for match duration */}
        <div>
          <label htmlFor="match-duration" className="block text-sm font-medium text-gray-700">Match Duration (minutes per half)</label> {/* Clarified label */}
          <input
            type="number"
            id="match-duration"
            value={matchDuration}
            onChange={(e) => setMatchDuration(parseInt(e.target.value))}\
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary sm:text-sm"
            min="1"
          />
        </div>
         {/* Add other time control settings here if needed (e.g., break duration) */}
      </div>

      {/* Button to proceed to the next step */}\
      <div className="flex justify-center">
        <Button size="lg" onClick={handleProceedToToss} disabled={!canStart}>
          Proceed to Toss
        </Button>
      </div>
    </div>
  );
}

'use client';

import { useEffect, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { useKabaddiMatch, NewMatchSetupData } from '@/hooks/useKabaddiMatch'; // Assuming NewMatchSetupData is exported

export default function NewMatchPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { initializeNewMatch } = useKabaddiMatch(); // Get the initializeNewMatch function from the hook

  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const createMatch = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const teamsData = searchParams.get('teams');
        const durationData = searchParams.get('duration');
        const raidingTeamData = searchParams.get('initialRaidingTeam'); // Assuming you're also passing this from Toss

        if (!teamsData || !durationData || !raidingTeamData) {
          setError("Match setup data missing.");
          setIsLoading(false);
          return;
        }

        const teams: NewMatchSetupData['teams'] = JSON.parse(decodeURIComponent(teamsData));
        const duration = parseInt(durationData, 10);
        const initialRaidingTeam: NewMatchSetupData['initialRaidingTeam'] = raidingTeamData as NewMatchSetupData['initialRaidingTeam'];

        if (isNaN(duration)) {
             setError("Invalid match duration data.");
             setIsLoading(false);
             return;
        }


        // Create the NewMatchSetupData object
        const setupData: NewMatchSetupData = {
            teams,
            duration,
            initialRaidingTeam,
        };


        const newMatchId = await initializeNewMatch(setupData);

        // Navigate to the scoring page for the new match
        router.replace(`/match/${newMatchId}/score`);

      } catch (e: any) {
        console.error("Error creating new match:", e);
        setError(`Failed to create match: ${e.message || 'Unknown error'}`);
        setIsLoading(false);
      }
    };

    createMatch();
  }, [searchParams, router, initializeNewMatch]); // Dependencies

  if (error) {
    return <div className="p-4 text-center text-destructive">Error: {error}</div>;
  }

  if (isLoading) {
    return <div className="p-4 text-center">Creating Match...</div>;
  }

  // This component should navigate away quickly, but return null or a simple message if it doesn't
  return null;
}
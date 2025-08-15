'use client';

import { useReducer, useEffect, useCallback, useMemo, useState } from 'react'; // Import useState and useRef
import { doc, setDoc, getFirestore, getDoc } from 'firebase/firestore'; // Import Firestore functions
import { v4 as uuidv4 } from 'uuid'; // Import uuid for generating player IDs and match IDs
import type { Player, Team, TeamId, MatchState, RaidData, MatchStatus } from '@/types/kabaddi';
import { useToast } from "@/hooks/use-toast";
import { db } from '@/lib/firebase';

const MATCH_DURATION_SECONDS = 20 * 60; // 20 minutes
const TIMEOUTS_PER_HALF = 2;
const RAID_DURATION_SECONDS = 30; // 30 seconds for a raid

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

const createPlayer = (name: string): Player => ({
  id: uuidv4(),
  name,
  status: 'active',
  outOrder: null,
  stats: { ...initialPlayerStats },
});

// Define the type for the new match setup data
export interface NewMatchSetupData {
  teams: Record<TeamId, Team>;
  duration: number; // Match duration in minutes
  initialRaidingTeam: TeamId;
}
const initialState: MatchState = {
  status: 'setup',
  teams: {
    teamA: { name: 'Team A', score: 0, players: [], timeouts: TIMEOUTS_PER_HALF },
    teamB: { name: 'Team B', score: 0, players: [], timeouts: TIMEOUTS_PER_HALF },
  },
  currentHalf: 1,
  timer: MATCH_DURATION_SECONDS,
  raidingTeam: 'teamA',
  outCounter: 0,
  matchHistory: [],
 raidTimer: null, 
};

type Action =
  | { type: 'ADD_PLAYER'; teamId: TeamId; playerName: string } // Add ADD_PLAYER here
  | { type: 'LOAD_MATCH'; loadedState: MatchState } // Add LOAD_MATCH here
  | { type: 'REMOVE_PLAYER'; teamId: TeamId; playerId: string }
  | { type: 'UPDATE_TEAM_NAME'; teamId: TeamId; name: string }
  | { type: 'START_MATCH' }
  | { type: 'SCORE_RAID'; teamId: TeamId; points: number; raiderId?: string; touchedPlayerIds?: string[]; bonus?: boolean; isSuperRaid?: boolean }
  | { type: 'SCORE_TACKLE'; teamId: TeamId; points: number; tacklerId?: string; raiderId?: string; isSuperTackle?: boolean }
  | { type: 'SCORE_BONUS'; teamId: TeamId; points: number; raiderId?: string }
  | { type: 'PROCESS_RAID'; raidData: RaidData }
  | { type: 'TAKE_TIMEOUT'; teamId: TeamId }
  | { type: 'TOGGLE_PAUSE' }
  | { type: 'START_HALF_TIME' }
  | { type: 'START_SECOND_HALF' }
  | { type: 'TICK' }
  | { type: 'END_MATCH' }
  | { type: 'START_RAID_TIMER' } // Add START_RAID_TIMER action
  | { type: 'DECREMENT_RAID_TIMER' } // Add DECREMENT_RAID_TIMER action
  | { type: 'END_RAID_TIMER' }; // Add END_RAID_TIMER action


const matchReducer = (state: MatchState, action: Action): MatchState => {
  switch (action.type) {
    case 'ADD_PLAYER': {
      const newPlayer = createPlayer(action.playerName);
      const team = state.teams[action.teamId];
      return {
        ...state,
        teams: {
          ...state.teams,
          [action.teamId]: {
            ...team,
            players: [...team.players, newPlayer],
          },
        },
      };
    }

    case 'REMOVE_PLAYER': {
        const team = state.teams[action.teamId];
        return {
            ...state,
            teams: {
                ...state.teams,
                [action.teamId]: {
                    ...team,
                    players: team.players.filter(p => p.id !== action.playerId),
                },
            },
        };
    }

    case 'UPDATE_TEAM_NAME': {
        const team = state.teams[action.teamId];
        return {
            ...state,
            teams: {
                ...state.teams,
                [action.teamId]: { ...team, name: action.name }
            }
        };
    }

    case 'START_MATCH': {
      return {
        ...state,
        status: 'playing',
        matchHistory: [{ type: 'start', summary: 'Match started', timestamp: Date.now() }],
      };
    }

    case 'TICK': {
      if (state.status !== 'playing' || state.timer <= 0) return state;
      const newTimer = state.timer - 1;
      if (newTimer === 0) {
        return {
            ...state,
            timer: 0,
            status: state.currentHalf === 1 ? 'halftime' : 'finished',
            matchHistory: [...state.matchHistory, { type: state.currentHalf === 1 ? 'half' : 'end', summary: state.currentHalf === 1 ? 'First half ended' : 'Match finished', timestamp: Date.now() }],
        }
      }
      return { ...state, timer: newTimer };
    }

    case 'TOGGLE_PAUSE': {
        const newStatus = state.status === 'playing' ? 'paused' : 'playing';
        return { ...state, status: newStatus };
    }

    case 'TAKE_TIMEOUT': {
        const team = state.teams[action.teamId];
        if (team.timeouts > 0) {
            return {
                ...state,
                status: 'paused',
                teams: { ...state.teams, [action.teamId]: { ...team, timeouts: team.timeouts - 1 } },
                matchHistory: [...state.matchHistory, { type: 'timeout', summary: `${team.name} took a timeout.`, timestamp: Date.now() }]
            }
        }
        return state;
    }

    case 'START_HALF_TIME': {
        return {
            ...state,
            status: 'halftime',
            timer: MATCH_DURATION_SECONDS,
            teams: {
                teamA: { ...state.teams.teamA, timeouts: TIMEOUTS_PER_HALF, players: state.teams.teamA.players.map(p => ({...p, status: 'active', outOrder: null})) },
                teamB: { ...state.teams.teamB, timeouts: TIMEOUTS_PER_HALF, players: state.teams.teamB.players.map(p => ({...p, status: 'active', outOrder: null})) }
            },
            currentHalf: 2,
            raidingTeam: state.raidingTeam === 'teamA' ? 'teamB' : 'teamA',
            outCounter: 0,
            matchHistory: [...state.matchHistory, { type: 'half', summary: 'Half-time started.', timestamp: Date.now() }]
        }
    }

    case 'PROCESS_RAID': {
        let newState = { ...state };
        const { raiderId, touchedPlayerIds, bonus, tackledById } = action.raidData;
        const raidingTeamId = newState.raidingTeam;
        const defendingTeamId = raidingTeamId === 'teamA' ? 'teamB' : 'teamA';
        const raidingTeam = newState.teams[raidingTeamId];
        const defendingTeam = newState.teams[defendingTeamId];

        let pointsScored = 0;
        let raidSummary = `${raidingTeam.players.find(p => p.id === raiderId)?.name} raided.`;
        let isSuccessful = false;
        let isSuperRaid = false;

        const raider = raidingTeam.players.find(p => p.id === raiderId)!;

        // Process tackle
        if (tackledById) {
            raider.status = 'out';
            raider.outOrder = newState.outCounter++;
            const activeDefenders = defendingTeam.players.filter(p => p.status === 'active').length;
            const isSuperTackle = activeDefenders <= 3;

            const tacklePoints = isSuperTackle ? 2 : 1;
            defendingTeam.score += tacklePoints;
            pointsScored = 0; // for revival logic
            raidSummary += ` Tackled by ${defendingTeam.players.find(p => p.id === tackledById)?.name}.`;

            const tackler = defendingTeam.players.find(p => p.id === tackledById)!;
            tackler.stats.tacklePoints += tacklePoints;
            if (isSuperTackle) tackler.stats.superTackles++;
        } else { // Raider is safe
            // Process touches
            pointsScored += touchedPlayerIds.length;
            touchedPlayerIds.forEach(id => {
                const player = defendingTeam.players.find(p => p.id === id)!;
                player.status = 'out';
                player.outOrder = newState.outCounter++;
            });
            if(touchedPlayerIds.length > 0) raidSummary += ` Touched ${touchedPlayerIds.length} player(s).`;

            // Process bonus
            if (bonus) {
                pointsScored++;
                raidSummary += ` Bonus point taken.`;
            }

            if (pointsScored > 0) isSuccessful = true;
        }

        raidingTeam.score += pointsScored;

        // Check for All Out
        const activeDefendersAfterRaid = defendingTeam.players.filter(p => p.status === 'active').length;
        if (activeDefendersAfterRaid === 0) {
            raidingTeam.score += 2; // All out points
            raidSummary += ` All Out!`;
            // Revive all players of defending team
            defendingTeam.players.forEach(p => {
                p.status = 'active';
                p.outOrder = null;
            });
        }

        // Process revivals
        // For raiding team (if raider was tackled)
        if (tackledById) {
            const outPlayers = raidingTeam.players.filter(p => p.status === 'out').sort((a, b) => a.outOrder! - b.outOrder!);
            const revivedPlayer = outPlayers[0];
            if(revivedPlayer) {
                revivedPlayer.status = 'active';
                revivedPlayer.outOrder = null;
            }
        }
        // For defending team
        const outDefenders = defendingTeam.players.filter(p => p.status === 'out').sort((a, b) => a.outOrder! - b.outOrder!);
        for (let i = 0; i < pointsScored && i < outDefenders.length; i++) {
            outDefenders[i].status = 'active';
            outDefenders[i].outOrder = null;
        }

        // Update Raider stats
        raider.stats.totalRaids++;
        raider.stats.raidPoints += pointsScored;
        if(isSuccessful) raider.stats.successfulRaids++;
        else if (tackledById) raider.stats.unsuccessfulRaids++;
        else raider.stats.emptyRaids++;
        if(pointsScored >= 3) {
            raider.stats.superRaids++;
            isSuperRaid = true;
            raidSummary += ` Super Raid!`;
        }

        newState.matchHistory.push({ type: 'raid', summary: raidSummary, timestamp: Date.now() });
        newState.raidingTeam = defendingTeamId;

        return newState;
    }

    case 'SCORE_RAID': {
        let newState = { ...state };
        const { teamId, points, raiderId, touchedPlayerIds = [], bonus = false, isSuperRaid = false } = action;
        const team = newState.teams[teamId];
        team.score += points;

        let summary = `${team.name} scored ${points} raid point(s).`;
        if (raiderId) {
            const raider = team.players.find(p => p.id === raiderId);
            if (raider) {
                raider.stats.raidPoints += points;
                raider.stats.totalRaids++;
                if (points > 0) raider.stats.successfulRaids++;
                else raider.stats.emptyRaids++;
                if (isSuperRaid) raider.stats.superRaids++;
                summary = `${raider.name} scored ${points} raid point(s).`;
            }
        }
        newState.matchHistory.push({ type: 'raid', summary, timestamp: Date.now() });
        return newState;
    }

    case 'SCORE_TACKLE': {
        let newState = { ...state };
        const { teamId, points, tacklerId, isSuperTackle = false } = action;
        const team = newState.teams[teamId];
        team.score += points;

        let summary = `${team.name} scored ${points} tackle point(s).`;
        if (tacklerId) {
            const tackler = team.players.find(p => p.id === tacklerId);
            if (tackler) {
                tackler.stats.tacklePoints += points;
                if (isSuperTackle) tackler.stats.superTackles++;
                summary = `${tackler.name} scored ${points} tackle point(s).`;
            }
        }
        newState.matchHistory.push({ type: 'tackle', summary, timestamp: Date.now() });
        return newState;
    }

    case 'SCORE_BONUS': {
        let newState = { ...state };
        const { teamId, points, raiderId } = action;
        const team = newState.teams[teamId];
        team.score += points;

        let summary = `${team.name} scored ${points} bonus point(s).`;
        if (raiderId) {
             const raider = team.players.find(p => p.id === raiderId);
             if (raider) {
                 summary = `${raider.name} scored ${points} bonus point(s).`;
             }
        }
        newState.matchHistory.push({ type: 'bonus', summary, timestamp: Date.now() });
        return newState;
    }
    case 'START_RAID_TIMER': { // Handle START_RAID_TIMER
        return { ...state, raidTimer: RAID_DURATION_SECONDS };
    }
    case 'DECREMENT_RAID_TIMER': { // Handle DECREMENT_RAID_TIMER
        if (state.raidTimer === null || state.raidTimer <= 0) return state;
        return { ...state, raidTimer: state.raidTimer - 1 };
    }
    case 'END_RAID_TIMER': { // Handle END_RAID_TIMER
        return { ...state, raidTimer: null };
    }
    case 'END_MATCH':
        return { ...state, status: 'finished' };

    default:
      return state;
  }
};

export const useKabaddiMatch = (matchId?: string, setupData?: NewMatchSetupData) => { // Accept optional matchId and setupData
  const [state, dispatch] = useReducer(matchReducer, initialState);
  const [raidTimer, setRaidTimer] = useState<number | null>(null); // Add raidTimer state
  // const isInitialMount = useRef(true); // Use a ref to track initial mount


  // Access Firestore instance
  // const db = useMemo(() => getFirestore(), []); // Get Firestore instance only once - moved to lib/firebase
  const { toast } = useToast();

  // Effect for match timer
  useEffect(() => {
    let interval: NodeJS.Timeout | undefined;
    if (state.status === 'playing') {
      interval = setInterval(() => {
        dispatch({ type: 'TICK' });
      }, 1000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [state.status, dispatch]); // Add dispatch as a dependency

  // Effect to save state to Firestore
  // Effect to load existing match state
  useEffect(() => {
    const loadMatch = async () => {
      if (matchId) { // Load if matchId is provided
        const matchDocRef = doc(db, "matches", matchId);
        const docSnap = await getDoc(matchDocRef);

        if (docSnap.exists()) {
          dispatch({ type: 'LOAD_MATCH', loadedState: docSnap.data() as MatchState }); // Cast data to MatchState
        } else {
          console.log("No such match found!");
          // Handle case where matchId is provided but document doesn't exist
          // You might want to redirect the user or show an error
           toast({ title: "Match Not Found", description: `No match found with ID: ${matchId}.`, variant: "destructive" });
        }
      }
       // Note: Initializing a new match when matchId is not provided is handled externally
       // by the component calling this hook, often via a function like `initializeNewMatch`.
    };

    loadMatch();

  }, [matchId, db, dispatch, toast]); // Add matchId, db, dispatch, and toast to dependencies

 // Async function to initialize and save a new match
  const initializeNewMatch = useCallback(async (setupData: NewMatchSetupData): Promise<string> => {
      const newMatchId = uuidv4(); // Generate a new unique ID for the match

  useEffect(() => {
    const loadOrSaveMatch = async () => {
      if (matchId) {
        const matchDocRef = doc(db, "matches", matchId);
        const docSnap = await getDoc(matchDocRef);

        if (docSnap.exists()) {
          dispatch({ type: 'LOAD_MATCH', loadedState: docSnap.data() as MatchState }); // Cast data to MatchState
        } else {
          console.log("No such match found!");
          // Handle case where matchId is provided but document doesn't exist
          toast({ title: "Match Not Found", description: `No match found with ID: ${matchId}.`, variant: "destructive" });
        }
      } else if (setupData) { // Initialize a new match if setupData is provided and no matchId
           const newMatchId = uuidv4(); // Generate a new unique ID for the match
            const initialMatchState: MatchState = {
                status: 'playing', // Start in playing state after setup
                teams: setupData.teams,
                currentHalf: 1,
                timer: setupData.duration * 60, // Convert duration from minutes to seconds
                raidingTeam: setupData.initialRaidingTeam,
                outCounter: 0,
                matchHistory: [{ type: 'start', summary: 'Match started from setup.', timestamp: Date.now() }],
                raidTimer: null, // Initial raid timer is null
            };

             try {
                const matchDocRef = doc(db, "matches", newMatchId);
                await setDoc(matchDocRef, initialMatchState);
                dispatch({ type: 'LOAD_MATCH', loadedState: initialMatchState }); // Load the newly created state
                 // You might want to redirect the user to the new match URL here if needed
                 console.log("New match initialized with ID:", newMatchId);
             } catch (e) {
                console.error("Error initializing new match: ", e);
                toast({ title: "Error", description: "Failed to initialize new match.", variant: "destructive" });
          // You might want to redirect the user or show an error
        }
      }
      // If no matchId is provided, handle starting a new match with setup data elsewhere.
      // Saving of state updates will be handled by a separate effect or logic triggered after setup.
    };

    loadOrSaveMatch();

  }, [matchId, setupData, db, dispatch, toast]); // Add matchId, setupData, db, dispatch, and toast to dependencies

  // Effect to save state changes to Firestore
  useEffect(() => {
      // Only save if matchId is present and status is not 'setup'
      if (matchId && state.status !== 'setup') {
          const saveState = async () => {
              try {
                  const matchDocRef = doc(db, "matches", matchId);
                  await setDoc(matchDocRef, state);
              } catch (e) {
                  console.error("Error saving match state: ", e);
              }
          };
          saveState();
      } // Only save if matchId is present and status is not 'setup'
  }, [state, matchId, db]); // Save when state or matchId changes
  // Effect for raid timer
  useEffect(() => {
    let interval: NodeJS.Timeout | undefined;
    if (raidTimer !== null && raidTimer > 0) {
      interval = setInterval(() => {
        setRaidTimer((prevTimer) => (prevTimer !== null ? prevTimer - 1 : null));
      }, 1000);
    } else if (raidTimer === 0) {
        // Raid timer expired, process as empty raid
        const raidingTeam = state.teams[state.raidingTeam];
        const raiderId = raidingTeam.players.find(p => p.status === 'active')?.id; // Get the first active raider's ID - This might need adjustment based on your raider selection logic

        if (raiderId) {
             // Dispatch an action to process an empty raid
             dispatch({ type: 'PROCESS_RAID', raidData: { raiderId, touchedPlayerIds: [], bonus: false, tackledById: null } });
             toast({ title: "Raid Expired", description: "The raider could not score within 30 seconds.", variant: "default" });
        }
        setRaidTimer(null); // Reset the timer
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [raidTimer, dispatch, state.teams, state.raidingTeam, toast]); // Add dependencies


  const startRaidTimer = useCallback(() => {
      setRaidTimer(RAID_DURATION_SECONDS);
  }, []);

  const stopRaidTimer = useCallback(() => {
      setRaidTimer(null);
  }, []);


  const addPlayer = useCallback((teamId: TeamId, playerName: string) => {
    if (playerName.trim() === '') {
        toast({ title: "Invalid Name", description: "Player name cannot be empty.", variant: "destructive" });
        return;
    }
    if (state.teams[teamId].players.length >= 7) {
        toast({ title: "Team Full", description: "A team can have a maximum of 7 players in this version.", variant: "destructive" });
        return;
    }
    dispatch({ type: 'ADD_PLAYER', teamId, playerName });
  }, [state.teams, toast, dispatch]); // Add dispatch as a dependency

  const removePlayer = useCallback((teamId: TeamId, playerId: string) => {
    dispatch({ type: 'REMOVE_PLAYER', teamId, playerId });
  }, [dispatch]); // Add dispatch as a dependency

  const updateTeamName = useCallback((teamId: TeamId, name: string) => {
    dispatch({ type: 'UPDATE_TEAM_NAME', teamId, name });
  }, [dispatch]); // Add dispatch as a dependency

  const startMatch = useCallback(() => {
    if(state.teams.teamA.players.length < 7 || state.teams.teamB.players.length < 7) {
        toast({ title: "Insufficient Players", description: "Both teams must have at least 7 players to start.", variant: "destructive"});
        return;
    }
    dispatch({ type: 'START_MATCH' });
  }, [state.teams, toast, dispatch]); // Add dispatch as a dependency

  const scoreRaid = useCallback((teamId: TeamId, points: number, raiderId?: string, touchedPlayerIds?: string[], bonus?: boolean, isSuperRaid?: boolean) => {
      if (state.status !== 'playing') return;
      dispatch({ type: 'SCORE_RAID', teamId, points, raiderId, touchedPlayerIds, bonus, isSuperRaid });
  }, [state.status, dispatch]); // Add dispatch as a dependency

  const scoreTackle = useCallback((teamId: TeamId, points: number, tacklerId?: string, raiderId?: string, isSuperTackle?: boolean) => {
      if (state.status !== 'playing') return;
      dispatch({ type: 'SCORE_TACKLE', teamId, points, tacklerId, raiderId, isSuperTackle });
  }, [state.status, dispatch]); // Add dispatch as a dependency

  const scoreBonus = useCallback((teamId: TeamId, points: number, raiderId?: string) => {
      if (state.status !== 'playing') return;
      dispatch({ type: 'SCORE_BONUS', teamId, points, raiderId });
  }, [state.status, dispatch]); // Add dispatch as a dependency

    const scoreTechnicalPoint = useCallback((teamId: TeamId, points: number, reason: string) => {
        if (state.status !== 'playing') return;
        let newState = { ...state };
        newState.teams[teamId].score += points;
        newState.matchHistory.push({ type: 'technical', summary: `${newState.teams[teamId].name} awarded ${points} technical point(s) for: ${reason}`, timestamp: Date.now() });
        dispatch({ type: 'END_MATCH' }); // Using END_MATCH as a dummy action type to trigger state update
    }, [state.status, state.teams, state.matchHistory, dispatch]); // Include dispatch as a dependency
  const processRaid = useCallback((raidData: RaidData) => {
    dispatch({ type: 'PROCESS_RAID', raidData });
  }, [dispatch]); // Add dispatch as a dependency

  const takeTimeout = useCallback((teamId: TeamId) => {
    if (state.teams[teamId].timeouts > 0) {
        dispatch({ type: 'TAKE_TIMEOUT', teamId });
    } else {
        toast({ title: "No Timeouts Left", description: `${state.teams[teamId].name} has no timeouts remaining.`, variant: "destructive"});
    }
  }, [state.teams, toast, dispatch]); // Add dispatch as a dependency

  const togglePause = useCallback(() => {
    if (state.status === 'playing' || state.status === 'paused') {
        dispatch({ type: 'TOGGLE_PAUSE' });
    }
  }, [state.status, dispatch]); // Add dispatch as a dependency

  const startHalfTime = useCallback(() => {
    dispatch({ type: 'START_HALF_TIME' });
  }, [dispatch]); // Add dispatch as a dependency

    // Memoize the return value to prevent unnecessary re-renders
  return {
    state,
    addPlayer,
    removePlayer,
    updateTeamName,
    scoreRaid,
    scoreTackle,
    scoreBonus,
    scoreTechnicalPoint,
    startMatch,
    processRaid,
    takeTimeout,
    togglePause,
    startHalfTime,
    raidTimer, // Expose raidTimer
    startRaidTimer, // Expose startRaidTimer
    stopRaidTimer, // Expose stopRaidTimer
    initializeNewMatch, // Expose the function to initialize a new match
  };
};

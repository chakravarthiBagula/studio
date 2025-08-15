'use client';

import { useReducer, useEffect, useCallback } from 'react';
import { v4 as uuidv4 } from 'uuid';
import type { Player, Team, TeamId, MatchState, RaidData, MatchStatus } from '@/types/kabaddi';
import { useToast } from "@/hooks/use-toast";

const MATCH_DURATION_SECONDS = 20 * 60; // 20 minutes
const TIMEOUTS_PER_HALF = 2;

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
};

type Action =
  | { type: 'ADD_PLAYER'; teamId: TeamId; playerName: string }
  | { type: 'REMOVE_PLAYER'; teamId: TeamId; playerId: string }
  | { type: 'UPDATE_TEAM_NAME'; teamId: TeamId; name: string }
  | { type: 'START_MATCH' }
  | { type: 'PROCESS_RAID'; raidData: RaidData }
  | { type: 'TAKE_TIMEOUT'; teamId: TeamId }
  | { type: 'TOGGLE_PAUSE' }
  | { type: 'START_HALF_TIME' }
  | { type: 'START_SECOND_HALF' }
  | { type: 'TICK' }
  | { type: 'END_MATCH' };

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

    case 'END_MATCH':
        return { ...state, status: 'finished' };
        
    default:
      return state;
  }
};

export const useKabaddiMatch = () => {
  const [state, dispatch] = useReducer(matchReducer, initialState);
  const { toast } = useToast();

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
  }, [state.status]);

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
  }, [state.teams, toast]);

  const removePlayer = useCallback((teamId: TeamId, playerId: string) => {
    dispatch({ type: 'REMOVE_PLAYER', teamId, playerId });
  }, []);

  const updateTeamName = useCallback((teamId: TeamId, name: string) => {
    dispatch({ type: 'UPDATE_TEAM_NAME', teamId, name });
  }, []);

  const startMatch = useCallback(() => {
    if(state.teams.teamA.players.length < 7 || state.teams.teamB.players.length < 7) {
        toast({ title: "Insufficient Players", description: "Both teams must have at least 7 players to start.", variant: "destructive"});
        return;
    }
    dispatch({ type: 'START_MATCH' });
  }, [state.teams, toast]);

  const processRaid = useCallback((raidData: RaidData) => {
    dispatch({ type: 'PROCESS_RAID', raidData });
  }, []);

  const takeTimeout = useCallback((teamId: TeamId) => {
    if (state.teams[teamId].timeouts > 0) {
        dispatch({ type: 'TAKE_TIMEOUT', teamId });
    } else {
        toast({ title: "No Timeouts Left", description: `${state.teams[teamId].name} has no timeouts remaining.`, variant: "destructive"});
    }
  }, [state.teams, toast]);

  const togglePause = useCallback(() => {
    if (state.status === 'playing' || state.status === 'paused') {
        dispatch({ type: 'TOGGLE_PAUSE' });
    }
  }, [state.status]);

  const startHalfTime = useCallback(() => {
    dispatch({ type: 'START_HALF_TIME' });
  }, []);

  return {
    state,
    addPlayer,
    removePlayer,
    updateTeamName,
    startMatch,
    processRaid,
    takeTimeout,
    togglePause,
    startHalfTime,
  };
};

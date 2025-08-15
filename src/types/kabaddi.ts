export interface Player {
  id: string;
  name: string;
  status: 'active' | 'out';
  outOrder: number | null;
  stats: PlayerStats;
}

export interface PlayerStats {
  raidPoints: number;
  tacklePoints: number;
  totalRaids: number;
  successfulRaids: number;
  unsuccessfulRaids: number;
  emptyRaids: number;
  superRaids: number;
  superTackles: number;
}

export interface Team {
  name: string;
  score: number;
  players: Player[];
  timeouts: number;
}

export type TeamId = 'teamA' | 'teamB';

export interface RaidData {
  raiderId: string;
  touchedPlayerIds: string[];
  bonus: boolean;
  tackledById: string | null;
}

export type MatchStatus = 'setup' | 'playing' | 'paused' | 'halftime' | 'finished';

export interface MatchState {
  status: MatchStatus;
  teams: Record<TeamId, Team>;
  currentHalf: 1 | 2;
  timer: number; // in seconds
  raidingTeam: TeamId;
  outCounter: number; // to assign outOrder
  matchHistory: MatchEvent[];
}

export type MatchEvent = {
  type: 'raid' | 'penalty' | 'timeout' | 'half' | 'start' | 'end';
  summary: string;
  timestamp: number;
};

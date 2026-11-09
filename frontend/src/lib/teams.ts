export type Team = {
  abbrev: string;
  city: string;
  nickname: string;
  conference: 'AFC' | 'NFC';
  division: 'East' | 'North' | 'South' | 'West';
};

const TEAMS: Team[] = [
  { abbrev: 'ARI', city: 'Arizona', nickname: 'Cardinals', conference: 'NFC', division: 'West' },
  { abbrev: 'ATL', city: 'Atlanta', nickname: 'Falcons', conference: 'NFC', division: 'South' },
  { abbrev: 'BAL', city: 'Baltimore', nickname: 'Ravens', conference: 'AFC', division: 'North' },
  { abbrev: 'BUF', city: 'Buffalo', nickname: 'Bills', conference: 'AFC', division: 'East' },
  { abbrev: 'CAR', city: 'Carolina', nickname: 'Panthers', conference: 'NFC', division: 'South' },
  { abbrev: 'CHI', city: 'Chicago', nickname: 'Bears', conference: 'NFC', division: 'North' },
  { abbrev: 'CIN', city: 'Cincinnati', nickname: 'Bengals', conference: 'AFC', division: 'North' },
  { abbrev: 'CLE', city: 'Cleveland', nickname: 'Browns', conference: 'AFC', division: 'North' },
  { abbrev: 'DAL', city: 'Dallas', nickname: 'Cowboys', conference: 'NFC', division: 'East' },
  { abbrev: 'DEN', city: 'Denver', nickname: 'Broncos', conference: 'AFC', division: 'West' },
  { abbrev: 'DET', city: 'Detroit', nickname: 'Lions', conference: 'NFC', division: 'North' },
  { abbrev: 'GB', city: 'Green Bay', nickname: 'Packers', conference: 'NFC', division: 'North' },
  { abbrev: 'HOU', city: 'Houston', nickname: 'Texans', conference: 'AFC', division: 'South' },
  { abbrev: 'IND', city: 'Indianapolis', nickname: 'Colts', conference: 'AFC', division: 'South' },
  { abbrev: 'JAX', city: 'Jacksonville', nickname: 'Jaguars', conference: 'AFC', division: 'South' },
  { abbrev: 'KC', city: 'Kansas City', nickname: 'Chiefs', conference: 'AFC', division: 'West' },
  { abbrev: 'LV', city: 'Las Vegas', nickname: 'Raiders', conference: 'AFC', division: 'West' },
  { abbrev: 'LAC', city: 'Los Angeles', nickname: 'Chargers', conference: 'AFC', division: 'West' },
  { abbrev: 'LAR', city: 'Los Angeles', nickname: 'Rams', conference: 'NFC', division: 'West' },
  { abbrev: 'MIA', city: 'Miami', nickname: 'Dolphins', conference: 'AFC', division: 'East' },
  { abbrev: 'MIN', city: 'Minnesota', nickname: 'Vikings', conference: 'NFC', division: 'North' },
  { abbrev: 'NE', city: 'New England', nickname: 'Patriots', conference: 'AFC', division: 'East' },
  { abbrev: 'NO', city: 'New Orleans', nickname: 'Saints', conference: 'NFC', division: 'South' },
  { abbrev: 'NYG', city: 'New York', nickname: 'Giants', conference: 'NFC', division: 'East' },
  { abbrev: 'NYJ', city: 'New York', nickname: 'Jets', conference: 'AFC', division: 'East' },
  { abbrev: 'PHI', city: 'Philadelphia', nickname: 'Eagles', conference: 'NFC', division: 'East' },
  { abbrev: 'PIT', city: 'Pittsburgh', nickname: 'Steelers', conference: 'AFC', division: 'North' },
  { abbrev: 'SF', city: 'San Francisco', nickname: '49ers', conference: 'NFC', division: 'West' },
  { abbrev: 'SEA', city: 'Seattle', nickname: 'Seahawks', conference: 'NFC', division: 'West' },
  { abbrev: 'TB', city: 'Tampa Bay', nickname: 'Buccaneers', conference: 'NFC', division: 'South' },
  { abbrev: 'TEN', city: 'Tennessee', nickname: 'Titans', conference: 'AFC', division: 'South' },
  { abbrev: 'WAS', city: 'Washington', nickname: 'Commanders', conference: 'NFC', division: 'East' },
];

const BY_NAME = new Map(TEAMS.map((team) => [`${team.city} ${team.nickname}`, team]));

export function teamFor(name: string): Team {
  const team = BY_NAME.get(name);
  if (team) return team;
  const parts = name.split(' ');
  return {
    abbrev: name.slice(0, 3).toUpperCase(),
    city: parts.slice(0, -1).join(' ') || name,
    nickname: parts[parts.length - 1] ?? name,
    conference: 'AFC',
    division: 'East',
  };
}

export function allTeams(): Team[] {
  return TEAMS;
}

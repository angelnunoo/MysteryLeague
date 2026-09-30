export const LEAGUE_UNIVERSE = 'league-studios'

export const LEAGUE_APPS = [
  { id: 'mysteryleague', name: 'MysteryLeague', live: true, line: 'Investiga. Descubre. Compite.' },
  { id: 'playleague', name: 'PlayLeague', live: false, line: 'El perfil viajará cuando el estudio abra la pista.' },
  { id: 'beatleague', name: 'BeatLeague', live: false, line: 'La misma placa, otro compás.' },
  { id: 'drinkleague', name: 'DrinkLeague', live: false, line: 'La mesa social, cuando el brindis tenga liga.' },
] as const

export interface LeagueIdentity {
  universe: typeof LEAGUE_UNIVERSE
  userId: string
  displayName: string
  avatarId: string
  createdAt: string
  apps: string[]
  global: {
    level: number
    credits: number
    badges: Array<{ id: string; app: string }>
    friends: Array<{ id: string; username: string; app: string }>
    stats: Array<{ app: string; casesSolved: number; accuracy: number; streak: number }>
  }
}

export function toLeagueIdentity(input: {
  userId: string
  username: string
  avatarId: string
  createdAt: string
  level: number
  credits: number
  badgeIds: string[]
  friends: Array<{ id: string; username: string }>
  casesSolved: number
  accuracy: number
  streak: number
}): LeagueIdentity {
  return {
    universe: LEAGUE_UNIVERSE,
    userId: input.userId,
    displayName: input.username,
    avatarId: input.avatarId,
    createdAt: input.createdAt,
    apps: LEAGUE_APPS.filter((app) => app.live).map((app) => app.id),
    global: {
      level: input.level,
      credits: input.credits,
      badges: input.badgeIds.map((id) => ({ id, app: 'mysteryleague' })),
      friends: input.friends.map((friend) => ({ ...friend, app: 'mysteryleague' })),
      stats: [
        {
          app: 'mysteryleague',
          casesSolved: input.casesSolved,
          accuracy: input.accuracy,
          streak: input.streak,
        },
      ],
    },
  }
}

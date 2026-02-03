export const KNOWN_GAMES = [
  { name: 'Fortnite', process: 'FortniteClient-Win64-Shipping.exe', category: 'competitive' as const },
  { name: 'Valorant', process: 'VALORANT-Win64-Shipping.exe', category: 'competitive' as const },
  { name: 'Roblox', process: 'RobloxPlayerBeta.exe', category: 'creative' as const },
  { name: 'Minecraft', process: 'Minecraft.Windows.exe', category: 'creative' as const },
  { name: 'Minecraft Java', process: 'javaw.exe', category: 'creative' as const },
  { name: 'League of Legends', process: 'League of Legends.exe', category: 'competitive' as const },
  { name: 'Counter-Strike 2', process: 'cs2.exe', category: 'competitive' as const },
  { name: 'Grand Theft Auto V', process: 'GTA5.exe', category: 'casual' as const },
  { name: 'Discord', process: 'Discord.exe', category: 'social' as const },
  { name: 'Overwatch 2', process: 'Overwatch.exe', category: 'competitive' as const },
  { name: 'Apex Legends', process: 'r5apex.exe', category: 'competitive' as const },
  { name: 'Call of Duty', process: 'cod.exe', category: 'competitive' as const },
  { name: 'Among Us', process: 'Among Us.exe', category: 'social' as const },
  { name: 'Fall Guys', process: 'FallGuys_client.exe', category: 'casual' as const },
  { name: 'Rocket League', process: 'RocketLeague.exe', category: 'competitive' as const },
  { name: 'Steam', process: 'steam.exe', category: 'social' as const },
  { name: 'Epic Games', process: 'EpicGamesLauncher.exe', category: 'social' as const },
];

export const LATE_NIGHT_HOUR = 22; // 10 PM

export const SYNC_INTERVAL_MS = 60000; // 60 seconds

export const HEALTH_SCORE_THRESHOLDS = {
  session_length: {
    good_max: 120, // minutes
    watch_max: 180,
  },
  break_frequency: {
    good_min: 30, // minutes between sessions
    watch_min: 15,
  },
  late_night: {
    minimal_max: 2, // sessions per week
    moderate_max: 5,
  },
  game_variety: {
    good_min: 3, // different games per week
    low_min: 2,
  },
  dominance: {
    watch_threshold: 0.7, // 70%
    alert_threshold: 0.85, // 85%
  },
};

export const AGE_RANGES = [
  '6-8 years',
  '8-10 years',
  '10-12 years',
  '12-14 years',
  '14-16 years',
  '16-18 years',
];

export const CONVERSATION_STARTERS = [
  {
    context: 'starting' as const,
    try_saying: 'I noticed you have been playing [game] lately. What do you like most about it?',
    avoid_saying: 'You are spending too much time gaming. We need to talk.',
  },
  {
    context: 'starting' as const,
    try_saying: 'Tell me about the game you were playing yesterday. It looked interesting!',
    avoid_saying: 'I have been tracking your gaming time and I am concerned.',
  },
  {
    context: 'time_limits' as const,
    try_saying: 'Let us figure out a gaming schedule together that works for both of us.',
    avoid_saying: 'From now on, you can only play 1 hour per day.',
  },
  {
    context: 'time_limits' as const,
    try_saying: 'What do you think is a healthy amount of gaming time for a school night?',
    avoid_saying: 'You are addicted to gaming and it needs to stop.',
  },
  {
    context: 'late_night' as const,
    try_saying: 'I have noticed you are up late gaming. Are you having trouble sleeping?',
    avoid_saying: 'I saw you playing at midnight. That is completely unacceptable.',
  },
  {
    context: 'late_night' as const,
    try_saying: 'Let us talk about wind-down routines. What helps you relax before bed?',
    avoid_saying: 'You are going to fail school because you stay up gaming.',
  },
  {
    context: 'one_game_focus' as const,
    try_saying: 'You really love [game]! Have you tried any similar games you might enjoy?',
    avoid_saying: 'You play the same game over and over. It is unhealthy.',
  },
  {
    context: 'one_game_focus' as const,
    try_saying: 'What is it about [game] that keeps you coming back?',
    avoid_saying: 'You need to play different games. This obsession is not normal.',
  },
];

export const PRIVACY_PROMISE = {
  title: 'Our Privacy Promise',
  subtitle: 'We believe in insight, not intrusion.',
  never: [
    'Records keystrokes',
    'Takes screenshots',
    'Monitors chats',
    'Views screens',
    'Controls devices',
  ],
};


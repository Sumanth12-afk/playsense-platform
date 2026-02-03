"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PRIVACY_PROMISE = exports.CONVERSATION_STARTERS = exports.AGE_RANGES = exports.HEALTH_SCORE_THRESHOLDS = exports.SYNC_INTERVAL_MS = exports.LATE_NIGHT_HOUR = exports.KNOWN_GAMES = void 0;
exports.KNOWN_GAMES = [
    { name: 'Fortnite', process: 'FortniteClient-Win64-Shipping.exe', category: 'competitive' },
    { name: 'Valorant', process: 'VALORANT-Win64-Shipping.exe', category: 'competitive' },
    { name: 'Roblox', process: 'RobloxPlayerBeta.exe', category: 'creative' },
    { name: 'Minecraft', process: 'Minecraft.Windows.exe', category: 'creative' },
    { name: 'Minecraft Java', process: 'javaw.exe', category: 'creative' },
    { name: 'League of Legends', process: 'League of Legends.exe', category: 'competitive' },
    { name: 'Counter-Strike 2', process: 'cs2.exe', category: 'competitive' },
    { name: 'Grand Theft Auto V', process: 'GTA5.exe', category: 'casual' },
    { name: 'Discord', process: 'Discord.exe', category: 'social' },
    { name: 'Overwatch 2', process: 'Overwatch.exe', category: 'competitive' },
    { name: 'Apex Legends', process: 'r5apex.exe', category: 'competitive' },
    { name: 'Call of Duty', process: 'cod.exe', category: 'competitive' },
    { name: 'Among Us', process: 'Among Us.exe', category: 'social' },
    { name: 'Fall Guys', process: 'FallGuys_client.exe', category: 'casual' },
    { name: 'Rocket League', process: 'RocketLeague.exe', category: 'competitive' },
    { name: 'Steam', process: 'steam.exe', category: 'social' },
    { name: 'Epic Games', process: 'EpicGamesLauncher.exe', category: 'social' },
];
exports.LATE_NIGHT_HOUR = 22; // 10 PM
exports.SYNC_INTERVAL_MS = 60000; // 60 seconds
exports.HEALTH_SCORE_THRESHOLDS = {
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
exports.AGE_RANGES = [
    '6-8 years',
    '8-10 years',
    '10-12 years',
    '12-14 years',
    '14-16 years',
    '16-18 years',
];
exports.CONVERSATION_STARTERS = [
    {
        context: 'starting',
        try_saying: 'I noticed you have been playing [game] lately. What do you like most about it?',
        avoid_saying: 'You are spending too much time gaming. We need to talk.',
    },
    {
        context: 'starting',
        try_saying: 'Tell me about the game you were playing yesterday. It looked interesting!',
        avoid_saying: 'I have been tracking your gaming time and I am concerned.',
    },
    {
        context: 'time_limits',
        try_saying: 'Let us figure out a gaming schedule together that works for both of us.',
        avoid_saying: 'From now on, you can only play 1 hour per day.',
    },
    {
        context: 'time_limits',
        try_saying: 'What do you think is a healthy amount of gaming time for a school night?',
        avoid_saying: 'You are addicted to gaming and it needs to stop.',
    },
    {
        context: 'late_night',
        try_saying: 'I have noticed you are up late gaming. Are you having trouble sleeping?',
        avoid_saying: 'I saw you playing at midnight. That is completely unacceptable.',
    },
    {
        context: 'late_night',
        try_saying: 'Let us talk about wind-down routines. What helps you relax before bed?',
        avoid_saying: 'You are going to fail school because you stay up gaming.',
    },
    {
        context: 'one_game_focus',
        try_saying: 'You really love [game]! Have you tried any similar games you might enjoy?',
        avoid_saying: 'You play the same game over and over. It is unhealthy.',
    },
    {
        context: 'one_game_focus',
        try_saying: 'What is it about [game] that keeps you coming back?',
        avoid_saying: 'You need to play different games. This obsession is not normal.',
    },
];
exports.PRIVACY_PROMISE = {
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
//# sourceMappingURL=constants.js.map
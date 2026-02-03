// src/lib/constants.ts
export const KNOWN_GAMES = [
  // Competitive
  {
    name: 'Fortnite',
    executables: ['FortniteClient-Win64-Shipping.exe', 'FortniteClient-Mac-Shipping'],
    category: 'competitive',
  },
  {
    name: 'Valorant',
    executables: ['VALORANT.exe', 'VALORANT-Win64-Shipping.exe'],
    category: 'competitive',
  },
  {
    name: 'League of Legends',
    executables: ['LeagueClient.exe', 'League of Legends.exe'],
    category: 'competitive',
  },
  {
    name: 'Counter-Strike 2',
    executables: ['cs2.exe', 'csgo.exe'],
    category: 'competitive',
  },
  {
    name: 'Apex Legends',
    executables: ['r5apex.exe'],
    category: 'competitive',
  },
  {
    name: 'Overwatch 2',
    executables: ['Overwatch.exe'],
    category: 'competitive',
  },
  {
    name: 'Rocket League',
    executables: ['RocketLeague.exe'],
    category: 'competitive',
  },
  {
    name: 'Call of Duty',
    executables: ['cod.exe', 'ModernWarfare.exe', 'BlackOpsColdWar.exe'],
    category: 'competitive',
  },

  // Creative
  {
    name: 'Minecraft',
    executables: ['javaw.exe', 'Minecraft.exe', 'minecraft-launcher.exe'],
    category: 'creative',
  },
  {
    name: 'Roblox',
    executables: ['RobloxPlayerBeta.exe', 'RobloxPlayer'],
    category: 'creative',
  },
  {
    name: 'Terraria',
    executables: ['Terraria.exe'],
    category: 'creative',
  },
  {
    name: 'The Sims 4',
    executables: ['TS4_x64.exe', 'The Sims 4'],
    category: 'creative',
  },

  // Casual
  {
    name: 'Among Us',
    executables: ['Among Us.exe'],
    category: 'casual',
  },
  {
    name: 'Fall Guys',
    executables: ['FallGuys_client_game.exe'],
    category: 'casual',
  },
  {
    name: 'Stardew Valley',
    executables: ['Stardew Valley.exe'],
    category: 'casual',
  },

  // Social
  {
    name: 'VRChat',
    executables: ['VRChat.exe'],
    category: 'social',
  },
  {
    name: 'Rec Room',
    executables: ['RecRoom.exe'],
    category: 'social',
  },
];

export const CATEGORY_COLORS = {
  competitive: {
    bg: 'hsl(0, 65%, 95%)',
    text: 'hsl(0, 70%, 45%)',
  },
  creative: {
    bg: 'hsl(280, 60%, 95%)',
    text: 'hsl(280, 60%, 45%)',
  },
  casual: {
    bg: 'hsl(200, 70%, 95%)',
    text: 'hsl(200, 70%, 40%)',
  },
  social: {
    bg: 'hsl(145, 55%, 94%)',
    text: 'hsl(145, 55%, 35%)',
  },
  unknown: {
    bg: 'hsl(240, 4%, 83%)',
    text: 'hsl(240, 5%, 10%)',
  },
};


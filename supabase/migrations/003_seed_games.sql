-- Insert known games
INSERT INTO games (name, category, process_name) VALUES
  ('Fortnite', 'competitive', 'FortniteClient-Win64-Shipping.exe'),
  ('Valorant', 'competitive', 'VALORANT-Win64-Shipping.exe'),
  ('Roblox', 'creative', 'RobloxPlayerBeta.exe'),
  ('Minecraft', 'creative', 'Minecraft.Windows.exe'),
  ('Minecraft Java', 'creative', 'javaw.exe'),
  ('League of Legends', 'competitive', 'League of Legends.exe'),
  ('Counter-Strike 2', 'competitive', 'cs2.exe'),
  ('Grand Theft Auto V', 'casual', 'GTA5.exe'),
  ('Discord', 'social', 'Discord.exe'),
  ('Overwatch 2', 'competitive', 'Overwatch.exe'),
  ('Apex Legends', 'competitive', 'r5apex.exe'),
  ('Call of Duty', 'competitive', 'cod.exe'),
  ('Among Us', 'social', 'Among Us.exe'),
  ('Fall Guys', 'casual', 'FallGuys_client.exe'),
  ('Rocket League', 'competitive', 'RocketLeague.exe'),
  ('Steam', 'social', 'steam.exe'),
  ('Epic Games', 'social', 'EpicGamesLauncher.exe')
ON CONFLICT (name) DO NOTHING;


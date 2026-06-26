
# Announcement [2026-06-26]
- <b><font color="#00bfff">Welcome to the custom Arras server!</font></b>
- This server runs <b>FFA Super Growth Arms Race</b> — level up to 10,000, grow stronger with every kill, and face Arms Race bosses!
- Mobile players: touch joysticks appear automatically. Use the left joystick to move, right to aim and shoot.
- Admin token: ask the server owner for access to developer powers.
- Up to 50 players + 20 AI bots are active at all times.

# Event [2026-06-26]
- <b><font color="#ff9900">Super Growth Mode is LIVE!</font></b>
- Level cap raised to <b>10,000</b> — the higher your level the more powerful you become
- Skill points continue unlocking all the way up, giving you incredible tank customization
- Arms Race boss events fire every 3 minutes — survive them for big XP rewards
- <b><font color="#11e9a1">20 AI bots</font></b> are always in the arena so there's never a dull moment

# Update [2026-06-26]
- Launched custom server with Super Growth + Arms Race stacked modifiers
- Added mobile-friendly touch controls: dual joysticks, crosshair aim, big-joystick mode
- Device detection auto-switches UI to mobile layout on phones and tablets
- Server cap set to 50 players with 20 bots filling the arena
- Admin code configured for server owner (enter in the token field on the main menu)

# Update [2026-06-01]
- Upgraded to Open Source Arras v2.0.11.6
- All 3,004 entity definitions loaded including bosses, elites, celestials, and mysticals
- All gamemodes available: FFA, TDM, Growth, Arms Race, Sandbox, Domination, Siege, Tag, Mothership, and more
- Arms Race special bosses added: rogueAlcazar_AR, thaumaturge_AR, nestKeeper, eliteSkimmer

# Balance [2026-06-26]
- <b>Super Growth level cap:</b> 10,000 (vs standard Growth's 1,000)
- <b>Skill points:</b> awarded every level up to 40, then every odd level to 100, then every 5th to 500, then every 20th beyond
- <b>Game speed:</b> 1.2x (slightly faster than default for more action)
- <b>Boss spawn cooldown:</b> 180s (faster than default 260s — more boss fights!)
- <b>Food cap:</b> 120 (vs default 70 — more polygons to farm)
- <b>Bot cap:</b> 20 AI opponents always active

# Balance Update [2026-06-26]
- Arms Race modifier stacked on top of Super Growth
- Arms Race unlocks special tank progression and new boss variants
- Elite bosses: Destroyer, Gunner, Sprayer, Battleship, Spawner
- Castle bosses: rogueAlcazar Arms Race variant
- Summoner bosses: thaumaturge AR, eliteSkimmer, nestKeeper

# Balance Update Details [2026-06-26]
- <b>Bullet spawn offset:</b> 1.0 (fully outside barrel, standard)
- <b>Damage multiplier:</b> 1.0x
- <b>Knockback multiplier:</b> 1.1x
- <b>Regeneration tick:</b> 100ms
- <b>Respawn delay:</b> 0s (instant respawn)
- <b>Max heartbeat interval:</b> 300,000ms (5 min disconnect timeout)

# Patch [2026-06-26]
- Fixed server to use PORT environment variable for Replit compatibility
- Fixed Worker thread path for serverLoader so game servers boot correctly
- Configured share_client_server mode so all game traffic routes through one port
- Set DEVELOPER token to admin code for owner access
- Removed unused TypeScript build pipeline, server now runs directly via Node.js

# Patch [2026-06-01]
- Open Source Arras base code integrated from zip
- All server, client, font, image, and definition files copied into artifact
- Worker thread absolute path fix applied to serverLoader reference
- package.json version field and pjson inlined to avoid path resolution error

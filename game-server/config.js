// Determine host — works on Render, Replit, and local.
// On Render: RENDER_EXTERNAL_HOSTNAME is set automatically, e.g. "myapp.onrender.com"
// On Replit: REPLIT_DEV_DOMAIN is set
// Locally: falls back to localhost:PORT
const _PORT = process.env.PORT ? parseInt(process.env.PORT) : 3000;

function resolveHost() {
    if (process.env.RENDER_EXTERNAL_HOSTNAME) return process.env.RENDER_EXTERNAL_HOSTNAME;
    if (process.env.REPLIT_DEV_DOMAIN)        return process.env.REPLIT_DEV_DOMAIN;
    return `localhost:${_PORT}`;
}
const _HOST = resolveHost();

module.exports = {
    // Open Source Arras
    devBuild: false,

    // Client
    main_menu: 'index.html',
    host: _HOST,
    port: _PORT,

    // Server
    visible_list_interval: 250,
    startup_logs: true,
    load_all_mockups: false,

    servers: [
        {
            // share_client_server routes WebSocket through the same HTTP port.
            // Required on Render / Replit since only one port is exposed externally.
            share_client_server: true,

            id: 'main',
            region: "US",
            gamemode: ['ffa', 'supergrowth', 'arms_race'],
            player_cap: 50,

            featured: true,
            unlisted: false,
            private: false,

            properties: {
                bot_cap: 20,
            }
        },
    ],

    // Web Server
    allow_ACAO: true, // Allow CORS — needed on Render so the WS upgrade is accepted

    // Map
    map_tile_width: 420,
    map_tile_height: 420,

    spawn_message: "Welcome to Arras Mobile!\nYou are invulnerable until you move or shoot.\nPlease report any bugs!",
    token_message: "Friendly reminder: Please do not repeatedly kill others with an overpowered tank.",

    chat_message_duration: 15_000,
    popup_message_duration: 10_000,
    sanitize_chat_input: true,

    // Seasonal
    fireworks: false,
    thanksgiving: false,
    spooky_theme: false,

    // Gameplay
    game_speed: 1,
    run_speed: 1.5,
    max_heartbeat_interval: 300_000,
    respawn_delay: 0,

    bullet_spawn_offset: 1,
    damage_multiplier: 1,
    knockback_multiplier: 1.1,
    glass_health_factor: 2,
    room_bound_force: 0.01,
    soft_max_skill: 0.59,

    defineLevelSkillPoints: level => {
        if (level < 2) return 0;
        if (level <= 40) return 1;
        if (level <= 45 && level & 1 === 1) return 1;
        return 0;
    },

    // Boss spawning
    boss_cap: 3,
    boss_name_timer: 20,
    spawn_boss_every: 2,

    // Misc
    friendly_fire: false,
    mothership: false,

    // Leaderboard
    leaderboard_length: 10,

    // Arena
    arena_close_timer: 3,
    arena_close_level: 1,
    arena_close_percent: 0.0003,

    // These are boss lists by gamemode
    ffa: {
        bosses: ['eliteDestroyer', 'eliteGunner', 'eliteSprayer', 'eliteBattleship', 'eliteSpawner'],
    },
    arms_race: {
        bosses: ['eliteDestroyer', 'eliteGunner', 'eliteSprayer', 'eliteBattleship', 'eliteSpawner', 'paladin', 'freyja', 'zaphkiel', 'nyx', 'theia', 'atlas'],
    },
    siege: {
        bosses: [],
    },
    domination: {
        teams: 4
    },
    mothership_teams: {
        teams: 2,
    },
    tdm: {
        teams: 2,
    },
    tag: {
        teams: 4
    }
};

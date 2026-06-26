module.exports = {
    level_cap: 10000,
    growth: true,
    game_speed: 1.2,
    food_cap: 120,
    boss_spawn_cooldown: 180,
    defineLevelSkillPoints: level => {
        if (level <= 40) return 1;
        if (level <= 45 && (level & 1) == 1) return 1;
        if (level <= 100 && (level % 2) == 1) return 1;
        if (level <= 500 && (level % 5) == 1) return 1;
        if (level % 20 == 1) return 1;
        return 0;
    }
}

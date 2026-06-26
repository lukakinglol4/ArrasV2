// ULTRA ARMS RACE — arms race but with higher level cap, all bosses enabled
module.exports = {
    arms_race: true,
    level_cap: 20000,
    growth: true,
    boss_cap: 8,
    spawn_boss_every: 1,
    defineLevelSkillPoints: level => {
        if (level < 2) return 0;
        if (level <= 40) return 1;
        if (level <= 60 && (level & 1) === 1) return 1;
        if (level % 5 === 1) return 1;
        return 0;
    },
    spawn_message: "ULTRA ARMS RACE — the full arms race experience with endless growth!",
}

/**
 * CombatFeatType enum.
 * 
 * KotOR JS - A remake of the Odyssey Game Engine that powered KotOR I & II
 * 
 * @file CombatFeatType.ts
 * @author KobaltBlu <https://github.com/KobaltBlu>
 * @license {@link https://www.gnu.org/licenses/gpl-3.0.txt|GPLv3}
 * @enum
 */
export enum CombatFeatType {
  //****
  ADVANCED_JEDI_DEFENSE = 1,
  XXXX_ADVANCED_GUARD_STANCE = 2,
  TWO_WEAPON_FIGHTING = 3,
  ARMOUR_PROF_HEAVY = 4,
  ARMOUR_PROF_LIGHT = 5,
  ARMOUR_PROF_MEDIUM = 6,
  CAUTIOUS = 7,
  CRITICAL_STRIKE = 8,
  TWO_WEAPON_ADVANCED = 9,
  EMPATHY = 10,
  FLURRY = 11,
  GEAR_HEAD = 12,
  CONDITIONING = 13,
  IMPLANT_LEVEL_1 = 14,
  IMPLANT_LEVEL_2 = 15,
  IMPLANT_LEVEL_3 = 16,
  IMPROVED_POWER_ATTACK = 17,
  IMPROVED_POWER_BLAST = 18,
  IMPROVED_CRITICAL_STRIKE = 19,
  IMPROVED_SNIPER_SHOT = 20,
  IMPROVED_CONDITIONING = 21,
  MASTER_CONDITIONING = 22,
  //****
  MASTER_JEDI_DEFENSE = 24,
  XXXX_MASTER_GUARD_STANCE = 25,
  MASTER_RAPID_SHOT = 26,
  XXXX_PERCEPTIVE = 27,
  POWER_ATTACK = 28,
  POWER_BLAST = 29,
  RAPID_SHOT = 30,
  SNIPER_SHOT = 31,
  WEAPON_FOCUS_BLASTER = 32,
  WEAPON_FOCUS_BLASTER_RIFLE = 33,
  XXXX_WEAPON_FOCUS_GRENADE = 34,
  WEAPON_FOCUS_HEAVY_WEAPONS = 35,
  WEAPON_FOCUS_LIGHTSABER = 36,
  WEAPON_FOCUS_MELEE_WEAPONS = 37,
  XXXX_WEAPON_FOCUS_SIMPLE_WEAPONS = 38,
  WEAPON_PROF_BLASTER = 39,
  WEAPON_PROF_BLASTER_RIFLE = 40,
  XXXX_WEAPON_PROF_GRENADE = 41,
  WEAPON_PROF_HEAVY_WEAPONS = 42,
  WEAPON_PROF_LIGHTSABER = 43,
  WEAPON_PROF_MELEE_WEAPONS = 44,
  XXXX_WEAPON_PROF_SIMPLE_WEAPONS = 45,
  WEAPON_SPEC_BLASTER = 46,
  WEAPON_SPEC_BLASTER_RIFLE = 47,
  XXXX_WEAPON_SPEC_GRENADE = 48,
  WEAPON_SPEC_HEAVY_WEAPONS = 49,
  WEAPON_SPEC_LIGHTSABER = 50,
  WEAPON_SPEC_MELEE_WEAPONS = 51,
  XXXX_WEAPON_SPEC_SIMPLE_WEAPONS = 52,
  MASTER_FLURRY = 53,
  XXXX_GUARD_STANCE = 54,
  JEDI_DEFENSE = 55,
  UNCANNY_DODGE_1 = 56,
  UNCANNY_DODGE_2 = 57,
  XXXX_SKILL_FOCUS_COMPUTER_USE = 58,
  //****
  SNEAK_ATTACK_1D6 = 60,
  SNEAK_ATTACK_2D6 = 61,
  SNEAK_ATTACK_3D6 = 62,
  SNEAK_ATTACK_4D6 = 63,
  SNEAK_ATTACK_5D6 = 64,
  SNEAK_ATTACK_6D6 = 65,
  SNEAK_ATTACK_7D6 = 66,
  SNEAK_ATTACK_8D6 = 67,
  SNEAK_ATTACK_9D6 = 68,
  SNEAK_ATTACK_10D6 = 69,
  XXXX_SKILL_FOCUS_DEMOLITIONS = 70,
  XXXX_SKILL_FOCUS_STEALTH = 71,
  XXXX_SKILL_FOCUS_AWARENESS = 72,
  XXXX_SKILL_FOCUS_PERSUADE = 73,
  XXXX_SKILL_FOCUS_REPAIR = 74,
  XXXX_SKILL_FOCUS_SECURITY = 75,
  XXXX_SKILL_FOCUS_TREAT_INJURY = 76,
  MASTER_SNIPER_SHOT = 77,
  DROID_UPGRADE_1 = 78,
  DROID_UPGRADE_2 = 79,
  DROID_UPGRADE_3 = 80,
  MASTER_CRITICAL_STRIKE = 81,
  MASTER_POWER_BLAST = 82,
  MASTER_POWER_ATTACK = 83,
  TOUGHNESS = 84,
  TWO_WEAPON_MASTERY = 85,
  XXXX_FORCE_FOCUS_ALTER = 86,
  XXXX_FORCE_FOCUS_CONTROL = 87,
  FORCE_FOCUS = 88,
  FORCE_FOCUS_ADVANCED = 89,
  FORCE_FOCUS_MASTERY = 90,
  IMPROVED_FLURRY = 91,
  IMPROVED_RAPID_SHOT = 92,
  PROFICIENCY_ALL = 93,
  BATTLE_MEDITATION = 94,
  WOOKIE_ENDURANCE = 95,
  BLASTER_INTEGRATION = 96,
  FORCE_CAMOFLAGE = 97,
  FORCE_IMMUNITY_FEAR = 98,
  FORCE_IMMUNITY_STUN = 99,
  FORCE_IMMUNITY_PARALYSIS = 100,
  FORCE_JUMP = 101,
  FORCE_JUMP_ADVANCED = 102,
  FORCE_JUMP_MASTERY = 103,
  SCOUNDRELS_LUCK = 104,
  IMPROVED_SCOUNDRELS_LUCK = 105,
  MASTER_SCOUNDRELS_LUCK = 106,
  JEDI_SENSE = 107,
  KNIGHT_SENSE = 108,
  MASTER_SENSE = 109,
  LOGIC_UPGRADE_COMBAT = 110,
  LOGIC_UPGRADE_TACTICIAN = 111,
  LOGIC_UPGRADE_BATTLE_DROID = 112,
  DUELING = 113,
  ADVANCED_DUELING = 114,
  MASTER_DUELING = 115,
  FORCE_SENSITIVE = 116,
  IMPROVED_CAUTION = 117,
  MASTER_CAUTION = 118,
  GEAR_HEAD_ADEPT = 119,
  GEAR_HEAD_MASTER = 120,
  IMPROVED_EMPATHY = 121,
  MASTER__EMPATHY = 122,
  IMPROVED_TOUGHNESS = 123,
  MASTER_TOUGHNESS = 124,

  //BEGIN: TSL_FEATS

  EVASION = 125,
  TARGETING_1 = 126,
  TARGETING_2 = 127,
  TARGETING_3 = 128,
  TARGETING_4 = 129,
  TARGETING_5 = 130,
  TARGETING_6 = 131,
  TARGETING_7 = 132,
  TARGETING_8 = 133,
  XXXX_TARGETING_9 = 134,
  XXXX_TARGETING_10 = 135,
  XXXPRECISE_SHOT_I = 136,
  XXXPRECISE_SHOT_II = 137,
  XXXPRECISE_SHOT_III = 138,
  CLOSE_COMBAT = 139,
  IMPROVED_CLOSE_COMBAT = 140,
  XXXIMPROVED_FORCE_CAMOUFLAGE = 141,
  XXXMASTER_FORCE_CAMOUFLAGE = 142,
  REGENERATE_FORCE_POINTS = 143,
  XXXX_CRUSH_OPPOSITION_I = 144,
  XXXX_CRUSH_OPPOSITION_II = 145,
  XXXX_CRUSH_OPPOSITION_III = 146,
  XXXX_CRUSH_OPPOSITION_IV = 147,
  XXXX_CRUSH_OPPOSITION_V = 148,
  DARK_SIDE_CORRUPTION = 149,
  IGNORE_PAIN_I = 150,
  IGNORE_PAIN_II = 151,
  IGNORE_PAIN_III = 152,
  INCREASE_COMBAT_DAMAGE_I = 153,
  INCREASE_COMBAT_DAMAGE_II = 154,
  INCREASE_COMBAT_DAMAGE_III = 155,
  SUPER_WEAPON_FOCUS_LIGHTSABER_I = 156,
  SUPER_WEAPON_FOCUS_LIGHTSABER_II = 157,
  SUPER_WEAPON_FOCUS_LIGHTSABER_III = 158,
  SUPER_WEAPON_FOCUS_2_WEAPON_I = 159,
  SUPER_WEAPON_FOCUS_2_WEAPON_II = 160,
  SUPER_WEAPON_FOCUS_2_WEAPON_III = 161,
  XXXX_INSPIRE_FOLLOWERS_I = 162,
  XXXX_INSPIRE_FOLLOWERS_II = 163,
  XXXX_INSPIRE_FOLLOWERS_III = 164,
  XXXX_INSPIRE_FOLLOWERS_IV = 165,
  XXXX_INSPIRE_FOLLOWERS_V = 166,
  LIGHT_SIDE_ENLIGHTENMENT = 167,
  DEFLECT = 168,
  INNER_STRENGTH_I = 169,
  INNER_STRENGTH_II = 170,
  INNER_STRENGTH_III = 171,
  INCREASE_MELEE_DAMAGE_I = 172,
  INCREASE_MELEE_DAMAGE_II = 173,
  INCREASE_MELEE_DAMAGE_III = 174,
  CRAFT = 175,
  MASTERCRAFT_WEAPONS_I = 176,
  MASTERCRAFT_WEAPONS_II = 177,
  MASTERCRAFT_WEAPONS_III = 178,
  MASTERCRAFT_ARMOR_I =  179,
  MASTERCRAFT_ARMOR_II = 180,
  MASTERCRAFT_ARMOR_III = 181,
  DROID_INTERFACE = 182,
  CLASS_SKILL_AWARENESS = 183,
  CLASS_SKILL_COMPUTER_USE = 184,
  CLASS_SKILL_DEMOLITIONS = 185,
  CLASS_SKILL_REPAIR = 186,
  CLASS_SKILL_SECURITY = 187,
  CLASS_SKILL_STEALTH = 188,
  CLASS_SKILL_TREAT_INJURY = 189,
  DUAL_STRIKE = 190,
  IMPROVED_DUAL_STRIKE = 191,
  MASTER_DUAL_STRIKE = 192,
  FINESSE_LIGHTSABERS = 193,
  FINESSE_MELEE_WEAPONS = 194,
  XXXX_MOBILITY = 195,
  REGENERATE_VITALITY_POINTS = 196,
  STEALTH_RUN = 197,
  KINETIC_COMBAT = 198,
  SURVIVAL = 199,
  MANDALORIAN_COURAGE = 200,
  PERSONAL_CLOAKING_SHIELD = 201,
  MENTOR = 202,
  IMPLANT_SWITCHING = 203,
  SPIRIT = 204,
  FORCE_CHAIN = 205,
  WAR_VETERAN = 206,
  COMPLEX_UNARMED_ANIMS = 207,
  WEAPON_PROF_WRIST_MOUNTED = 208,
  ECHANI_STRIKE_I = 209,
  ECHANI_STRIKE_II = 210,
  ECHANI_STRIKE_III = 211,
  UNARMED_SPECIALIST_I = 212,
  UNARMED_SPECIALIST_II = 213,
  UNARMED_SPECIALIST_III = 214,
  UNARMED_SPECIALIST_IV = 215,
  UNARMED_SPECIALIST_V = 216,
  UNARMED_SPECIALIST_VI = 217,
  UNARMED_SPECIALIST_VII = 218,
  UNARMED_SPECIALIST_VIII = 219,
  SHIELD_BREAKER = 220,
  REPULSOR_STRIKE = 221,
  ELECTRICAL_STRIKE = 222,
  GRAVITONIC_STRIKE = 223,
  WOOKIEE_TOUGHNESS_II = 224,
  WOOKIEE_TOUGHNESS_III = 225,
  XXXPRECISE_SHOT_IV = 226,
  XXXPRECISE_SHOT_V = 227,
  ASSASSIN_PROTOCOL_I = 228,
  ASSASSIN_PROTOCOL_II = 229,
  ASSASSIN_PROTOCOL_III = 230,
  WOOKIEE_RAGE_I = 231,
  WOOKIEE_RAGE_II = 232,
  WOOKIEE_RAGE_III = 233,
  DROID_TRICK = 234,
  DROID_CONFUSION = 235,
  FIGHTING_SPIRIT = 236,
  HEROIC_RESOLVE = 237,
  MINE_IMMUNITY = 238,
  POINT_GUARD = 239,
  PRECISE_SHOT_I = 240,
  PRECISE_SHOT_II = 241,
  PRECISE_SHOT_III = 242,
  PRECISE_SHOT_IV = 243,
  PRECISE_SHOT_V = 244,
}
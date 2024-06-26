/**
 * GameEffectType enum.
 * 
 * KotOR JS - A remake of the Odyssey Game Engine that powered KotOR I & II
 * 
 * @file GameEffectType.ts
 * @author KobaltBlu <https://github.com/KobaltBlu>
 * @license {@link https://www.gnu.org/licenses/gpl-3.0.txt|GPLv3}
 * @enum
 */
export enum GameEffectType {
  EffectHaste = 0x01,
  EffectDamageResistance = 0x02,
  EffectSlow = 0x03,
  EffectResurrection = 0x04,
  EffectDisease = 0x05,
  EffectSummonCreature = 0x06,
  EffectRegenerate = 0x07,
  EffectSetState = 0x08,
  EffectSetStateInternal = 0x09,
  EffectAttackIncrease = 0x0A,
  EffectAttackDecrease = 0x0B,
  EffectDamageReduction = 0x0C,
  EffectDamageIncrease = 0x0D,
  EffectDamageDecrease = 0x0E,
  EffectTemporaryHitPoints = 0x0F,
  EffectDamageImmunityIncrease = 0x10,
  EffectDamageImmunityDecrease = 0x11,
  EffectEntangle = 0x12,
  EffectDeath = 0x13,
  EffectKnockdown = 0x14,
  EffectDeaf = 0x15,
  EffectImmunity = 0x16,
  EffectSetAIState = 0x17,
  EffectEnemyAttackBonus = 0x18,
  EffectArcaneSpellFailure = 0x19,
  EffectSavingThrowIncrease = 0x1A,
  EffectSavingThrowDecrease = 0x1B,
  EffectMovementSpeedIncrease = 0x1C,
  EffectMovementSpeedDecrease = 0x1D,
  EffectVisualEffect = 0x1E,
  EffectAreaOfEffect = 0x1F,
  EffectBeam = 0x20,
  EffectForceResistanceIncrease = 0x21,
  EffectForceResistanceDecrease = 0x22,
  EffectPoison = 0x23,
  EffectAbilityIncrease = 0x24,
  EffectAbilityDecrease = 0x25,
  EffectDamage = 0x26,
  EffectHeal = 0x27,
  EffectLink = 0x28,
  EffectModifyNumAttacks = 0x2C,
  EffectCurse = 0x2D,
  EffectSilence = 0x2E,
  EffectInvisibility = 0x2F,
  EffectACIncrease = 0x30,
  EffectACDecrease = 0x31,
  EffectSpellImmunity = 0x32,
  EffectDispellMagic = 0x33,
  EffectDispellMagicBest = 0x34,
  EffectLight = 0x36,
  EffectSkillIncrease = 0x37,
  EffectSkillDecrease = 0x38,
  EffectHitPointChangeWhenDying = 0x39,
  EffectSetWalkAnimation = 0x3A,
  EffectLimitMovementSpeed = 0x3B,
  EffectForcePushed = 0x3C,
  EffectDamageShield = 0x3D,
  EffectDisguise = 0x3E,
  EffectSanctuary = 0x3F,
  EffectTimeStop = 0x40,
  EffectSpellLevelAbsorption = 0x41,
  EffectIcon = 0x43,
  EffectRacialType = 0x44,
  EffectSeeInvisible = 0x46,
  EffectUltraVision = 0x47,
  EffectTrueseeing = 0x48,
  EffectBlindness = 0x49,
  EffectDarkness = 0x4A,
  EffectMissChance = 0x4B,
  EffectConcealment = 0x4C,
  EffectAppear = 0x51,
  EffectNegativeLevel = 0x52,
  EffectBonusFeat = 0x53,
  EffectSummonParty = 0x59,
  EffectForceDrain = 0x5A,
  EffectTemporaryForce = 0x5B,
  EffectBlasterDeflectionIncrease = 0x5C,
  EffectBlasterDeflectionDecrease = 0x5D,
  EffectDamageForcePoints = 0x5F,
  EffectHealForcePoints = 0x60,
  EffectBodyFuel = 0x62,
  EffectPsychicStatic = 0x63,
  EffectLightSaberThrow = 0x64,
  EffectAssuredHit = 0x65,
  EffectForceJump = 0x66,
  EffectAssuredDeflection = 0x68,
  EffectForceResisted = 0x69,
  EffectForceFizzle = 0x6A,
  EffectForceShield = 0x6B,
  EffectPureGoodPowers = 0x6C,
  EfffectPureEvilPowers = 0x6D,
  EffectInvalidEffect
};
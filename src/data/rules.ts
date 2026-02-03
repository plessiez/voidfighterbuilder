import type { DiceValue, ShipRules, ShipType } from '../models/types'

export const DICE_VALUES: DiceValue[] = ['2d6', '2d8', '2d10']

export const FIREPOWER_POINTS: Record<DiceValue, number> = {
  '2d6': 2,
  '2d8': 4,
  '2d10': 6,
}

export const DEFENSE_POINTS: Record<DiceValue, number> = {
  '2d6': 2,
  '2d8': 4,
  '2d10': 6,
}

export const PILOT_POINTS: Record<DiceValue, number> = {
  '2d6': 1,
  '2d8': 3,
  '2d10': 5,
}

export const SPEED_POINTS: Record<1 | 2 | 3, number> = {
  1: 1,
  2: 3,
  3: 5,
}

export const SHIP_RULES: Record<ShipType, ShipRules> = {
  Snubfighter: {
    type: 'Snubfighter',
    maxPoints: 14,
    maxGuns: 2,
    maxUpgrades: 3,
    speedRange: [2, 3],
    firstGunMustBeForward: true,
    allowedDefense: ['2d6'],
    allowedFirepower: ['2d6', '2d8'],
    allowedPilotSkills: ['2d6', '2d8', '2d10'],
  },
  Gunship: {
    type: 'Gunship',
    maxPoints: 20,
    maxGuns: 2,
    maxUpgrades: 4,
    speedRange: [1, 2],
    firstGunMustBeForward: false,
    allowedDefense: ['2d8'],
    allowedFirepower: ['2d6', '2d8', '2d10'],
    allowedPilotSkills: ['2d6', '2d8', '2d10'],
  },
  Corvette: {
    type: 'Corvette',
    maxPoints: 30,
    maxGuns: 3,
    maxUpgrades: 5,
    speedRange: [1, 1],
    firstGunMustBeForward: false,
    allowedDefense: ['2d10'],
    allowedFirepower: ['2d8', '2d10'],
    allowedPilotSkills: ['2d6', '2d8'],
  },
}

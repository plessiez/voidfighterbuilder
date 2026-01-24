import { DEFENSE_POINTS, FIREPOWER_POINTS, PILOT_POINTS, SPEED_POINTS } from '../data/rules'
import type { DiceValue, Gun, Ship, SquadronEntry, Upgrade } from '../models/types'

export type ShipDraft = Omit<Ship, 'id' | 'points' | 'createdAt' | 'updatedAt'>

const sum = (values: number[]) => values.reduce((total, value) => total + value, 0)

export const calculateGunPoints = (firepower: DiceValue) => FIREPOWER_POINTS[firepower] ?? 0

export const calculateUpgradePoints = (upgrades: Upgrade[]) => upgrades.length

export const calculateShipPoints = (draft: ShipDraft) => {
  const speedPoints = SPEED_POINTS[draft.speed] ?? 0
  const defensePoints = DEFENSE_POINTS[draft.defense] ?? 0
  const gunPoints = sum(draft.guns.map((gun: Gun) => gun.points))
  const upgradePoints = calculateUpgradePoints(draft.upgrades)
  return speedPoints + defensePoints + gunPoints + upgradePoints
}

export const calculatePilotPoints = (skill: DiceValue) => PILOT_POINTS[skill] ?? 0

export const calculateSquadronPoints = (entries: SquadronEntry[], ships: Ship[]) => {
  const shipCost = sum(
    entries.map((entry) => ships.find((ship) => ship.id === entry.shipId)?.points ?? 0)
  )
  const pilotCost = sum(entries.map((entry) => entry.pilotPoints))
  return shipCost + pilotCost
}

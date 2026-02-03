export type ShipType = 'Snubfighter' | 'Gunship' | 'Corvette'
export type DiceValue = '2d6' | '2d8' | '2d10'
export type GunDirection = 'Forward' | 'Rear' | 'Turret'

export type StatModifier = 'firepower' | 'defense' | 'piloting'

export type Gun = {
  id: string
  direction: GunDirection
  firepower: DiceValue
  points: number
}

export type Upgrade = {
  id: string
  key: string
  name: string
  allowedShipTypes: ShipType[]
  rarity: 'Common' | 'Uncommon' | 'Rare'
  rulesText: string
  data?: Record<string, unknown>
  statModifier?: StatModifier
}

export type Ship = {
  id: string
  name: string
  type: ShipType
  speed: 1 | 2 | 3
  defense: DiceValue
  guns: Gun[]
  upgrades: Upgrade[]
  points: number
  createdAt: string
  updatedAt: string
}

export type SquadronEntry = {
  id: string
  shipId: string
  pilotSkill: DiceValue
  pilotPoints: number
}

export type Squadron = {
  id: string
  name: string
  entries: SquadronEntry[]
  points: number
  createdAt: string
  updatedAt: string
}

export type StorageState = {
  ships: Ship[]
  squadrons: Squadron[]
  version: number
}

export type ShipRules = {
  type: ShipType
  maxPoints: number
  maxGuns: number
  maxUpgrades: number
  speedRange: [1 | 2 | 3, 1 | 2 | 3]
  firstGunMustBeForward: boolean
  allowedDefense: DiceValue[]
  allowedFirepower: DiceValue[]
  allowedPilotSkills: DiceValue[]
}

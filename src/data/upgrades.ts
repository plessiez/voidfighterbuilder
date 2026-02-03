import type { ShipType, StatModifier, Upgrade } from '../models/types'

export type UpgradeDefinition = Omit<Upgrade, 'id'>

const STAT_MODIFIER_PILOTING: StatModifier = 'piloting'
const STAT_MODIFIER_DEFENSE: StatModifier = 'defense'
const STAT_MODIFIER_FIREPOWER: StatModifier = 'firepower'

export const UPGRADE_DEFINITIONS: UpgradeDefinition[] = [
  {
    key: 'agile',
    name: 'Agile',
    allowedShipTypes: ['Snubfighter', 'Gunship'],
    rarity: 'Common',
    rulesText: '',
    statModifier: STAT_MODIFIER_PILOTING,
  },
  {
    key: 'carrier',
    name: 'Carrier',
    allowedShipTypes: ['Gunship', 'Corvette'],
    rarity: 'Rare',
    rulesText: '',
  },
  {
    key: 'death-flower',
    name: 'Death Flower',
    allowedShipTypes: ['Snubfighter', 'Gunship'],
    rarity: 'Rare',
    rulesText: '',
  },
  {
    key: 'decoy',
    name: 'Decoy',
    allowedShipTypes: ['Gunship', 'Corvette'],
    rarity: 'Uncommon',
    rulesText: '',
  },
  {
    key: 'ecm',
    name: 'ECM',
    allowedShipTypes: ['Gunship', 'Corvette'],
    rarity: 'Uncommon',
    rulesText: '',
  },
  {
    key: 'emergency-teleporter',
    name: 'Emergency Teleporter',
    allowedShipTypes: ['Snubfighter', 'Gunship'],
    rarity: 'Rare',
    rulesText: '',
  },
  {
    key: 'enhanced-turret',
    name: 'Enhanced Turret',
    allowedShipTypes: ['Gunship', 'Corvette'],
    rarity: 'Uncommon',
    rulesText: '',
  },
  {
    key: 'fast',
    name: 'Fast',
    allowedShipTypes: ['Snubfighter', 'Gunship', 'Corvette'],
    rarity: 'Common',
    rulesText: '',
  },
  {
    key: 'fully-loaded',
    name: 'Fully Loaded',
    allowedShipTypes: ['Snubfighter', 'Gunship', 'Corvette'],
    rarity: 'Common',
    rulesText: '',
  },
  {
    key: 'ground-support',
    name: 'Ground Support',
    allowedShipTypes: ['Gunship'],
    rarity: 'Uncommon',
    rulesText: '',
  },
  {
    key: 'hard-point',
    name: 'Hard Point',
    allowedShipTypes: ['Snubfighter', 'Gunship', 'Corvette'],
    rarity: 'Common',
    rulesText: '',
  },
  {
    key: 'maneuverable',
    name: 'Maneuverable',
    allowedShipTypes: ['Snubfighter', 'Gunship', 'Corvette'],
    rarity: 'Common',
    rulesText: '',
    statModifier: STAT_MODIFIER_PILOTING,

  },
  {
    key: 'mining-charges',
    name: 'Mining Charges',
    allowedShipTypes: ['Gunship', 'Corvette'],
    rarity: 'Rare',
    rulesText: '',
  },
  {
    key: 'reinforced-hull',
    name: 'Reinforced Hull',
    allowedShipTypes: ['Corvette'],
    rarity: 'Rare',
    rulesText: '',
  },
  {
    key: 'repair',
    name: 'Repair',
    allowedShipTypes: ['Snubfighter', 'Gunship', 'Corvette'],
    rarity: 'Common',
    rulesText: '',
  },
  {
    key: 'shields',
    name: 'Shields',
    allowedShipTypes: ['Snubfighter', 'Gunship', 'Corvette'],
    rarity: 'Common',
    rulesText: '',
    statModifier: STAT_MODIFIER_DEFENSE,
  },
  {
    key: 'stealth',
    name: 'Stealth',
    allowedShipTypes: ['Snubfighter', 'Gunship'],
    rarity: 'Uncommon',
    rulesText: '',
  },
  {
    key: 'tailgunner',
    name: 'Tailgunner',
    allowedShipTypes: ['Snubfighter', 'Gunship', 'Corvette'],
    rarity: 'Common',
    rulesText: '',
  },
  {
    key: 'targeting-computer',
    name: 'Targeting Computer',
    allowedShipTypes: ['Snubfighter', 'Gunship', 'Corvette'],
    rarity: 'Common',
    rulesText: '',
    statModifier: STAT_MODIFIER_FIREPOWER,
  },
  {
    key: 'torpedoes',
    name: 'Torpedoes',
    allowedShipTypes: ['Snubfighter', 'Gunship', 'Corvette'],
    rarity: 'Common',
    rulesText: '',
  },
  {
    key: 'tractor-beam',
    name: 'Tractor Beam',
    allowedShipTypes: ['Corvette'],
    rarity: 'Rare',
    rulesText: '',
  },
  {
    key: 'transport',
    name: 'Transport',
    allowedShipTypes: ['Gunship'],
    rarity: 'Uncommon',
    rulesText: '',
  },
]

export const getAllowedUpgrades = (shipType: ShipType) =>
  UPGRADE_DEFINITIONS.filter((upgrade) => upgrade.allowedShipTypes.includes(shipType))

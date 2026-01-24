import { useEffect, useMemo, useState } from 'react'
import type {
  DiceValue,
  Gun,
  GunDirection,
  Ship,
  ShipType,
  Upgrade,
} from '../models/types'
import { SHIP_RULES } from '../data/rules'
import { getAllowedUpgrades } from '../data/upgrades'
import { calculateGunPoints, calculateShipPoints } from '../utils/points'
import type { ShipDraft } from '../utils/points'

const createEmptyDraft = (type: ShipType): ShipDraft => {
  const defaultDefense: Record<ShipType, DiceValue> = {
    Snubfighter: '2d6',
    Gunship: '2d8',
    Corvette: '2d10',
  }

  return {
  name: '',
  type,
    speed: SHIP_RULES[type].speedRange[0],
  defense: defaultDefense[type],
  guns:
    type === 'Snubfighter'
      ? [
          {
            id: crypto.randomUUID(),
            direction: 'Forward',
            firepower: '2d6',
            points: calculateGunPoints('2d6'),
          },
        ]
      : [],
  upgrades: [],
  }
}

const TAILGUNNER_KEY = 'tailgunner'

const hasUpgrade = (upgrades: Upgrade[], key: string) =>
  upgrades.some((upgrade) => upgrade.key === key)

type ShipDesignerProps = {
  ships: Ship[]
  onSaveShip: (ship: Ship) => void
  onDeleteShip: (id: string) => void
}

export const ShipDesigner = ({ ships, onSaveShip, onDeleteShip }: ShipDesignerProps) => {
  const [editingId, setEditingId] = useState<string | null>(null)
  const [draft, setDraft] = useState<ShipDraft>(() => createEmptyDraft('Snubfighter'))
  const [gunDraft, setGunDraft] = useState<{ direction: GunDirection; firepower: DiceValue }>(
    {
      direction: 'Forward',
      firepower: '2d6',
    }
  )
  const [errors, setErrors] = useState<string[]>([])
  const [saveFailed, setSaveFailed] = useState(false)
  const [showForm, setShowForm] = useState(ships.length === 0)

  const rules = SHIP_RULES[draft.type]
  const tailgunnerEnabled = hasUpgrade(draft.upgrades, TAILGUNNER_KEY)
  const allowedUpgrades = useMemo(() => getAllowedUpgrades(draft.type), [draft.type])

  const allowedFirepower = useMemo(() => rules.allowedFirepower, [rules])
  const allowedDefense = useMemo(() => rules.allowedDefense, [rules])
  const defenseLabel = allowedDefense[0] ?? draft.defense
  const allowedDirections = useMemo(() => {
    if (rules.firstGunMustBeForward && draft.guns.length === 0) {
      return ['Forward'] as GunDirection[]
    }

    const directions: GunDirection[] = ['Turret']
    const forwardCount = draft.guns.filter((gun) => gun.direction === 'Forward').length
    const rearCount = draft.guns.filter((gun) => gun.direction === 'Rear').length

    if (forwardCount === 0) {
      directions.unshift('Forward')
    }

    if (tailgunnerEnabled && rearCount === 0) {
      directions.push('Rear')
    }

    return directions
  }, [draft.guns, rules.firstGunMustBeForward, tailgunnerEnabled])

  useEffect(() => {
    if (!allowedDirections.includes(gunDraft.direction)) {
      setGunDraft((prev) => ({ ...prev, direction: allowedDirections[0] ?? 'Turret' }))
    }
  }, [allowedDirections, gunDraft.direction])

  useEffect(() => {
    if (!allowedFirepower.includes(gunDraft.firepower)) {
      setGunDraft((prev) => ({ ...prev, firepower: allowedFirepower[0] ?? '2d6' }))
    }
  }, [allowedFirepower, gunDraft.firepower])

  useEffect(() => {
    setDraft((prev) => ({
      ...prev,
      upgrades: prev.upgrades.filter((upgrade) =>
        upgrade.allowedShipTypes.includes(prev.type)
      ),
    }))
  }, [draft.type])

  useEffect(() => {
    if (ships.length === 0) {
      setShowForm(true)
    }
  }, [ships.length])

  const resetDraft = (type: ShipType = 'Snubfighter') => {
    setEditingId(null)
    setDraft(createEmptyDraft(type))
    setGunDraft({
      direction: 'Forward',
      firepower: SHIP_RULES[type].allowedFirepower[0] ?? '2d6',
    })
    setErrors([])
    setSaveFailed(false)
  }

  const setUpgradeEnabled = (
    key: string,
    enabled: boolean,
    name: string,
    allowedShipTypes: ShipType[],
    rarity: Upgrade['rarity'],
    rulesText: string
  ) => {
    setDraft((prev) => {
      const existing = prev.upgrades.filter((upgrade) => upgrade.key !== key)
      if (!enabled) {
        return { ...prev, upgrades: existing }
      }
      return {
        ...prev,
        upgrades: [
          ...existing,
          {
            id: crypto.randomUUID(),
            key,
            name,
            allowedShipTypes,
            rarity,
            rulesText,
          },
        ],
      }
    })
  }

  const validateFirepowerLimits = (guns: Gun[], type: ShipType) => {
    const issues: string[] = []
    const countByFirepower = guns.reduce<Record<string, number>>((acc, gun) => {
      acc[gun.firepower] = (acc[gun.firepower] ?? 0) + 1
      return acc
    }, {})

    if (type === 'Snubfighter') {
      if ((countByFirepower['2d8'] ?? 0) > 1) {
        issues.push('Snubfighters can only have one 2d8 gun; other guns must be 2d6.')
      }
    }

    if (type === 'Gunship') {
      if ((countByFirepower['2d10'] ?? 0) > 1) {
        issues.push('Gunships can only have one 2d10 gun; others must be 2d6 or 2d8.')
      }
    }

    return issues
  }

  const validateDraft = (candidate: ShipDraft, currentId?: string | null) => {
    const issues: string[] = []

    if (!candidate.name.trim()) {
      issues.push('Ship name is required.')
    }

    const normalized = candidate.name.trim().toLowerCase()
    const duplicate = ships.find(
      (ship) => ship.id !== currentId && ship.name.trim().toLowerCase() === normalized
    )
    if (normalized && duplicate) {
      issues.push('Ship name must be unique.')
    }

    if (
      candidate.speed < rules.speedRange[0] ||
      candidate.speed > rules.speedRange[1]
    ) {
      issues.push(
        `Speed must be between ${rules.speedRange[0]} and ${rules.speedRange[1]} for this type.`
      )
    }

    if (!rules.allowedDefense.includes(candidate.defense)) {
      issues.push('Selected defense is not allowed for this ship type.')
    }

    if (candidate.guns.length > rules.maxGuns) {
      issues.push(`Maximum guns for this type is ${rules.maxGuns}.`)
    }

    if (candidate.upgrades.length > rules.maxUpgrades) {
      issues.push(`Maximum upgrades for this type is ${rules.maxUpgrades}.`)
    }

    if (rules.firstGunMustBeForward && candidate.guns.length > 0) {
      if (candidate.guns[0].direction !== 'Forward') {
        issues.push('First gun must be forward for this ship type.')
      }
    }

    const forwardCount = candidate.guns.filter((gun) => gun.direction === 'Forward').length
    const rearCount = candidate.guns.filter((gun) => gun.direction === 'Rear').length

    if (forwardCount > 1) {
      issues.push('Only one forward gun is allowed.')
    }
    if (rearCount > 1) {
      issues.push('Only one rear gun is allowed.')
    }
    if (rearCount > 0 && !hasUpgrade(candidate.upgrades, TAILGUNNER_KEY)) {
      issues.push('Rear guns require the Tailgunner upgrade.')
    }

    if (candidate.guns.some((gun) => !rules.allowedFirepower.includes(gun.firepower))) {
      issues.push('One or more guns use firepower not allowed for this ship type.')
    }

    issues.push(...validateFirepowerLimits(candidate.guns, candidate.type))

    const points = calculateShipPoints(candidate)
    if (points > rules.maxPoints) {
      issues.push(`Ship exceeds max points (${points}/${rules.maxPoints}).`)
    }

    return issues
  }

  const getGunDraftIssues = () => {
    const issues: string[] = []

    if (draft.guns.length >= rules.maxGuns) {
      issues.push(`Cannot exceed ${rules.maxGuns} guns.`)
    }

    if (rules.firstGunMustBeForward && draft.guns.length === 0) {
      if (gunDraft.direction !== 'Forward') {
        issues.push('First gun must be forward for this ship type.')
      }
    }

    if (gunDraft.direction === 'Forward') {
      const forwardCount = draft.guns.filter((gun) => gun.direction === 'Forward').length
      if (forwardCount >= 1) {
        issues.push('Only one forward gun is allowed.')
      }
    }

    if (gunDraft.direction === 'Rear') {
      const rearCount = draft.guns.filter((gun) => gun.direction === 'Rear').length
      if (rearCount >= 1) {
        issues.push('Only one rear gun is allowed.')
      }
      if (!tailgunnerEnabled) {
        issues.push('Rear guns require the Tailgunner upgrade.')
      }
    }

    if (!rules.allowedFirepower.includes(gunDraft.firepower)) {
      issues.push('Selected firepower is not allowed for this ship type.')
    }

    const candidateGuns = [
      ...draft.guns,
      {
        id: 'candidate',
        direction: gunDraft.direction,
        firepower: gunDraft.firepower,
        points: calculateGunPoints(gunDraft.firepower),
      },
    ]
    issues.push(...validateFirepowerLimits(candidateGuns, draft.type))

    return issues
  }

  const tryAddGun = () => {
    const issues = getGunDraftIssues()

    if (issues.length > 0) {
      setErrors(issues)
      setSaveFailed(false)
      return
    }

    const newGun: Gun = {
      id: crypto.randomUUID(),
      direction: gunDraft.direction,
      firepower: gunDraft.firepower,
      points: calculateGunPoints(gunDraft.firepower),
    }

    setDraft((prev) => ({ ...prev, guns: [...prev.guns, newGun] }))
    setErrors([])
    setSaveFailed(false)
  }

  const onSave = () => {
    const issues = validateDraft(draft, editingId)
    if (issues.length > 0) {
      setErrors(issues)
      setSaveFailed(true)
      return
    }

    const now = new Date().toISOString()
    const points = calculateShipPoints(draft)
    const ship: Ship = {
      ...(editingId ? ships.find((item) => item.id === editingId) : null),
      ...draft,
      id: editingId ?? crypto.randomUUID(),
      points,
      createdAt: editingId
        ? ships.find((item) => item.id === editingId)?.createdAt ?? now
        : now,
      updatedAt: now,
    }

    onSaveShip(ship)
    resetDraft(ship.type)
    setShowForm(false)
  }

  const onEdit = (ship: Ship) => {
    setEditingId(ship.id)
    setDraft({
      name: ship.name,
      type: ship.type,
      speed: ship.speed,
      defense: ship.defense,
      guns: ship.guns,
      upgrades: ship.upgrades,
    })
    setErrors([])
    setSaveFailed(false)
    setShowForm(true)
  }

  const onDelete = (id: string) => {
    if (editingId === id) {
      resetDraft()
    }
    onDeleteShip(id)
  }

  const editingShip = editingId ? ships.find((ship) => ship.id === editingId) : undefined

  const currentPoints = calculateShipPoints(draft)
  const gunDraftIssues = getGunDraftIssues()
  const firepowerCounts = draft.guns.reduce<Record<DiceValue, number>>((acc, gun) => {
    acc[gun.firepower] = (acc[gun.firepower] ?? 0) + 1
    return acc
  }, { '2d6': 0, '2d8': 0, '2d10': 0 })

  return (
    <section className="panel">
      <header className="panel__header">
        <div>
          <h2>Ship Designer</h2>
          <p className="panel__subtitle">Create and edit ships stored in your hangar.</p>
        </div>
      </header>

      <div className="card">
        <h3>Saved Ships</h3>
        {ships.length === 0 ? (
          <p className="muted">No ships saved yet.</p>
        ) : (
          <div className="list">
            {ships.map((ship) => (
              <div key={ship.id} className="list-item">
                <div>
                  <strong>
                    {ship.name} - {ship.type} ({ship.points} pts)
                  </strong>
                  <div className="muted">
                    Speed: {ship.speed} Defence: {ship.defense.toUpperCase()} [
                    {ship.guns.length === 0
                      ? 'No weapons'
                      : ship.guns
                          .map((gun) => `${gun.direction} ${gun.firepower.toUpperCase()}`)
                          .join(', ')}
                    ]
                  </div>
                </div>
                <div className="actions">
                  <button className="button ghost" type="button" onClick={() => onEdit(ship)}>
                    Edit
                  </button>
                  <button className="button danger" type="button" onClick={() => onDelete(ship.id)}>
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
        {ships.length > 0 && !showForm && (
          <button className="button" type="button" onClick={() => setShowForm(true)}>
            Add ship
          </button>
        )}
      </div>

      <div className="panel__grid">
        {showForm && (
          <div className="card">
          <h3>
            {editingId ? `Editing ${editingShip?.name ?? 'Ship'}` : 'New Ship'}
          </h3>

          <div className="form-grid">
            <label className="field">
              <span>Name</span>
              <input
                value={draft.name}
                onChange={(event) => setDraft({ ...draft, name: event.target.value })}
                placeholder="X-Wing"
              />
            </label>

            <label className="field">
              <span>Type</span>
              <select
                value={draft.type}
                onChange={(event) => {
                  const nextType = event.target.value as ShipType
                  resetDraft(nextType)
                }}
              >
                {(['Snubfighter', 'Gunship', 'Corvette'] as ShipType[]).map((type) => (
                  <option key={type} value={type}>
                    {type}
                  </option>
                ))}
              </select>
            </label>

            <label className="field">
              <span>Speed</span>
              <input
                type="number"
                min={rules.speedRange[0]}
                max={rules.speedRange[1]}
                value={draft.speed}
                onChange={(event) => {
                  const next = Number(event.target.value) as 1 | 2 | 3
                  const clamped = Math.min(
                    Math.max(next, rules.speedRange[0]),
                    rules.speedRange[1]
                  ) as 1 | 2 | 3
                  setDraft({
                    ...draft,
                    speed: clamped,
                  })
                }}
              />
            </label>

            <label className="field">
              <span>Defense</span>
              <div className="field__static">{defenseLabel.toUpperCase()}</div>
            </label>
          </div>

          <div className="section">
            <h4>Weapons</h4>
            <div className="muted">
              {draft.type === 'Snubfighter' && (
                <span>
                  Firepower limits: 2d8 max 1 (used {firepowerCounts['2d8']}/1); others must be
                  2d6.
                </span>
              )}
              {draft.type === 'Gunship' && (
                <span>
                  Firepower limits: 2d10 max 1 (used {firepowerCounts['2d10']}/1); others must be
                  2d6 or 2d8.
                </span>
              )}
              {draft.type === 'Corvette' && (
                <span>Firepower limits: minimum 2d8 (2d10 allowed with no cap).</span>
              )}
            </div>

            <div className="list">
              {draft.guns.length === 0 ? (
                <span className="muted">No guns added yet.</span>
              ) : (
                draft.guns.map((gun, index) => (
                  <div key={gun.id} className="list-item">
                    <div>
                      <strong>
                        {index + 1}. {gun.direction} gun
                      </strong>
                    </div>
                    <div className="actions">
                      <select
                        value={gun.firepower}
                        onChange={(event) => {
                          const nextFirepower = event.target.value as DiceValue
                          setDraft((prev) => ({
                            ...prev,
                            guns: prev.guns.map((item) =>
                              item.id === gun.id
                                ? {
                                    ...item,
                                    firepower: nextFirepower,
                                    points: calculateGunPoints(nextFirepower),
                                  }
                                : item
                            ),
                          }))
                        }}
                      >
                        {allowedFirepower.map((firepower) => (
                          <option key={firepower} value={firepower}>
                            {firepower.toUpperCase()}
                          </option>
                        ))}
                      </select>
                      <button
                        type="button"
                        className="button ghost"
                        onClick={() =>
                          setDraft((prev) => ({
                            ...prev,
                            guns: prev.guns.filter((item) => item.id !== gun.id),
                          }))
                        }
                      >
                        Remove
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>

            <div className="form-grid">
              <label className="field">
                <span>Direction</span>
                <select
                  value={gunDraft.direction}
                  onChange={(event) =>
                    setGunDraft({
                      ...gunDraft,
                      direction: event.target.value as GunDirection,
                    })
                  }
                >
                  {allowedDirections.map((direction) => (
                    <option key={direction} value={direction}>
                      {direction}
                    </option>
                  ))}
                </select>
              </label>
              <label className="field">
                <span>Firepower</span>
                <select
                  value={gunDraft.firepower}
                  onChange={(event) =>
                    setGunDraft({
                      ...gunDraft,
                      firepower: event.target.value as DiceValue,
                    })
                  }
                >
                  {allowedFirepower.map((firepower) => (
                    <option key={firepower} value={firepower}>
                      {firepower.toUpperCase()}
                    </option>
                  ))}
                </select>
              </label>
              <button
                className={`button ${gunDraftIssues.length > 0 ? 'disabled' : ''}`}
                type="button"
                onClick={tryAddGun}
              >
                Add gun
              </button>
            </div>
          </div>

          {errors.length > 0 && (
            <div className="alert">
              {saveFailed && <strong>Ship not saved</strong>}
              <ul>
                {errors.map((issue, index) => (
                  <li key={`${issue}-${index}`}>{issue}</li>
                ))}
              </ul>
            </div>
          )}

          <div className="footer-row">
            <div>
              <strong>{currentPoints}</strong> / {rules.maxPoints} pts
            </div>
            <div className="actions">
              <button className="button" type="button" onClick={onSave}>
                {editingId ? 'Update Ship' : 'Save Ship'}
              </button>
              <button className="button ghost" type="button" onClick={() => resetDraft(draft.type)}>
                Clear
              </button>
            </div>
          </div>
        </div>
        )}
        {showForm && (
          <div className="card">
            <h3>Upgrades</h3>
            <div className="section">
              <h4>Upgrades (placeholder)</h4>
              {allowedUpgrades.length === 0 ? (
                <p className="muted">No upgrades available for this ship type.</p>
              ) : (
                allowedUpgrades.map((upgrade) => {
                  const enabled = hasUpgrade(draft.upgrades, upgrade.key)
                  return (
                    <label key={upgrade.key} className="toggle">
                      <input
                        type="checkbox"
                        checked={enabled}
                        onChange={(event) =>
                          setUpgradeEnabled(
                            upgrade.key,
                            event.target.checked,
                            upgrade.name,
                            upgrade.allowedShipTypes,
                            upgrade.rarity,
                            upgrade.rulesText
                          )
                        }
                      />
                      {upgrade.name} ({upgrade.rarity})
                    </label>
                  )
                })
              )}
            </div>
          </div>
        )}
      </div>

      <div className="note">
        <strong>Note:</strong> Points tables and upgrade rules are placeholders and can be replaced later.
      </div>

      {showForm && (
        <div className="rules">
          <h4>Quick rules summary</h4>
          <ul>
            <li>Max guns for {draft.type}: {rules.maxGuns}</li>
            <li>First gun must be forward: {rules.firstGunMustBeForward ? 'Yes' : 'No'}</li>
            <li>Rear guns require Tailgunner upgrade.</li>
            <li>Only one forward and one rear gun per ship; remaining guns are turrets.</li>
          </ul>
        </div>
      )}
    </section>
  )
}

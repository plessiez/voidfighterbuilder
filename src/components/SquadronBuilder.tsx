import { useEffect, useMemo, useRef, useState } from 'react'
import { SHIP_RULES } from '../data/rules'
import type { DiceValue, Ship, Squadron, SquadronEntry } from '../models/types'
import { calculatePilotPoints, calculateSquadronPoints } from '../utils/points'

type SquadronBuilderProps = {
  ships: Ship[]
  squadrons: Squadron[]
  onSaveSquadron: (squadron: Squadron) => void
  onDeleteSquadron: (id: string) => void
}

type SquadronDraft = {
  name: string
  entries: Array<Omit<SquadronEntry, 'pilotPoints'>>
}

const emptyDraft: SquadronDraft = {
  name: '',
  entries: [],
}

export const SquadronBuilder = ({
  ships,
  squadrons,
  onSaveSquadron,
  onDeleteSquadron,
}: SquadronBuilderProps) => {
  const [editingId, setEditingId] = useState<string | null>(null)
  const [draft, setDraft] = useState<SquadronDraft>(emptyDraft)
  const [showForm, setShowForm] = useState(squadrons.length === 0)
  const [selection, setSelection] = useState<{ shipId: string; pilotSkill: DiceValue }>(
    () => ({
      shipId: ships[0]?.id ?? '',
      pilotSkill: '2d6',
    })
  )
  const [errors, setErrors] = useState<string[]>([])
  const [addNotice, setAddNotice] = useState<string | null>(null)
  const noticeTimeoutRef = useRef<number | null>(null)
  const [printSquadronId, setPrintSquadronId] = useState<string | null>(null)

  const selectedShip = useMemo(
    () => ships.find((ship) => ship.id === selection.shipId),
    [selection.shipId, ships]
  )

  const pilotSkillOptions = useMemo(() => {
    if (!selectedShip) {
      return [] as DiceValue[]
    }
    return SHIP_RULES[selectedShip.type].allowedPilotSkills
  }, [selectedShip])

  const resetDraft = () => {
    setEditingId(null)
    setDraft(emptyDraft)
    setErrors([])
    setAddNotice(null)
    if (noticeTimeoutRef.current) {
      window.clearTimeout(noticeTimeoutRef.current)
      noticeTimeoutRef.current = null
    }
  }

  useEffect(() => {
    if (squadrons.length === 0) {
      setShowForm(true)
    }
  }, [squadrons.length])

  useEffect(() => {
    if (!printSquadronId) {
      return
    }

    const handleAfterPrint = () => setPrintSquadronId(null)
    window.addEventListener('afterprint', handleAfterPrint)
    window.setTimeout(() => window.print(), 0)

    return () => {
      window.removeEventListener('afterprint', handleAfterPrint)
    }
  }, [printSquadronId])

  useEffect(() => {
    if (ships.length === 0) {
      setSelection({ shipId: '', pilotSkill: '2d6' })
      return
    }
    if (!selection.shipId) {
      updateSelectionShip(ships[0].id)
    }
  }, [ships, selection.shipId])

  const updateSelectionShip = (shipId: string) => {
    const ship = ships.find((item) => item.id === shipId)
    const allowed = ship ? SHIP_RULES[ship.type].allowedPilotSkills : []
    setSelection({
      shipId,
      pilotSkill: allowed[0] ?? '2d6',
    })
  }

  const addEntry = () => {
    if (!selection.shipId) {
      setErrors(['Select a ship before adding.'])
      return
    }

    if (!selectedShip) {
      setErrors(['Selected ship is no longer available.'])
      return
    }

    if (!pilotSkillOptions.includes(selection.pilotSkill)) {
      setErrors(['Selected pilot skill is not allowed for this ship type.'])
      return
    }

    setDraft((prev) => ({
      ...prev,
      entries: [
        ...prev.entries,
        {
          id: crypto.randomUUID(),
          shipId: selection.shipId,
          pilotSkill: selection.pilotSkill,
        },
      ],
    }))
    setErrors([])
    setAddNotice('Added to squadron.')
    if (noticeTimeoutRef.current) {
      window.clearTimeout(noticeTimeoutRef.current)
    }
    noticeTimeoutRef.current = window.setTimeout(() => {
      setAddNotice(null)
      noticeTimeoutRef.current = null
    }, 2000)
  }

  const validateDraft = (candidate: SquadronDraft) => {
    const issues: string[] = []

    if (!candidate.name.trim()) {
      issues.push('Squadron name is required.')
    }

    if (candidate.entries.length === 0) {
      issues.push('Add at least one ship to the squadron.')
    }

    candidate.entries.forEach((entry) => {
      const ship = ships.find((item) => item.id === entry.shipId)
      if (!ship) {
        issues.push('Squadron contains a missing ship.')
        return
      }
      const allowed = SHIP_RULES[ship.type].allowedPilotSkills
      if (!allowed.includes(entry.pilotSkill)) {
        issues.push(`Pilot skill not allowed for ${ship.name}.`)
      }
    })

    const shipsInSquadron = candidate.entries
      .map((entry) => ships.find((item) => item.id === entry.shipId))
      .filter((ship): ship is NonNullable<typeof ship> => Boolean(ship))

    const uncommonCounts: Record<string, number> = {}
    const rareCounts: Record<string, number> = {}

    shipsInSquadron.forEach((ship) => {
      ship.upgrades.forEach((upgrade) => {
        if (upgrade.rarity === 'Uncommon') {
          uncommonCounts[upgrade.key] = (uncommonCounts[upgrade.key] ?? 0) + 1
        }
        if (upgrade.rarity === 'Rare') {
          rareCounts[upgrade.key] = (rareCounts[upgrade.key] ?? 0) + 1
        }
      })
    })

    Object.entries(uncommonCounts).forEach(([key, count]) => {
      if (count > 3) {
        issues.push(`Uncommon upgrade "${key}" exceeds max of 3 ships.`)
      }
    })

    Object.entries(rareCounts).forEach(([key, count]) => {
      if (count > 1) {
        issues.push(`Rare upgrade "${key}" exceeds max of 1 ship.`)
      }
    })

    return issues
  }

  const onSave = () => {
    const issues = validateDraft(draft)
    if (issues.length > 0) {
      setErrors(issues)
      return
    }

    const now = new Date().toISOString()
    const entries: SquadronEntry[] = draft.entries.map((entry) => ({
      ...entry,
      pilotPoints: calculatePilotPoints(entry.pilotSkill),
    }))

    const squadron: Squadron = {
      ...(editingId ? squadrons.find((item) => item.id === editingId) : null),
      id: editingId ?? crypto.randomUUID(),
      name: draft.name,
      entries,
      points: calculateSquadronPoints(entries, ships),
      createdAt: editingId
        ? squadrons.find((item) => item.id === editingId)?.createdAt ?? now
        : now,
      updatedAt: now,
    }

    onSaveSquadron(squadron)
    resetDraft()
    setShowForm(false)
  }

  const onEdit = (squadron: Squadron) => {
    setEditingId(squadron.id)
    setDraft({
      name: squadron.name,
      entries: squadron.entries.map((entry) => ({
        id: entry.id,
        shipId: entry.shipId,
        pilotSkill: entry.pilotSkill,
      })),
    })
    setErrors([])
    setAddNotice(null)
    setShowForm(true)
  }


  const previewPoints = useMemo(() => {
    const entries: SquadronEntry[] = draft.entries.map((entry) => ({
      ...entry,
      pilotPoints: calculatePilotPoints(entry.pilotSkill),
    }))
    return calculateSquadronPoints(entries, ships)
  }, [draft.entries, ships])

  const printSquadron = printSquadronId
    ? squadrons.find((squadron) => squadron.id === printSquadronId)
    : undefined

  return (
    <section className="panel">
      <header className="panel__header">
        <div>
          <h2>Squadron Builder</h2>
          <p className="panel__subtitle">Assemble squadrons from your saved ships.</p>
        </div>
      </header>

      <div className="card">
        <h3>Saved Squadrons</h3>
        {squadrons.length === 0 ? (
          <p className="muted">No squadrons saved yet.</p>
        ) : (
          <div className="list">
            {squadrons.map((squadron) => (
              <div key={squadron.id} className="list-item">
                <div>
                  <strong>{squadron.name}</strong>
                  <div className="muted">
                    {squadron.entries.length} ships · {squadron.points} pts
                  </div>
                </div>
                <div className="actions">
                  <button
                    className="button ghost"
                    type="button"
                    onClick={() => setPrintSquadronId(squadron.id)}
                  >
                    Print
                  </button>
                  <button className="button ghost" type="button" onClick={() => onEdit(squadron)}>
                    Edit
                  </button>
                  <button
                    className="button danger"
                    type="button"
                    onClick={() => onDeleteSquadron(squadron.id)}
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
        {squadrons.length > 0 && !showForm && (
          <button className="button" type="button" onClick={() => setShowForm(true)}>
            New squadron
          </button>
        )}
      </div>

      {showForm && (
        <div className="panel__grid">
          <div className="card">
            <h3>{editingId ? 'Edit Squadron' : 'New Squadron'}</h3>
            <label className="field">
              <span>Name</span>
              <input
                value={draft.name}
                onChange={(event) => setDraft({ ...draft, name: event.target.value })}
                placeholder="Red Squadron"
              />
            </label>

            <div className="section">
              <h4>Add Ship</h4>
              <div className="form-grid form-grid--ship-pilot">
                <label className="field">
                  <span>Ship</span>
                  <select
                    value={selection.shipId}
                    onChange={(event) => updateSelectionShip(event.target.value)}
                    disabled={ships.length === 0}
                  >
                    {ships.length === 0 ? (
                      <option value="">No ships available</option>
                    ) : (
                      ships.map((ship) => (
                        <option key={ship.id} value={ship.id}>
                          {ship.name} · {ship.type}
                        </option>
                      ))
                    )}
                  </select>
                </label>
                <label className="field">
                  <span>Pilot Skill</span>
                  <select
                    value={selection.pilotSkill}
                    onChange={(event) =>
                      setSelection({
                        ...selection,
                        pilotSkill: event.target.value as DiceValue,
                      })
                    }
                    disabled={!selectedShip}
                  >
                    {pilotSkillOptions.map((skill) => (
                      <option key={skill} value={skill}>
                        {skill.toUpperCase()}
                      </option>
                    ))}
                  </select>
                </label>
                <button className="button" type="button" onClick={addEntry}>
                  Add to squadron
                </button>
              </div>
              {addNotice && <div className="notice">{addNotice}</div>}
            </div>

            <div className="section">
              <h4>Squadron Entries</h4>
              {draft.entries.length === 0 ? (
                <p className="muted">No ships added yet.</p>
              ) : (
                <div className="list">
                  {draft.entries.map((entry) => {
                    const ship = ships.find((item) => item.id === entry.shipId)
                    const basePoints = ship?.points ?? 0
                    const pilotPoints = calculatePilotPoints(entry.pilotSkill)
                    const totalPoints = basePoints + pilotPoints
                    const weaponsLine = ship?.guns.length
                      ? ship.guns
                          .map((gun) => `${gun.direction} ${gun.firepower.toUpperCase()}`)
                          .join(', ')
                      : 'No weapons'
                    const upgradesLine = ship?.upgrades.length
                      ? ship.upgrades
                          .slice()
                          .sort((a, b) => {
                            const order = { Rare: 0, Uncommon: 1, Common: 2 }
                            return order[a.rarity] - order[b.rarity]
                          })
                          .map((upgrade) => `${upgrade.name} (${upgrade.rarity[0]})`)
                          .join(', ')
                      : null
                    const options = ship
                      ? SHIP_RULES[ship.type].allowedPilotSkills
                      : ([] as DiceValue[])
                    return (
                      <div key={entry.id} className="list-item">
                        <div>
                          <strong>
                            {ship?.name ?? 'Missing ship'} {ship?.type ?? 'Unknown type'} -
                            {` ${totalPoints} pts (Ship: ${basePoints}, Pilot: ${pilotPoints})`}
                          </strong>
                          <div className="muted">
                            Speed: {ship?.speed ?? '-'} Defence:{' '}
                            {ship?.defense?.toUpperCase() ?? '-'} [{weaponsLine}]
                          </div>
                          {upgradesLine && <div className="muted">Upgrades: {upgradesLine}</div>}
                        </div>
                        <div className="actions">
                          <select
                            value={entry.pilotSkill}
                            onChange={(event) =>
                              setDraft((prev) => ({
                                ...prev,
                                entries: prev.entries.map((item) =>
                                  item.id === entry.id
                                    ? {
                                        ...item,
                                        pilotSkill: event.target.value as DiceValue,
                                      }
                                    : item
                                ),
                              }))
                            }
                          >
                            {options.map((skill) => (
                              <option key={skill} value={skill}>
                                {skill.toUpperCase()}
                              </option>
                            ))}
                          </select>
                          <button
                            className="button ghost"
                            type="button"
                            onClick={() =>
                              setDraft((prev) => ({
                                ...prev,
                                entries: prev.entries.filter((item) => item.id !== entry.id),
                              }))
                            }
                          >
                            Remove
                          </button>
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>

            {errors.length > 0 && (
              <div className="alert">
                <ul>
                  {errors.map((issue, index) => (
                    <li key={`${issue}-${index}`}>{issue}</li>
                  ))}
                </ul>
              </div>
            )}

            <div className="footer-row">
              <div>
                <strong>{previewPoints}</strong> pts
              </div>
              <div className="actions">
                <button className="button" type="button" onClick={onSave}>
                  {editingId ? 'Update Squadron' : 'Save Squadron'}
                </button>
                <button className="button ghost" type="button" onClick={resetDraft}>
                  Clear
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {showForm && (
        <div className="rules">
          <h4>Quick rules summary</h4>
          <ul>
            <li>Each Rare upgrade can only be used on one ship.</li>
            <li>Each Uncommon upgrade can only be used on a maximum of three ships.</li>
          </ul>
        </div>
      )}

      {printSquadron && (
        <section className="print-only">
          <div className="print-page">
            <header className="print-header">
              <div>
                <h1>{printSquadron.name}</h1>
                <p>Total points: {printSquadron.points}</p>
              </div>
            </header>

            <table className="print-table">
              <thead>
                <tr>
                  <th>Ship</th>
                  <th>Stats</th>
                  <th>Pilot</th>
                  <th>Weapons</th>
                  <th>Upgrades</th>
                  <th>Points</th>
                </tr>
              </thead>
              <tbody>
                {printSquadron.entries.map((entry) => {
                  const ship = ships.find((item) => item.id === entry.shipId)
                  const pilotPoints = calculatePilotPoints(entry.pilotSkill)
                  const totalPoints = (ship?.points ?? 0) + pilotPoints
                  return (
                    <tr key={entry.id}>
                      <td>
                        <strong>{ship?.name ?? 'Missing ship'}</strong>
                        <div className="print-muted">{ship?.type ?? 'Unknown type'}</div>
                      </td>
                      <td>
                        <div>Speed: {ship?.speed ?? '-'}</div>
                        <div>Defence: {ship?.defense?.toUpperCase() ?? '-'}</div>
                      </td>
                      <td>{entry.pilotSkill.toUpperCase()}</td>
                      <td>
                        {ship?.guns.length
                          ? ship.guns
                              .map((gun) => `${gun.direction} ${gun.firepower.toUpperCase()}`)
                              .join('\n')
                          : 'None'}
                      </td>
                      <td>
                        {ship?.upgrades.length
                          ? ship.upgrades
                              .map((upgrade) => upgrade.name.replace(/ /g, '\u00A0'))
                              .join(', ')
                          : 'None'}
                      </td>
                      <td>{totalPoints}</td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </section>
      )}
    </section>
  )
}

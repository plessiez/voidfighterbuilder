import { useEffect, useMemo, useState, type ComponentProps } from 'react'
import './App.css'
import { ShipDesigner } from './components/ShipDesigner'
import { SquadronBuilder } from './components/SquadronBuilder'
import type { StorageState } from './models/types'
import { calculateSquadronPoints } from './utils/points'
import { loadState, saveState } from './utils/storage'

type TabKey = 'ships' | 'squadrons'

const TAB_LABELS: Record<TabKey, string> = {
  ships: 'Ship Designer',
  squadrons: 'Squadron Builder',
}

function App() {
  const [state, setState] = useState<StorageState>(() => loadState())
  const [activeTab, setActiveTab] = useState<TabKey>('ships')

  useEffect(() => {
    saveState(state)
  }, [state])

  const onSaveShip: ComponentProps<typeof ShipDesigner>['onSaveShip'] = (ship) => {
    setState((prev) => {
      const ships = prev.ships.some((item) => item.id === ship.id)
        ? prev.ships.map((item) => (item.id === ship.id ? ship : item))
        : [...prev.ships, ship]

      const squadrons = prev.squadrons.map((squadron) => ({
        ...squadron,
        points: calculateSquadronPoints(squadron.entries, ships),
      }))

      return { ...prev, ships, squadrons }
    })
  }

  const onDeleteShip: ComponentProps<typeof ShipDesigner>['onDeleteShip'] = (id) => {
    setState((prev) => {
      const ships = prev.ships.filter((item) => item.id !== id)
      const squadrons = prev.squadrons.map((squadron) => {
        const entries = squadron.entries.filter((entry) => entry.shipId !== id)
        return {
          ...squadron,
          entries,
          points: calculateSquadronPoints(entries, ships),
        }
      })
      return { ...prev, ships, squadrons }
    })
  }

  const onSaveSquadron: ComponentProps<typeof SquadronBuilder>['onSaveSquadron'] = (
    squadron
  ) => {
    setState((prev) => {
      const squadrons = prev.squadrons.some((item) => item.id === squadron.id)
        ? prev.squadrons.map((item) => (item.id === squadron.id ? squadron : item))
        : [...prev.squadrons, squadron]

      return { ...prev, squadrons }
    })
  }

  const onDeleteSquadron: ComponentProps<typeof SquadronBuilder>['onDeleteSquadron'] = (
    id
  ) => {
    setState((prev) => ({
      ...prev,
      squadrons: prev.squadrons.filter((item) => item.id !== id),
    }))
  }

  const summary = useMemo(
    () => ({ ships: state.ships.length, squadrons: state.squadrons.length }),
    [state.ships.length, state.squadrons.length]
  )

  return (
    <div className="app">
      <header className="app__header">
        <div>
          <h1>VFBuilder</h1>
          <p>Design ships, assemble squadrons, and track points.</p>
        </div>
        <div className="summary">
          <div>
            <strong>{summary.ships}</strong>
            <span>Ships</span>
          </div>
          <div>
            <strong>{summary.squadrons}</strong>
            <span>Squadrons</span>
          </div>
        </div>
      </header>

      <nav className="tabs">
        {(Object.keys(TAB_LABELS) as TabKey[]).map((tab) => (
          <button
            key={tab}
            className={`tab ${activeTab === tab ? 'active' : ''}`}
            type="button"
            onClick={() => setActiveTab(tab)}
          >
            {TAB_LABELS[tab]}
          </button>
        ))}
      </nav>

      <main className="app__content">
        {activeTab === 'ships' ? (
          <ShipDesigner
            ships={state.ships}
            onSaveShip={onSaveShip}
            onDeleteShip={onDeleteShip}
          />
        ) : (
          <SquadronBuilder
            ships={state.ships}
            squadrons={state.squadrons}
            onSaveSquadron={onSaveSquadron}
            onDeleteSquadron={onDeleteSquadron}
          />
        )}
      </main>
    </div>
  )
}

export default App

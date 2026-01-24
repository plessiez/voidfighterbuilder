import type { StorageState } from '../models/types'

const STORAGE_KEY = 'vfbuilder.state'

export const defaultState: StorageState = {
  ships: [],
  squadrons: [],
  version: 1,
}

const isStorageState = (value: unknown): value is StorageState => {
  if (!value || typeof value !== 'object') {
    return false
  }
  const state = value as StorageState
  return Array.isArray(state.ships) && Array.isArray(state.squadrons)
}

export const loadState = (): StorageState => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) {
      return defaultState
    }
    const parsed = JSON.parse(raw)
    if (isStorageState(parsed)) {
      return { ...defaultState, ...parsed }
    }
  } catch {
    return defaultState
  }
  return defaultState
}

export const saveState = (state: StorageState) => {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
}

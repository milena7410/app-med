import { describe, expect, it } from 'vitest'
import { doseLogKey, estimateSupplyDays, getMonthDays, type Medication } from './medication'

const sampleMedication: Medication = {
  id: 'med-1',
  name: 'Registro pessoal',
  times: ['08:00', '20:00'],
  unitsPerDose: 1,
  unit: 'comprimidos',
  stock: 20,
  refillAlertDays: 3,
}

describe('estimateSupplyDays', () => {
  it('estimates remaining supply from the entered schedule and stock', () => {
    expect(estimateSupplyDays(sampleMedication)).toBe(10)
  })

  it('returns no estimate if the schedule is unusable', () => {
    expect(estimateSupplyDays({ ...sampleMedication, times: [] })).toBeNull()
  })
})

describe('calendar and dose log helpers', () => {
  it('creates a stable key for one scheduled dose', () => {
    expect(doseLogKey('med-1', '2026-10-20', '08:00')).toBe('2026-10-20:med-1:08:00')
  })

  it('returns calendar cells starting on the correct weekday', () => {
    const days = getMonthDays(2026, 9)
    expect(days.slice(0, 4)).toEqual([null, null, null, null])
    expect(days[4]?.getDate()).toBe(1)
    expect(days.filter(Boolean)).toHaveLength(31)
  })
})
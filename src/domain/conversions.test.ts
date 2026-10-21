import { describe, expect, it } from 'vitest'
import { convertUnits, milligramsToMilliliters } from './conversions'

describe('convertUnits', () => {
  it('converts compatible mass units', () => {
    expect(convertUnits(1.5, 'g', 'mg')).toBe(1500)
  })

  it('rejects incompatible dimensions', () => {
    expect(() => convertUnits(1, 'mg', 'mL')).toThrow('não são compatíveis')
  })

  it('rejects negative and non-finite values', () => {
    expect(() => convertUnits(-1, 'mg', 'g')).toThrow(RangeError)
    expect(() => convertUnits(Number.NaN, 'mL', 'L')).toThrow(RangeError)
  })
})

describe('milligramsToMilliliters', () => {
  it('performs dimensional arithmetic from a supplied concentration', () => {
    expect(milligramsToMilliliters(250, 50)).toBe(5)
  })

  it('rejects missing or non-positive values', () => {
    expect(() => milligramsToMilliliters(0, 50)).toThrow(RangeError)
    expect(() => milligramsToMilliliters(5, 0)).toThrow(RangeError)
    expect(() => milligramsToMilliliters(Infinity, 50)).toThrow(RangeError)
  })
})
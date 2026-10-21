export type Unit = 'mcg' | 'mg' | 'g' | 'kg' | 'uL' | 'mL' | 'L'

const UNIT_FACTORS: Record<Unit, { dimension: 'mass' | 'volume'; factor: number }> = {
  mcg: { dimension: 'mass', factor: 0.000001 },
  mg: { dimension: 'mass', factor: 0.001 },
  g: { dimension: 'mass', factor: 1 },
  kg: { dimension: 'mass', factor: 1000 },
  uL: { dimension: 'volume', factor: 0.001 },
  mL: { dimension: 'volume', factor: 1 },
  L: { dimension: 'volume', factor: 1000 },
}

export function convertUnits(value: number, from: Unit, to: Unit): number {
  if (!Number.isFinite(value) || value < 0) {
    throw new RangeError('Informe um valor válido, não negativo e finito.')
  }

  const source = UNIT_FACTORS[from]
  const target = UNIT_FACTORS[to]
  if (!source || !target || source.dimension !== target.dimension) {
    throw new TypeError('As unidades selecionadas não são compatíveis.')
  }

  return (value * source.factor) / target.factor
}

export function milligramsToMilliliters(amountMg: number, concentrationMgPerMl: number): number {
  if (!Number.isFinite(amountMg) || amountMg <= 0) {
    throw new RangeError('A quantidade deve ser um número maior que zero.')
  }
  if (!Number.isFinite(concentrationMgPerMl) || concentrationMgPerMl <= 0) {
    throw new RangeError('A concentração deve ser um número maior que zero.')
  }

  return amountMg / concentrationMgPerMl
}

export function formatNumber(value: number, maximumFractionDigits = 6): string {
  return new Intl.NumberFormat('pt-BR', { maximumFractionDigits }).format(value)
}
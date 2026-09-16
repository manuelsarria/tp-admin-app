/**
 * Seguro de carga — cálculo de la prima.
 *
 * Módulo puro: lo usan por igual el cotizador (vista previa en vivo) y el API
 * (lo que se guarda), para que el número que se ve sea el que queda registrado.
 */

export type ClientType = 'regular' | 'agente' | 'custom'

export interface RateInfo {
  label: string
  rate: number    // porcentaje, ej. 0.55 = 0.55%
  minimum: number // prima mínima en USD
}

/** Tarifario por tipo de cliente. `custom` lo define quien cotiza. */
export const CLIENT_PRESETS: Record<'regular' | 'agente', RateInfo> = {
  regular: { label: 'Cliente Regular', rate: 0.55, minimum: 75 },
  agente: { label: 'Agente de Carga', rate: 0.25, minimum: 40 },
}

export interface SeguroInput {
  valorComercial: number
  valorFlete: number
  valorTributos: number
  gastosAdicionalesPct: number
  lucroSesantePct: number
  rate: number
  minimum: number
}

export interface SeguroResult {
  base: number
  gastosAdicionales: number
  lucroSesante: number
  totalAsegurado: number
  prima: number
  valorCobrar: number
}

const round2 = (n: number) => Math.round((n + Number.EPSILON) * 100) / 100

/**
 * Prima del seguro.
 *
 * La base es el valor CIF declarado (comercial + flete + tributos). Sobre esa
 * base se aplican los porcentajes de gastos adicionales y lucro cesante para
 * llegar al total asegurado, y la prima es ese total por la tasa. Si la prima
 * queda por debajo del mínimo del tarifario, se cobra el mínimo.
 */
export function calcSeguro(input: SeguroInput): SeguroResult {
  const base = round2(input.valorComercial + input.valorFlete + input.valorTributos)
  const gastosAdicionales = round2((base * input.gastosAdicionalesPct) / 100)
  const lucroSesante = round2((base * input.lucroSesantePct) / 100)
  const totalAsegurado = round2(base + gastosAdicionales + lucroSesante)
  const prima = round2((totalAsegurado * input.rate) / 100)
  return {
    base,
    gastosAdicionales,
    lucroSesante,
    totalAsegurado,
    prima,
    valorCobrar: round2(Math.max(prima, input.minimum)),
  }
}

/** Tasa y mínimo según el tipo de cliente elegido. */
export function resolveRate(
  clienteType: ClientType,
  custom?: { label?: string; rate?: number; minimum?: number },
): RateInfo {
  if (clienteType === 'custom') {
    return {
      label: custom?.label?.trim() || 'Tasa Personalizada',
      rate: custom?.rate ?? 0,
      minimum: custom?.minimum ?? 0,
    }
  }
  return CLIENT_PRESETS[clienteType]
}

export const fmtUsd = (n: number) =>
  n.toLocaleString('en-US', { style: 'currency', currency: 'USD' })

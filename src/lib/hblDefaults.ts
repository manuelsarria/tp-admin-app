/**
 * Valores por defecto del HBL que dependen del origen.
 * Módulo PURO (sin imports de servidor) — lo usan el formulario y el PDF.
 */

// Agente de carga / "Party to contact for cargo release" — celda 7 del HBL.
//
// El de China es el que TP ya venía imprimiendo en todos sus HBL; se deja
// igual para no cambiar documentos ya emitidos.
const FORWARDING_AGENT_CHINA =
  'TP LOGISTICS\nCalle 5ta y Av 3ra, Edif 9570, Loc D2\nPanamá, República de Panamá'

const FORWARDING_AGENT_PANAMA =
  'IB FORWARDING PANAMA S.A.\nRUC/TAX 155736605-2-2023 DV53\nCUSTOMERPA@INTERBORDERS.COM\nTel: +507 446 1005'

export function defaultForwardingAgent(origin?: string | null): string {
  return origin === 'PANAMA' ? FORWARDING_AGENT_PANAMA : FORWARDING_AGENT_CHINA
}

// Notify Party de los HBL de Panamá.
//
// Se precarga para que no se escriba a mano en cada HBL (así es como salen con
// variantes de nombre, dirección y teléfono). Sigue siendo editable por HBL.
export interface NotifyPartyDefaults {
  notifyParty: string
  notifyAddress: string
  notifyRuc: string
  notifyDv: string
  notifyEmail: string
  notifyPhone: string
}

/// PENDIENTE: faltan los datos del notify party de TP para los HBL de Panamá.
/// Mientras esté en null el campo sale vacío y se escribe a mano, que es como
/// funciona hoy. Al llenarlo, la precarga se activa sola.
const NOTIFY_PANAMA: NotifyPartyDefaults | null = null

export function defaultNotifyParty(origin?: string | null): NotifyPartyDefaults | null {
  if (origin !== 'PANAMA' || !NOTIFY_PANAMA) return null
  return { ...NOTIFY_PANAMA }
}

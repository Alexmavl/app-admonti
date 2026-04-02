const BANGUAT_URL = 'https://www.banguat.gob.gt/variables/ws/tipocambio.asmx';
const isDev = import.meta.env.DEV;
// En desarrollo usamos el proxy de Vite, en producción usamos un proxy CORS
const SOAP_URL = isDev
  ? '/api/banguat/tipocambio.asmx'
  : `https://corsproxy.io/?url=${encodeURIComponent(BANGUAT_URL)}`;
const NAMESPACE = 'http://www.banguat.gob.gt/variables/ws/';

function buildSoapEnvelope(method: string, params: Record<string, string | number> = {}): string {
  const paramsXml = Object.entries(params)
    .map(([key, value]) => `<${key}>${value}</${key}>`)
    .join('');

  return `<?xml version="1.0" encoding="utf-8"?>
<soap12:Envelope xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
  xmlns:xsd="http://www.w3.org/2001/XMLSchema"
  xmlns:soap12="http://www.w3.org/2003/05/soap-envelope">
  <soap12:Body>
    <${method} xmlns="${NAMESPACE}">
      ${paramsXml}
    </${method}>
  </soap12:Body>
</soap12:Envelope>`;
}

async function callSoap(method: string, params: Record<string, string | number> = {}): Promise<Document> {
  const envelope = buildSoapEnvelope(method, params);
  const response = await fetch(SOAP_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/soap+xml; charset=utf-8',
    },
    body: envelope,
  });

  if (!response.ok) {
    throw new Error(`Error SOAP: ${response.status} ${response.statusText}`);
  }

  const text = await response.text();
  const parser = new DOMParser();
  return parser.parseFromString(text, 'text/xml');
}

// ─── Types ───────────────────────────────────────────────────────
export interface TipoCambioItem {
  moneda: number;
  fecha: string;
  venta: number;
  compra: number;
}

export interface TipoCambioDolar {
  fecha: string;
  referencia: number;
}

export interface VariableDisponible {
  moneda: number;
  descripcion: string;
}

// ─── Parsers ─────────────────────────────────────────────────────
function parseVarNodes(doc: Document): TipoCambioItem[] {
  const items: TipoCambioItem[] = [];
  const vars = doc.getElementsByTagNameNS(NAMESPACE, 'Var');
  for (let i = 0; i < vars.length; i++) {
    const node = vars[i];
    const moneda = node.getElementsByTagNameNS(NAMESPACE, 'moneda')[0]?.textContent;
    const fecha = node.getElementsByTagNameNS(NAMESPACE, 'fecha')[0]?.textContent;
    const venta = node.getElementsByTagNameNS(NAMESPACE, 'venta')[0]?.textContent;
    const compra = node.getElementsByTagNameNS(NAMESPACE, 'compra')[0]?.textContent;

    items.push({
      moneda: Number(moneda),
      fecha: fecha || '',
      venta: parseFloat(venta || '0'),
      compra: parseFloat(compra || '0'),
    });
  }
  return items;
}

function parseVarDolarNodes(doc: Document): TipoCambioDolar[] {
  const items: TipoCambioDolar[] = [];
  const varDolars = doc.getElementsByTagNameNS(NAMESPACE, 'VarDolar');
  for (let i = 0; i < varDolars.length; i++) {
    const node = varDolars[i];
    const fecha = node.getElementsByTagNameNS(NAMESPACE, 'fecha')[0]?.textContent;
    const referencia = node.getElementsByTagNameNS(NAMESPACE, 'referencia')[0]?.textContent;
    items.push({
      fecha: fecha || '',
      referencia: parseFloat(referencia || '0'),
    });
  }
  return items;
}

function parseVariableNodes(doc: Document): VariableDisponible[] {
  const items: VariableDisponible[] = [];
  const variables = doc.getElementsByTagNameNS(NAMESPACE, 'Variable');
  for (let i = 0; i < variables.length; i++) {
    const node = variables[i];
    const moneda = node.getElementsByTagNameNS(NAMESPACE, 'moneda')[0]?.textContent;
    const descripcion = node.getElementsByTagNameNS(NAMESPACE, 'descripcion')[0]?.textContent;
    items.push({
      moneda: Number(moneda),
      descripcion: descripcion || '',
    });
  }
  return items;
}

// ─── API Methods ─────────────────────────────────────────────────

/** Tipo de cambio del día en dólares */
export async function getTipoCambioDia(): Promise<{ cambioDia: TipoCambioItem[]; cambioDolar: TipoCambioDolar[] }> {
  const doc = await callSoap('TipoCambioDia');
  return {
    cambioDia: parseVarNodes(doc),
    cambioDolar: parseVarDolarNodes(doc),
  };
}

/** Tipo de cambio por rango de fechas (dólares) */
export async function getTipoCambioRango(fechaInicio: string, fechaFin: string): Promise<TipoCambioItem[]> {
  const doc = await callSoap('TipoCambioRango', {
    fechainit: fechaInicio,
    fechafin: fechaFin,
  });
  return parseVarNodes(doc);
}

/** Tipo de cambio desde una fecha hasta hoy */
export async function getTipoCambioFechaInicial(fechaInicio: string): Promise<TipoCambioItem[]> {
  const doc = await callSoap('TipoCambioFechaInicial', {
    fechainit: fechaInicio,
  });
  return parseVarNodes(doc);
}

/** Variables (monedas) disponibles */
export async function getVariablesDisponibles(): Promise<VariableDisponible[]> {
  const doc = await callSoap('VariablesDisponibles');
  return parseVariableNodes(doc);
}

/** Tipo de cambio por rango y moneda específica */
export async function getTipoCambioRangoMoneda(
  fechaInicio: string,
  fechaFin: string,
  moneda: number
): Promise<TipoCambioItem[]> {
  const doc = await callSoap('TipoCambioRangoMoneda', {
    fechainit: fechaInicio,
    fechafin: fechaFin,
    moneda,
  });
  return parseVarNodes(doc);
}

/** Tipo de cambio de una variable (moneda) */
export async function getVariables(moneda: number): Promise<{ cambioDia: TipoCambioItem[]; cambioDolar: TipoCambioDolar[] }> {
  const doc = await callSoap('Variables', { variable: moneda });
  return {
    cambioDia: parseVarNodes(doc),
    cambioDolar: parseVarDolarNodes(doc),
  };
}

import { useState, useEffect, useCallback } from 'react';
import {
  getTipoCambioDia,
  getTipoCambioRango,
  getVariablesDisponibles,
  getTipoCambioRangoMoneda,
  type TipoCambioItem,
  type TipoCambioDolar,
  type VariableDisponible,
} from './services/soapService';
import './index.css';

type TabId = 'dia' | 'rango' | 'moneda' | 'variables' | 'info';

function formatDate(dateStr: string): string {
  if (!dateStr) return '—';
  // The API returns dates like "dd/MM/yyyy" or with time
  const parts = dateStr.split(' ')[0]; // Remove time part if exists
  return parts;
}

function formatRate(rate: number): string {
  return rate.toFixed(5);
}

function todayStr(): string {
  const d = new Date();
  const dd = String(d.getDate()).padStart(2, '0');
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const yyyy = d.getFullYear();
  return `${dd}/${mm}/${yyyy}`;
}

function fromInputDate(isoDate: string): string {
  if (!isoDate) return '';
  const [yyyy, mm, dd] = isoDate.split('-');
  return `${dd}/${mm}/${yyyy}`;
}

function getDefaultStartDate(): string {
  const d = new Date();
  d.setDate(d.getDate() - 30);
  const dd = String(d.getDate()).padStart(2, '0');
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const yyyy = d.getFullYear();
  return `${yyyy}-${mm}-${dd}`;
}

function getDefaultEndDate(): string {
  const d = new Date();
  const dd = String(d.getDate()).padStart(2, '0');
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const yyyy = d.getFullYear();
  return `${yyyy}-${mm}-${dd}`;
}

// ─── Loading Component ──────────────────────────────────────
function Loading({ text = 'Consultando API SOAP del Banguat...' }: { text?: string }) {
  return (
    <div className="loading-container">
      <div className="spinner"></div>
      <div className="loading-text">{text}</div>
    </div>
  );
}

// ─── Error Component ────────────────────────────────────────
function ErrorMessage({ message }: { message: string }) {
  return (
    <div className="error-box">
      <span>⚠️</span>
      <span>{message}</span>
    </div>
  );
}

// ─── Tab: Tipo de Cambio del Día ────────────────────────────
function TipoCambioDiaTab() {
  const [cambioDia, setCambioDia] = useState<TipoCambioItem[]>([]);
  const [cambioDolar, setCambioDolar] = useState<TipoCambioDolar[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    setLoading(true);
    setError(null);
    try {
      const result = await getTipoCambioDia();
      setCambioDia(result.cambioDia);
      setCambioDolar(result.cambioDolar);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al consultar el servicio');
    } finally {
      setLoading(false);
    }
  }

  if (loading) return <Loading />;
  if (error) return <ErrorMessage message={error} />;

  const referencia = cambioDolar.length > 0 ? cambioDolar[0] : null;
  const compra = cambioDia.length > 0 ? cambioDia[0] : null;

  return (
    <div>
      <div className="rate-display-grid">
        {referencia && (
          <div className="rate-card">
            <div className="rate-label">Tipo de Cambio de Referencia</div>
            <div className="rate-value">Q {formatRate(referencia.referencia)}</div>
            <div className="rate-currency">Quetzales por 1 USD</div>
            <div className="rate-date">
              <span>📅</span>
              <span>{formatDate(referencia.fecha)}</span>
            </div>
          </div>
        )}
        {compra && (
          <>
            <div className="rate-card accent">
              <div className="rate-label">Compra</div>
              <div className="rate-value accent">Q {formatRate(compra.compra)}</div>
              <div className="rate-currency">Instituciones compran USD</div>
              <div className="rate-date">
                <span>📅</span>
                <span>{formatDate(compra.fecha)}</span>
              </div>
            </div>
            <div className="rate-card gold">
              <div className="rate-label">Venta</div>
              <div className="rate-value gold">Q {formatRate(compra.venta)}</div>
              <div className="rate-currency">Instituciones venden USD</div>
              <div className="rate-date">
                <span>📅</span>
                <span>{formatDate(compra.fecha)}</span>
              </div>
            </div>
          </>
        )}
      </div>

      {cambioDia.length > 0 && (
        <div className="table-wrapper">
          <table className="data-table">
            <thead>
              <tr>
                <th>Moneda</th>
                <th>Fecha</th>
                <th>Compra (Q)</th>
                <th>Venta (Q)</th>
              </tr>
            </thead>
            <tbody>
              {cambioDia.map((item, i) => (
                <tr key={i}>
                  <td>{item.moneda}</td>
                  <td>{formatDate(item.fecha)}</td>
                  <td className="table-number">{formatRate(item.compra)}</td>
                  <td className="table-number">{formatRate(item.venta)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <div style={{ marginTop: 16, textAlign: 'right' }}>
        <button className="btn btn-secondary" onClick={loadData}>
          🔄 Actualizar
        </button>
      </div>
    </div>
  );
}

// ─── Tab: Tipo de Cambio por Rango ──────────────────────────
function TipoCambioRangoTab() {
  const [fechaInicio, setFechaInicio] = useState(getDefaultStartDate());
  const [fechaFin, setFechaFin] = useState(getDefaultEndDate());
  const [data, setData] = useState<TipoCambioItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [queried, setQueried] = useState(false);

  const handleSearch = useCallback(async () => {
    if (!fechaInicio || !fechaFin) return;
    setLoading(true);
    setError(null);
    setQueried(true);
    try {
      const result = await getTipoCambioRango(
        fromInputDate(fechaInicio),
        fromInputDate(fechaFin)
      );
      setData(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al consultar');
    } finally {
      setLoading(false);
    }
  }, [fechaInicio, fechaFin]);

  return (
    <div>
      <div className="form-row">
        <div className="form-group">
          <label className="form-label">Fecha Inicio</label>
          <input
            type="date"
            className="form-input"
            value={fechaInicio}
            onChange={(e) => setFechaInicio(e.target.value)}
          />
        </div>
        <div className="form-group">
          <label className="form-label">Fecha Fin</label>
          <input
            type="date"
            className="form-input"
            value={fechaFin}
            onChange={(e) => setFechaFin(e.target.value)}
          />
        </div>
        <div>
          <button className="btn btn-primary" onClick={handleSearch} disabled={loading}>
            {loading ? '⏳ Consultando...' : '🔍 Consultar'}
          </button>
        </div>
      </div>

      {loading && <Loading />}
      {error && <ErrorMessage message={error} />}

      {!loading && !error && queried && data.length === 0 && (
        <div className="empty-state">
          <div className="empty-state-icon">📭</div>
          <div className="empty-state-text">No se encontraron datos para el rango seleccionado</div>
        </div>
      )}

      {data.length > 0 && (
        <>
          <div style={{ marginBottom: 12, fontSize: 14, color: 'var(--text-muted)' }}>
            Se encontraron <strong style={{ color: 'var(--primary)' }}>{data.length}</strong> registros
          </div>
          <div className="table-wrapper" style={{ maxHeight: '500px', overflowY: 'auto' }}>
            <table className="data-table">
              <thead>
                <tr>
                  <th>#</th>
                  <th>Fecha</th>
                  <th>Compra (Q)</th>
                  <th>Venta (Q)</th>
                </tr>
              </thead>
              <tbody>
                {data.map((item, i) => (
                  <tr key={i}>
                    <td style={{ color: 'var(--text-muted)', fontWeight: 500 }}>{i + 1}</td>
                    <td>{formatDate(item.fecha)}</td>
                    <td className="table-number">{formatRate(item.compra)}</td>
                    <td className="table-number">{formatRate(item.venta)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
}

// ─── Tab: Por Moneda ────────────────────────────────────────
function PorMonedaTab() {
  const [variables, setVariables] = useState<VariableDisponible[]>([]);
  const [selectedMoneda, setSelectedMoneda] = useState<number>(1);
  const [fechaInicio, setFechaInicio] = useState(getDefaultStartDate());
  const [fechaFin, setFechaFin] = useState(getDefaultEndDate());
  const [data, setData] = useState<TipoCambioItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingVars, setLoadingVars] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [queried, setQueried] = useState(false);

  useEffect(() => {
    loadVariables();
  }, []);

  async function loadVariables() {
    setLoadingVars(true);
    try {
      const vars = await getVariablesDisponibles();
      setVariables(vars);
      if (vars.length > 0) setSelectedMoneda(vars[0].moneda);
    } catch {
      // Fallback if variables can't load
    } finally {
      setLoadingVars(false);
    }
  }

  const handleSearch = useCallback(async () => {
    if (!fechaInicio || !fechaFin) return;
    setLoading(true);
    setError(null);
    setQueried(true);
    try {
      const result = await getTipoCambioRangoMoneda(
        fromInputDate(fechaInicio),
        fromInputDate(fechaFin),
        selectedMoneda
      );
      setData(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al consultar');
    } finally {
      setLoading(false);
    }
  }, [fechaInicio, fechaFin, selectedMoneda]);

  return (
    <div>
      <div className="form-row">
        <div className="form-group">
          <label className="form-label">Moneda</label>
          {loadingVars ? (
            <div style={{ padding: '12px', color: 'var(--text-muted)', fontSize: 14 }}>Cargando monedas...</div>
          ) : (
            <select
              className="form-select"
              value={selectedMoneda}
              onChange={(e) => setSelectedMoneda(Number(e.target.value))}
            >
              {variables.map((v) => (
                <option key={v.moneda} value={v.moneda}>
                  {v.descripcion} (Código: {v.moneda})
                </option>
              ))}
            </select>
          )}
        </div>
      </div>
      <div className="form-row">
        <div className="form-group">
          <label className="form-label">Fecha Inicio</label>
          <input
            type="date"
            className="form-input"
            value={fechaInicio}
            onChange={(e) => setFechaInicio(e.target.value)}
          />
        </div>
        <div className="form-group">
          <label className="form-label">Fecha Fin</label>
          <input
            type="date"
            className="form-input"
            value={fechaFin}
            onChange={(e) => setFechaFin(e.target.value)}
          />
        </div>
        <div>
          <button className="btn btn-primary" onClick={handleSearch} disabled={loading || loadingVars}>
            {loading ? '⏳ Consultando...' : '🔍 Consultar'}
          </button>
        </div>
      </div>

      {loading && <Loading />}
      {error && <ErrorMessage message={error} />}

      {!loading && !error && queried && data.length === 0 && (
        <div className="empty-state">
          <div className="empty-state-icon">📭</div>
          <div className="empty-state-text">No se encontraron datos para esta consulta</div>
        </div>
      )}

      {data.length > 0 && (
        <>
          <div style={{ marginBottom: 12, fontSize: 14, color: 'var(--text-muted)' }}>
            Se encontraron <strong style={{ color: 'var(--primary)' }}>{data.length}</strong> registros
          </div>
          <div className="table-wrapper" style={{ maxHeight: '500px', overflowY: 'auto' }}>
            <table className="data-table">
              <thead>
                <tr>
                  <th>#</th>
                  <th>Fecha</th>
                  <th>Compra (Q)</th>
                  <th>Venta (Q)</th>
                  <th>Moneda</th>
                </tr>
              </thead>
              <tbody>
                {data.map((item, i) => (
                  <tr key={i}>
                    <td style={{ color: 'var(--text-muted)', fontWeight: 500 }}>{i + 1}</td>
                    <td>{formatDate(item.fecha)}</td>
                    <td className="table-number">{formatRate(item.compra)}</td>
                    <td className="table-number">{formatRate(item.venta)}</td>
                    <td>{item.moneda}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
}

// ─── Tab: Variables Disponibles ──────────────────────────────
function VariablesTab() {
  const [variables, setVariables] = useState<VariableDisponible[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    setLoading(true);
    setError(null);
    try {
      const result = await getVariablesDisponibles();
      setVariables(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al consultar');
    } finally {
      setLoading(false);
    }
  }

  if (loading) return <Loading text="Consultando variables disponibles..." />;
  if (error) return <ErrorMessage message={error} />;

  return (
    <div>
      <div style={{ marginBottom: 16, fontSize: 14, color: 'var(--text-muted)' }}>
        <strong style={{ color: 'var(--primary)' }}>{variables.length}</strong> monedas disponibles para consulta
      </div>
      <div className="variables-grid">
        {variables.map((v) => (
          <div className="variable-item" key={v.moneda}>
            <div className="variable-code">{v.moneda}</div>
            <div className="variable-name">{v.descripcion}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Tab: Información ───────────────────────────────────────
function InfoTab() {
  return (
    <div className="info-section">
      <div className="info-grid">
        <div className="info-card">
          <div className="info-card-icon soap">🔗</div>
          <h3>Protocolo SOAP</h3>
          <p>
            Esta aplicación consume un servicio web SOAP (Simple Object Access Protocol)
            del Banco de Guatemala. SOAP utiliza XML para el intercambio de mensajes
            estructurados, garantizando interoperabilidad entre sistemas heterogéneos.
          </p>
        </div>
        <div className="info-card">
          <div className="info-card-icon api">🏦</div>
          <h3>API del Banguat</h3>
          <p>
            El servicio web <code>tipocambio.asmx</code> del Banco de Guatemala expone
            operaciones para consultar tipos de cambio en distintas monedas. El WSDL
            describe 8 operaciones disponibles mediante SOAP 1.1 y 1.2.
          </p>
        </div>
        <div className="info-card">
          <div className="info-card-icon data">📊</div>
          <h3>Datos en Tiempo Real</h3>
          <p>
            Los datos de tipo de cambio son actualizados diariamente por el Banco de Guatemala.
            Se pueden consultar valores de referencia, compra y venta para el dólar
            estadounidense y otras monedas.
          </p>
        </div>
        <div className="info-card">
          <div className="info-card-icon soap">⚖️</div>
          <h3>SOAP vs REST</h3>
          <p>
            <strong>SOAP</strong> ofrece tipado fuerte mediante WSDL/XSD, seguridad
            WS-Security, y confiabilidad con WS-ReliableMessaging. Ideal para sistemas
            bancarios y gubernamentales. <strong>REST</strong> es más ligero, usa JSON,
            y es preferido en aplicaciones web modernas por su simplicidad.
          </p>
        </div>
        <div className="info-card">
          <div className="info-card-icon api">🔧</div>
          <h3>Operaciones Disponibles</h3>
          <p>
            <strong>TipoCambioDia:</strong> Cambio actual del día.<br />
            <strong>TipoCambioRango:</strong> Histórico entre dos fechas.<br />
            <strong>TipoCambioRangoMoneda:</strong> Histórico por moneda.<br />
            <strong>VariablesDisponibles:</strong> Lista de monedas consultables.
          </p>
        </div>
        <div className="info-card">
          <div className="info-card-icon data">🎓</div>
          <h3>Tarea de Clase</h3>
          <p>
            Desarrollado como caso de uso práctico de SOAP para la clase de
            <strong> Administración de Tecnologías de Información</strong>, 9no Semestre,
            Universidad Mariano Gálvez de Guatemala (UMG).<br />
            <strong>Sede:</strong> Chiquimulilla, Santa Rosa.<br />
            <strong>Facultad:</strong> Ingeniería en Sistemas — 2026.
          </p>
        </div>
      </div>

      {/* Integrantes */}
      <div className="team-section">
        <h3 className="team-title">👥 Integrantes del Equipo</h3>
        <div className="team-grid">
          <div className="team-member">
            <div className="team-avatar">MV</div>
            <div className="team-info">
              <div className="team-name">Marvin Alexander Vásquez López</div>
              <div className="team-carnet">1790-22-12802</div>
            </div>
          </div>
          <div className="team-member">
            <div className="team-avatar">TH</div>
            <div className="team-info">
              <div className="team-name">Teddy Leonardo Hernández Pérez</div>
              <div className="team-carnet">1790-22-2563</div>
            </div>
          </div>
          <div className="team-member">
            <div className="team-avatar">WH</div>
            <div className="team-info">
              <div className="team-name">Wilson Eduardo Hernández López</div>
              <div className="team-carnet">1790-22-7315</div>
            </div>
          </div>
          <div className="team-member">
            <div className="team-avatar">GG</div>
            <div className="team-info">
              <div className="team-name">Guillermo José Gómez Aguilera</div>
              <div className="team-carnet">1790-22-16429</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Main App ───────────────────────────────────────────────
const TABS: { id: TabId; label: string; icon: string }[] = [
  { id: 'dia', label: 'Cambio del Día', icon: '💱' },
  { id: 'rango', label: 'Por Rango de Fechas', icon: '📅' },
  { id: 'moneda', label: 'Por Moneda', icon: '🌍' },
  { id: 'variables', label: 'Monedas Disponibles', icon: '📋' },
  { id: 'info', label: 'Información', icon: 'ℹ️' },
];

function getTabTitle(tab: TabId): string {
  switch (tab) {
    case 'dia': return 'Tipo de Cambio del Día';
    case 'rango': return 'Consulta por Rango de Fechas';
    case 'moneda': return 'Consulta por Moneda';
    case 'variables': return 'Variables (Monedas) Disponibles';
    case 'info': return 'Información de la Tarea';
  }
}

function getTabSubtitle(tab: TabId): string {
  switch (tab) {
    case 'dia': return 'Tipo de cambio de referencia en dólares — Banco de Guatemala';
    case 'rango': return 'Consulta tipo de cambio del dólar USD entre dos fechas';
    case 'moneda': return 'Consulta tipo de cambio histórico por moneda y fechas';
    case 'variables': return 'Monedas y variables disponibles en el servicio SOAP';
    case 'info': return 'Detalles técnicos del servicio SOAP y la tarea';
  }
}

function getTabIcon(tab: TabId): string {
  switch (tab) {
    case 'dia': return '💱';
    case 'rango': return '📅';
    case 'moneda': return '🌍';
    case 'variables': return '📋';
    case 'info': return 'ℹ️';
  }
}

function App() {
  const [activeTab, setActiveTab] = useState<TabId>('dia');

  return (
    <>
      {/* Navbar */}
      <nav className="navbar" id="main-navbar">
        <a className="navbar-brand" href="#" onClick={(e) => { e.preventDefault(); setActiveTab('dia'); }}>
          <img src="/imagen/Umg_logotipo.png" alt="Logo UMG" className="navbar-logo" />
          <div>
          
            <div className="navbar-subtitle">Administración de Técnologia de Información</div>
          </div>
        </a>
        <div className="navbar-badge">SOAP Web Service</div>
      </nav>

      {/* Hero */}
      <section className="hero-section" id="hero">
        <div className="hero-content">
          <div className="hero-tag">
            🏦 Banco de Guatemala — Servicio Web SOAP
          </div>
          <h1 className="hero-title">
            Tipo de Cambio en <span className="highlight">Tiempo Real</span>
          </h1>
          <p className="hero-description">
            Aplicación que consume el servicio web SOAP del Banco de Guatemala para consultar
            tipos de cambio de moneda extranjera.<br />
            <a href="https://www.banguat.gob.gt/variables/ws/tipocambio.asmx" target="_blank" rel="noopener noreferrer" style={{ color: 'var(--accent-light)', fontWeight: 600, wordBreak: 'break-all' }}>
              https://www.banguat.gob.gt/variables/ws/tipocambio.asmx
            </a>
          </p>
        </div>
      </section>

      {/* Tabs */}
      <div className="tabs-container" id="tabs">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            id={`tab-${tab.id}`}
            className={`tab-button ${activeTab === tab.id ? 'active' : ''}`}
            onClick={() => setActiveTab(tab.id)}
          >
            <span className="tab-icon">{tab.icon}</span>
            <span className="tab-label">{tab.label}</span>
          </button>
        ))}
      </div>

      {/* Main Content */}
      <main className="main-content" id="main-content">
        <div className="card" key={activeTab}>
          <div className="card-header">
            <div className="card-header-left">
              <div className="card-icon">{getTabIcon(activeTab)}</div>
              <div>
                <div className="card-title">{getTabTitle(activeTab)}</div>
                <div className="card-subtitle">{getTabSubtitle(activeTab)}</div>
              </div>
            </div>
            <div className="soap-badge">
              <span>●</span> SOAP 1.2
            </div>
          </div>
          <div className="card-body">
            {activeTab === 'dia' && <TipoCambioDiaTab />}
            {activeTab === 'rango' && <TipoCambioRangoTab />}
            {activeTab === 'moneda' && <PorMonedaTab />}
            {activeTab === 'variables' && <VariablesTab />}
            {activeTab === 'info' && <InfoTab />}
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="footer" id="footer">
        <div className="footer-grid">
          <div className="footer-col footer-col-brand">
            <img src="/imagen/Umg_logotipo.png" alt="Logo UMG" className="footer-logo" />
            <p className="footer-text">
              <strong>Universidad Mariano Gálvez de Guatemala</strong><br />
              Sede Chiquimulilla, Santa Rosa<br />
              Facultad de Ingeniería en Sistemas
            </p>
          </div>
          <div className="footer-col">
            <p className="footer-col-title">Tarea</p>
            <p className="footer-text">
              Administración de TI — 9no Semestre<br />
              Consumo de servicio web <strong>SOAP</strong><br />
              Banguat — {todayStr()}
            </p>
          </div>
          <div className="footer-col">
            <p className="footer-col-title">Integrantes</p>
            <p className="footer-text footer-text-sm">
              Marvin Alexander Vásquez López — 1790-22-12802<br />
              Teddy Leonardo Hernández Pérez — 1790-22-2563<br />
              Wilson Eduardo Hernández López — 1790-22-7315<br />
              Guillermo José Gómez Aguilera — 1790-22-16429
            </p>
          </div>
        </div>
      </footer>
    </>
  );
}

export default App;

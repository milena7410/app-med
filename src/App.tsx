import { useEffect, useState, type FormEvent } from 'react'
import {
  Activity,
  ArrowDownUp,
  ArrowRight,
  BookOpen,
  CalendarDays,
  Check,
  ChevronDown,
  CircleAlert,
  Clock3,
  Calculator,
  FlaskConical,
  LockKeyhole,
  LogOut,
  Menu,
  ShieldCheck,
  X,
} from 'lucide-react'
import {
  convertUnits,
  formatNumber,
  milligramsToMilliliters,
  type Unit,
} from './domain/conversions'
import Organizer from './features/organizer/Organizer'

type Page = 'home' | 'calculator' | 'organizer' | 'references'
type Calculation = 'units' | 'mgml' | 'weight'

const unitOptions: { value: Unit; label: string; family: string }[] = [
  { value: 'mcg', label: 'microgramas (mcg)', family: 'mass' },
  { value: 'mg', label: 'miligramas (mg)', family: 'mass' },
  { value: 'g', label: 'gramas (g)', family: 'mass' },
  { value: 'kg', label: 'quilogramas (kg)', family: 'mass' },
  { value: 'uL', label: 'microlitros (µL)', family: 'volume' },
  { value: 'mL', label: 'mililitros (mL)', family: 'volume' },
  { value: 'L', label: 'litros (L)', family: 'volume' },
]

function parseValue(value: string): number | null {
  if (!value.trim()) return null
  const parsed = Number(value.trim().replace(',', '.'))
  return Number.isFinite(parsed) ? parsed : null
}

function App() {
  const [accessStage, setAccessStage] = useState<'splash' | 'login' | 'app'>('splash')
  const [loginError, setLoginError] = useState('')
  const [page, setPage] = useState<Page>('home')
  const [calculation, setCalculation] = useState<Calculation>('units')
  const [menuOpen, setMenuOpen] = useState(false)
  const [value, setValue] = useState('')
  const [fromUnit, setFromUnit] = useState<Unit>('mg')
  const [toUnit, setToUnit] = useState<Unit>('g')
  const [amount, setAmount] = useState('')
  const [concentration, setConcentration] = useState('')

  const numericValue = parseValue(value)
  const numericAmount = parseValue(amount)
  const numericConcentration = parseValue(concentration)
  const canConvertUnits = numericValue !== null && numericValue >= 0 &&
    unitOptions.find((unit) => unit.value === fromUnit)?.family ===
    unitOptions.find((unit) => unit.value === toUnit)?.family
  const unitResult = canConvertUnits ? convertUnits(numericValue, fromUnit, toUnit) : null
  const mgmlResult = numericAmount !== null && numericAmount > 0 &&
    numericConcentration !== null && numericConcentration > 0
    ? milligramsToMilliliters(numericAmount, numericConcentration)
    : null

  useEffect(() => {
    const timeoutId = window.setTimeout(() => setAccessStage('login'), 1100)
    return () => window.clearTimeout(timeoutId)
  }, [])

  function submitLogin(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const formData = new FormData(event.currentTarget)
    const username = String(formData.get('username') ?? '')
    const password = String(formData.get('password') ?? '')
    if (username !== 'admin' || password !== 'admin') {
      setLoginError('Usuário ou senha incorretos.')
      return
    }
    setLoginError('')
    setAccessStage('app')
  }

  function navigate(nextPage: Page) {
    setPage(nextPage)
    setMenuOpen(false)
  }

  function openCalculation(nextCalculation: Calculation) {
    setCalculation(nextCalculation)
    navigate('calculator')
  }

  function logout() {
    setPage('home')
    setAccessStage('login')
  }

  if (accessStage === 'splash') return <SplashScreen />
  if (accessStage === 'login') return <LoginScreen onSubmit={submitLogin} error={loginError} />

  return (
    <div className="app-shell">
      <aside className={`sidebar ${menuOpen ? 'sidebar-open' : ''}`}>
        <a className="brand" href="#inicio" onClick={() => navigate('home')} aria-label="DoseCerta, página inicial">
          <span className="brand-mark" aria-hidden="true"><Check size={21} strokeWidth={2.6} /></span>
          <span>Dose<span className="brand-light">Certa</span></span>
        </a>

        <div className="sidebar-label">ESPAÇO DE TRABALHO</div>
        <nav className="primary-nav" aria-label="Navegação principal">
          <button className={`nav-item ${page === 'home' ? 'active' : ''}`} onClick={() => navigate('home')}>
            <Activity size={18} /><span>Visão geral</span>
          </button>
          <button className={`nav-item ${page === 'calculator' ? 'active' : ''}`} onClick={() => navigate('calculator')}>
            <ArrowDownUp size={18} /><span>Calculadora</span>
          </button>
          <button className={`nav-item ${page === 'organizer' ? 'active' : ''}`} onClick={() => navigate('organizer')}>
            <CalendarDays size={18} /><span>Organizador</span>
          </button>
          <button className={`nav-item ${page === 'references' ? 'active' : ''}`} onClick={() => navigate('references')}>
            <BookOpen size={18} /><span>Referências</span>
          </button>
        </nav>

        <div className="sidebar-bottom">
          <div className="privacy-note">
            <ShieldCheck size={17} />
            <p>Seus dados ficam no dispositivo.<br /><strong>Nada é salvo no histórico.</strong></p>
          </div>
          <div className="sidebar-version">DOSECERTA <span>v0.1</span></div>
        </div>
      </aside>

      {menuOpen && <button className="menu-backdrop" aria-label="Fechar menu" onClick={() => setMenuOpen(false)} />}

      <main className="main-area">
        <header className="topbar">
          <a className="mobile-brand" href="#inicio" onClick={() => navigate('home')} aria-label="DoseCerta, página inicial">
            <span className="brand-mark" aria-hidden="true"><Check size={18} strokeWidth={2.6} /></span>
            <span>Dose<span className="brand-light">Certa</span></span>
          </a>
          <button className="icon-button mobile-menu" aria-label={menuOpen ? 'Fechar menu' : 'Abrir menu'} onClick={() => setMenuOpen(!menuOpen)}>
            {menuOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
          <div className="breadcrumb"><span>Workspace</span><span className="breadcrumb-slash">/</span><strong>{page === 'home' ? 'Visão geral' : page === 'calculator' ? 'Calculadora' : page === 'organizer' ? 'Organizador' : 'Referências'}</strong></div>
          <div className="topbar-status"><span className="status-dot" /> Ambiente local</div>
          <button className="logout-button" onClick={logout}><LogOut size={15} /><span>Sair</span></button>
        </header>

        {page === 'home' && <HomePage onNavigate={navigate} onSelectCalculation={openCalculation} />}
        {page === 'calculator' && (
          <CalculatorPage
            calculation={calculation}
            setCalculation={setCalculation}
            value={value}
            setValue={setValue}
            fromUnit={fromUnit}
            setFromUnit={setFromUnit}
            toUnit={toUnit}
            setToUnit={setToUnit}
            amount={amount}
            setAmount={setAmount}
            concentration={concentration}
            setConcentration={setConcentration}
            unitResult={unitResult}
            mgmlResult={mgmlResult}
          />
        )}
        {page === 'references' && <ReferencesPage />}
        {page === 'organizer' && <Organizer />}
      </main>

      <nav className="mobile-bottom-nav" aria-label="Navegação principal">
        <button className={page === 'home' ? 'active' : ''} aria-current={page === 'home' ? 'page' : undefined} onClick={() => navigate('home')}>
          <Activity size={19} /><span>Início</span>
        </button>
        <button className={page === 'calculator' ? 'active' : ''} aria-current={page === 'calculator' ? 'page' : undefined} onClick={() => navigate('calculator')}>
          <Calculator size={19} /><span>Calcular</span>
        </button>
        <button className={page === 'organizer' ? 'active' : ''} aria-current={page === 'organizer' ? 'page' : undefined} onClick={() => navigate('organizer')}>
          <CalendarDays size={19} /><span>Organizador</span>
        </button>
        <button className={page === 'references' ? 'active' : ''} aria-current={page === 'references' ? 'page' : undefined} onClick={() => navigate('references')}>
          <BookOpen size={19} /><span>Segurança</span>
        </button>
      </nav>
    </div>
  )
}

function SplashScreen() {
  return (
    <main className="access-screen splash-screen" aria-label="Carregando DoseCerta">
      <div className="splash-content" role="status" aria-live="polite">
        <span className="splash-mark"><Check size={30} strokeWidth={2.5} /></span>
        <p className="splash-wordmark">Dose<span>Certa</span></p>
        <span className="splash-loader" aria-hidden="true"><i /></span>
      </div>
      <span className="access-footer">CÁLCULOS CLAROS · USO CONSCIENTE</span>
    </main>
  )
}

function LoginScreen({ onSubmit, error }: { onSubmit: (event: FormEvent<HTMLFormElement>) => void; error: string }) {
  return (
    <main className="access-screen login-screen">
      <div className="login-brand"><span className="splash-mark"><Check size={26} strokeWidth={2.5} /></span><span>Dose<span>Certa</span></span></div>
      <section className="login-panel" aria-labelledby="login-title">
        <div className="login-heading"><p className="section-kicker">ACESSO LOCAL</p><h1 id="login-title">Boas-vindas</h1><p>Entre para organizar seu espaço.</p></div>
        <form className="login-form" onSubmit={onSubmit}>
          <label htmlFor="login-username">Usuário</label>
          <input id="login-username" name="username" autoComplete="username" required autoFocus />
          <label htmlFor="login-password">Senha</label>
          <input id="login-password" name="password" type="password" autoComplete="current-password" required />
          {error && <p className="login-error" role="alert">{error}</p>}
          <button className="login-submit" type="submit">Entrar <ArrowRight size={17} /></button>
        </form>
        {/* <div className="demo-access-warning"><CircleAlert size={17} /><p><strong>Acesso demonstrativo</strong><span>Usuário e senha iniciais: admin / admin. Como são fixos no app, este login não protege dados reais. Não cadastre informações sensíveis ou de pacientes.</span></p></div> */}
      </section>
      <span className="access-footer">DOSECERTA · AMBIENTE LOCAL</span>
    </main>
  )
}

function HomePage({ onNavigate, onSelectCalculation }: { onNavigate: (page: Page) => void; onSelectCalculation: (calculation: Calculation) => void }) {
  return (
    <div className="page-content home-page">
      <header className="home-heading">
        <div className="eyebrow"><span className="eyebrow-line" /> DOSECERTA · CÁLCULOS</div>
        <h1>O que você precisa<br className="mobile-title-break" /> calcular?</h1>
        <p>Escolha uma operação matemática para começar.</p>
      </header>

      <section className="home-tools" aria-labelledby="tools-heading">
        <div className="home-section-heading">
          <h2 id="tools-heading">Ferramentas</h2>
          <span>2 disponíveis</span>
        </div>
        <div className="home-tool-grid">
          <button className="home-tool-card mass-tool" onClick={() => onSelectCalculation('units')}>
            <span className="home-tool-icon"><ArrowDownUp size={21} /></span>
            <span className="home-tool-copy"><small>MASSA E VOLUME</small><strong>Converter unidades</strong><span>mcg, mg, g, kg, µL, mL e L</span></span>
            <ArrowRight className="home-tool-arrow" size={19} />
          </button>
          <button className="home-tool-card concentration-tool" onClick={() => onSelectCalculation('mgml')}>
            <span className="home-tool-icon"><FlaskConical size={21} /></span>
            <span className="home-tool-copy"><small>QUANTIDADE E CONCENTRAÇÃO</small><strong>Converter mg para mL</strong><span>Memória de cálculo incluída</span></span>
            <ArrowRight className="home-tool-arrow" size={19} />
          </button>
        </div>

        <button className="home-pending-tool" onClick={() => onSelectCalculation('weight')}>
          <span className="pending-icon"><LockKeyhole size={18} /></span>
          <span><strong>Dose por peso</strong><small>Indisponível até haver regra clínica aprovada</small></span>
          <span className="pending-label">Em validação</span>
          <ArrowRight size={17} className="pending-arrow" />
        </button>
      </section>

      <aside className="home-safety-note">
        <ShieldCheck size={18} />
        <p><strong>Uso matemático, não prescritivo.</strong><span>As conversões não confirmam dose ou adequação clínica.</span></p>
        <button aria-label="Ler sobre segurança" onClick={() => onNavigate('references')}><ArrowRight size={17} /></button>
      </aside>
      <button className="organizer-home-link" onClick={() => onNavigate('organizer')}>
        <CalendarDays size={19} /><span><strong>Organize sua rotina</strong><small>Horários, registros e estoque dos seus medicamentos</small></span><ArrowRight size={17} />
      </button>
    </div>
  )
}

type CalculatorPageProps = {
  calculation: Calculation
  setCalculation: (calculation: Calculation) => void
  value: string
  setValue: (value: string) => void
  fromUnit: Unit
  setFromUnit: (unit: Unit) => void
  toUnit: Unit
  setToUnit: (unit: Unit) => void
  amount: string
  setAmount: (value: string) => void
  concentration: string
  setConcentration: (value: string) => void
  unitResult: number | null
  mgmlResult: number | null
}

function CalculatorPage(props: CalculatorPageProps) {
  const [precision, setPrecision] = useState('4')
  const activeTab = props.calculation
  const isWeight = activeTab === 'weight'
  const isMgml = activeTab === 'mgml'
  const result = isMgml ? props.mgmlResult : props.unitResult
  const inputInvalid = isMgml
    ? (props.amount !== '' && (parseValue(props.amount) === null || Number(props.amount.replace(',', '.')) <= 0)) ||
      (props.concentration !== '' && (parseValue(props.concentration) === null || Number(props.concentration.replace(',', '.')) <= 0))
    : props.value !== '' && (parseValue(props.value) === null || Number(props.value.replace(',', '.')) < 0)

  return (
    <div className="page-content calculator-page">
      <div className="eyebrow"><span className="eyebrow-line" /> CALCULADORA</div>
      <div className="calculator-title-row"><div><h1>Conversões matemáticas</h1><p>Informe os valores e confira cada etapa do cálculo.</p></div><span className="local-tag"><span className="status-dot" /> Processamento local</span></div>

      <div className="calculator-tabs" role="tablist" aria-label="Tipo de cálculo">
        <button role="tab" aria-selected={activeTab === 'units'} className={activeTab === 'units' ? 'selected' : ''} onClick={() => props.setCalculation('units')}><ArrowDownUp size={16} /> Unidades</button>
        <button role="tab" aria-selected={activeTab === 'mgml'} className={activeTab === 'mgml' ? 'selected' : ''} onClick={() => props.setCalculation('mgml')}><FlaskConical size={16} /> mg para mL</button>
        <button role="tab" aria-selected={activeTab === 'weight'} className={`locked-tab ${activeTab === 'weight' ? 'selected' : ''}`} onClick={() => props.setCalculation('weight')}><LockKeyhole size={15} /> Dose por peso <span>bloqueada</span></button>
      </div>

      {isWeight ? (
        <section className="blocked-panel" aria-labelledby="blocked-title">
          <span className="blocked-icon"><LockKeyhole size={22} /></span>
          <p className="section-kicker">CÁLCULO NÃO DISPONÍVEL</p>
          <h2 id="blocked-title">Dose por peso está bloqueada</h2>
          <p>Idade, desenvolvimento, peso e condições de saúde podem mudar o que precisa ser considerado. Esta versão ainda não tem regras de dose verificadas e aprovadas para nenhum medicamento. Por isso, nenhum cálculo clínico é realizado.</p>
          <div className="blocked-checklist"><span><Check size={15} /> Sem dose clínica habilitada</span><span><Check size={15} /> Sem valores fictícios</span><span><Check size={15} /> Falha segura por padrão</span></div>
          <p className="blocked-scope-note">O escopo poderá incluir crianças e adultos, mas cada cálculo dependerá de uma regra específica para medicamento, indicação, apresentação e população.</p>
        </section>
      ) : (
        <div className="calculator-layout">
          <section className="form-panel" aria-label="Parâmetros do cálculo">
            <div className="panel-topline"><span>PARÂMETROS</span><span>01 — 02</span></div>
            {isMgml ? (
              <>
                <div className="field-group"><label htmlFor="amount">Quantidade <span className="required-mark">*</span></label><div className="input-with-unit"><input id="amount" inputMode="decimal" placeholder="Ex.: 250" value={props.amount} onChange={(event) => props.setAmount(event.target.value)} aria-describedby="amount-hint" /><span>mg</span></div><small id="amount-hint">Valor matemático a converter</small></div>
                <div className="field-group"><label htmlFor="concentration">Concentração informada <span className="required-mark">*</span></label><div className="input-with-unit"><input id="concentration" inputMode="decimal" placeholder="Ex.: 50" value={props.concentration} onChange={(event) => props.setConcentration(event.target.value)} /><span>mg/mL</span></div><small>Use a concentração da apresentação consultada</small></div>
                <div className="formula-hint"><span className="formula-label">FÓRMULA</span><span>quantidade (mg) ÷ concentração (mg/mL)</span></div>
              </>
            ) : (
              <>
                <div className="field-group"><label htmlFor="value">Valor a converter <span className="required-mark">*</span></label><input id="value" className="plain-input" inputMode="decimal" placeholder="Digite um valor" value={props.value} onChange={(event) => props.setValue(event.target.value)} /></div>
                <div className="unit-fields">
                  <div className="field-group"><label htmlFor="from-unit">De</label><div className="select-wrap"><select id="from-unit" value={props.fromUnit} onChange={(event) => props.setFromUnit(event.target.value as Unit)}>{unitOptions.map((unit) => <option key={unit.value} value={unit.value}>{unit.label}</option>)}</select><ChevronDown size={16} /></div></div>
                  <button className="swap-button" aria-label="Inverter unidades" onClick={() => { props.setFromUnit(props.toUnit); props.setToUnit(props.fromUnit) }}><ArrowDownUp size={17} /></button>
                  <div className="field-group"><label htmlFor="to-unit">Para</label><div className="select-wrap"><select id="to-unit" value={props.toUnit} onChange={(event) => props.setToUnit(event.target.value as Unit)}>{unitOptions.map((unit) => <option key={unit.value} value={unit.value}>{unit.label}</option>)}</select><ChevronDown size={16} /></div></div>
                </div>
                <div className="field-group precision-field"><label htmlFor="precision">Casas decimais</label><select id="precision" value={precision} onChange={(event) => setPrecision(event.target.value)}><option value="2">2 casas</option><option value="4">4 casas</option><option value="6">6 casas</option></select></div>
              </>
            )}
            {inputInvalid && <p className="inline-error" role="alert"><CircleAlert size={15} /> Revise os valores. Use números válidos e maiores que zero.</p>}
            <div className="panel-security"><ShieldCheck size={17} /><span>Valores usados apenas nesta sessão.<br /><strong>Não são armazenados.</strong></span></div>
          </section>

          <section className="result-panel" aria-live="polite" aria-label="Resultado do cálculo">
            <div className="panel-topline"><span>RESULTADO</span><span>{result === null ? 'AGUARDANDO DADOS' : 'CÁLCULO CONCLUÍDO'}</span></div>
            {result === null ? (
              <div className="empty-result"><span className="empty-result-icon"><ArrowDownUp size={22} /></span><h2>O resultado aparece aqui</h2><p>Preencha os campos ao lado para ver o valor convertido e a memória de cálculo.</p></div>
            ) : (
              <div className="result-value-wrap"><p className="result-caption">VALOR CONVERTIDO</p><div className="result-value">{formatNumber(result, isMgml ? 6 : Number(precision))}<span>{isMgml ? 'mL' : props.toUnit}</span></div><div className="result-status"><Check size={14} /> Operação matemática concluída</div></div>
            )}
            <div className="calculation-memory"><div className="memory-title"><Clock3 size={15} /><span>MEMÓRIA DE CÁLCULO</span></div>
              {result === null ? <p className="memory-placeholder">As operações e unidades serão detalhadas aqui.</p> : isMgml
                ? <p>{formatNumber(Number(props.amount.replace(',', '.')))} mg ÷ {formatNumber(Number(props.concentration.replace(',', '.')))} mg/mL = <strong>{formatNumber(result, 6)} mL</strong></p>
                : <p>{formatNumber(Number(props.value.replace(',', '.')))} {props.fromUnit} × fator de conversão = <strong>{formatNumber(result, Number(precision))} {props.toUnit}</strong></p>}
            </div>
          </section>
        </div>
      )}

      {!isWeight && <div className="clinical-caveat"><CircleAlert size={17} /><p><strong>Importante:</strong> este resultado é exclusivamente matemático. Não valida dose, indicação, apresentação, concentração ou adequação clínica. Confirme os dados em fonte profissional confiável.</p></div>}
    </div>
  )
}

function ReferencesPage() {
  return (
    <div className="page-content references-page">
      <div className="eyebrow"><span className="eyebrow-line" /> TRANSPARÊNCIA</div>
      <div className="calculator-title-row"><div><h1>Referências & segurança</h1><p>O que esta versão faz, o que não faz e por quê.</p></div></div>
      <section className="reference-intro"><span className="reference-shield"><ShieldCheck size={23} /></span><div><p className="section-kicker">VERSÃO 0.1 · SEM REGRAS CLÍNICAS</p><h2>Precisão também é saber quando parar.</h2><p>O DoseCerta não inclui regras de dosagem clínica. A função de dose por peso permanece bloqueada até que critérios de evidência, revisão e aprovação sejam atendidos.</p></div></section>
      <section className="reference-section scope-section"><div className="section-heading"><div><p className="section-kicker">ESCOPO PREVISTO</p><h2>Não é só uma questão de peso</h2></div></div>
        <p className="scope-explainer">A necessidade de individualizar pode existir em crianças e adultos. Idade, fase de desenvolvimento e condições de saúde podem ser relevantes, mas o que se aplica depende do medicamento e da situação clínica descrita na referência.</p>
        <div className="scope-grid">
          <article><span>POPULAÇÃO</span><strong>Crianças e adultos</strong><p>Cada regra precisa declarar exatamente a quem se aplica.</p></article>
          <article><span>MEDICAMENTO</span><strong>Um escopo por regra</strong><p>“Todos os medicamentos” não é um conjunto seguro de cálculo. Apresentação, concentração e via podem mudar.</p></article>
          <article><span>CONDIÇÕES</span><strong>Quando houver evidência</strong><p>Condições especiais só entram quando a fonte define o ajuste e seus limites.</p></article>
        </div>
      </section>
      <section className="reference-section future-section"><div className="section-heading"><div><p className="section-kicker">POSSÍVEIS FUNCIONALIDADES FUTURAS</p><h2>Cada etapa precisa de validação própria</h2></div></div>
        <div className="future-list">
          <div><span className="future-index">01</span><p><strong>Cálculo por peso</strong><small>Somente com dose referenciada, população, indicação e limites explícitos.</small></p><span className="future-status">Planejado</span></div>
          <div><span className="future-index">02</span><p><strong>Conversão para mL ou gotas</strong><small>Depende da concentração e, para gotas, de fator verificado para o produto.</small></p><span className="future-status">Planejado</span></div>
          <div><span className="future-index">03</span><p><strong>Diluição e condições especiais</strong><small>Vinculadas a apresentação, via, protocolo e fonte específicos; sem instrução genérica.</small></p><span className="future-status">Planejado</span></div>
          <div><span className="future-index">04</span><p><strong>Alertas e explicação didática</strong><small>Exibir memória de cálculo e alertas apenas quando sustentados pela regra aprovada.</small></p><span className="future-status">Planejado</span></div>
        </div>
        <p className="scope-disclaimer"><CircleAlert size={15} /> Este escopo descreve possibilidades de produto, não orientações de dose ou um protocolo universal.</p>
      </section>
      <section className="reference-section"><div className="section-heading"><div><p className="section-kicker">OPERAÇÕES DISPONÍVEIS</p><h2>Matemática, não prescrição</h2></div></div>
        <div className="reference-row"><span className="reference-number">01</span><div><strong>Conversão de unidades</strong><p>Fatores definidos para unidades de massa (mcg, mg, g, kg) e volume (µL, mL, L). Não é permitido converter entre dimensões incompatíveis.</p></div><span className="reference-tag">Definição matemática</span></div>
        <div className="reference-row"><span className="reference-number">02</span><div><strong>mg para mL</strong><p>Quantidade em mg dividida pela concentração informada em mg/mL. O cálculo não verifica se a concentração ou a apresentação são apropriadas.</p></div><span className="reference-tag">Entrada do usuário</span></div>
      </section>
      <section className="reference-section governance"><div className="section-heading"><div><p className="section-kicker">GOVERNANÇA CLÍNICA</p><h2>Regras futuras exigem</h2></div></div>
        <div className="governance-grid"><div><span>01</span><strong>Fonte verificável</strong><p>Referência, trecho e data de consulta documentados.</p></div><div><span>02</span><strong>Escopo delimitado</strong><p>Medicamento, apresentação, população e via definidos.</p></div><div><span>03</span><strong>Revisão independente</strong><p>Quem implementa não aprova a própria regra.</p></div><div><span>04</span><strong>Testes fundamentados</strong><p>Casos e resultados esperados derivados da evidência.</p></div></div>
      </section>
      <p className="regulatory-note"><CircleAlert size={16} /> O enquadramento regulatório perante a Anvisa depende da finalidade pretendida e deverá ser avaliado antes de qualquer uso assistencial.</p>
    </div>
  )
}

export default App
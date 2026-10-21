import { useEffect, useMemo, useState, type FormEvent } from 'react'
import {
  Bell,
  CalendarDays,
  Check,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  CircleAlert,
  Clock3,
  PackageCheck,
  Plus,
  Pill,
  ShieldCheck,
  Trash2,
  X,
} from 'lucide-react'
import {
  doseLogKey,
  estimateSupplyDays,
  getMonthDays,
  localDateKey,
  type DoseLog,
  type Medication,
} from './medication'

const MEDICATIONS_STORAGE_KEY = 'dosecerta.organizer.medications.v1'
const LOGS_STORAGE_KEY = 'dosecerta.organizer.logs.v1'
const unitChoices = ['comprimidos', 'cápsulas', 'mL', 'gotas', 'unidades']
const weekdays = ['D', 'S', 'T', 'Q', 'Q', 'S', 'S']

function loadStored<T>(key: string, fallback: T): T {
  try {
    const value = localStorage.getItem(key)
    return value ? JSON.parse(value) as T : fallback
  } catch {
    return fallback
  }
}

function createId(): string {
  return globalThis.crypto?.randomUUID?.() ?? `${Date.now()}-${Math.random().toString(36).slice(2)}`
}

function formatLongDate(date: Date): string {
  return new Intl.DateTimeFormat('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' }).format(date)
}

function Organizer() {
  const [medications, setMedications] = useState<Medication[]>(() => loadStored(MEDICATIONS_STORAGE_KEY, []))
  const [logs, setLogs] = useState<DoseLog[]>(() => loadStored(LOGS_STORAGE_KEY, []))
  const [formOpen, setFormOpen] = useState(false)
  const [editingStockId, setEditingStockId] = useState<string | null>(null)
  const [stockDraft, setStockDraft] = useState('')
  const [selectedDate, setSelectedDate] = useState(() => new Date())
  const [shownMonth, setShownMonth] = useState(() => new Date())
  const [storageWarning, setStorageWarning] = useState('')
  const [reminderStatus, setReminderStatus] = useState('')
  const [notificationPermission, setNotificationPermission] = useState(() =>
    'Notification' in window ? Notification.permission : 'unsupported',
  )
  const todayKey = localDateKey(new Date())
  const selectedDateKey = localDateKey(selectedDate)
  const calendarCells = useMemo(
    () => getMonthDays(shownMonth.getFullYear(), shownMonth.getMonth()),
    [shownMonth],
  )

  useEffect(() => {
    try {
      localStorage.setItem(MEDICATIONS_STORAGE_KEY, JSON.stringify(medications))
      setStorageWarning('')
    } catch {
      setStorageWarning('Não foi possível salvar neste navegador. Seus dados permanecem apenas nesta sessão.')
    }
  }, [medications])

  useEffect(() => {
    try {
      localStorage.setItem(LOGS_STORAGE_KEY, JSON.stringify(logs))
    } catch {
      setStorageWarning('Não foi possível salvar neste navegador. Seus dados permanecem apenas nesta sessão.')
    }
  }, [logs])

  useEffect(() => {
    const notified = new Set<string>()
    const checkScheduledReminders = () => {
      if (!('Notification' in window) || Notification.permission !== 'granted') return
      const now = new Date()
      const date = localDateKey(now)
      const time = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`

      medications.forEach((medication) => {
        if (!medication.times.includes(time)) return
        const key = doseLogKey(medication.id, date, time)
        const alreadyTaken = logs.some((log) => log.key === key)
        if (alreadyTaken || notified.has(key)) return
        new Notification('Lembrete do DoseCerta', {
          body: `Horário cadastrado para ${medication.name}. Consulte as orientações que você registrou.`,
          tag: key,
        })
        notified.add(key)
      })
    }

    checkScheduledReminders()
    const intervalId = window.setInterval(checkScheduledReminders, 15000)
    return () => window.clearInterval(intervalId)
  }, [logs, medications])

  const selectedDaySchedules = medications.flatMap((medication) =>
    medication.times.map((time) => ({ medication, time, key: doseLogKey(medication.id, selectedDateKey, time) })),
  ).sort((left, right) => left.time.localeCompare(right.time))

  const logsByDate = useMemo(() => {
    const grouped = new Map<string, DoseLog[]>()
    logs.forEach((log) => grouped.set(log.date, [...(grouped.get(log.date) ?? []), log]))
    return grouped
  }, [logs])

  function addMedication(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const formData = new FormData(event.currentTarget)
    const name = String(formData.get('name') ?? '').trim()
    const times = String(formData.get('times') ?? '').split(',').map((time) => time.trim()).filter(Boolean)
    const unitsPerDose = Number(String(formData.get('unitsPerDose') ?? '').replace(',', '.'))
    const stock = Number(String(formData.get('stock') ?? '').replace(',', '.'))
    const refillAlertDays = Number(formData.get('refillAlertDays'))
    const unit = String(formData.get('unit') ?? 'unidades')

    if (!name || !times.length || times.some((time) => !/^([01]\d|2[0-3]):[0-5]\d$/.test(time)) ||
      !Number.isFinite(unitsPerDose) || unitsPerDose <= 0 || !Number.isFinite(stock) || stock < 0 ||
      !Number.isInteger(refillAlertDays) || refillAlertDays < 0) return

    setMedications((current) => [...current, {
      id: createId(),
      name,
      times: [...new Set(times)].sort(),
      unitsPerDose,
      unit,
      stock,
      refillAlertDays,
    }])
    setFormOpen(false)
    event.currentTarget.reset()
  }

  function toggleDose(medication: Medication, time: string, logKey: string) {
    if (selectedDateKey !== todayKey) return
    const alreadyTaken = logs.some((log) => log.key === logKey)
    if (alreadyTaken) {
      setLogs((current) => current.filter((log) => log.key !== logKey))
      setMedications((current) => current.map((item) => item.id === medication.id
        ? { ...item, stock: item.stock + medication.unitsPerDose }
        : item))
      return
    }

    if (medication.stock < medication.unitsPerDose) {
      setReminderStatus(`Estoque insuficiente registrado para ${medication.name}. Verifique o controle inserido.`)
      return
    }
    setLogs((current) => [...current, {
      key: logKey,
      medicationId: medication.id,
      date: selectedDateKey,
      time,
      takenAt: new Date().toISOString(),
    }])
    setMedications((current) => current.map((item) => item.id === medication.id
      ? { ...item, stock: Math.max(0, item.stock - medication.unitsPerDose) }
      : item))
    setReminderStatus('')
  }

  async function enableReminders() {
    if (!('Notification' in window)) {
      setReminderStatus('Este navegador não oferece notificações. Os horários continuam visíveis na agenda.')
      return
    }
    const permission = await Notification.requestPermission()
    setNotificationPermission(permission)
    setReminderStatus(permission === 'granted'
      ? 'Lembretes ativados enquanto o DoseCerta estiver aberto neste dispositivo.'
      : 'Permissão não concedida. Os horários permanecem disponíveis na agenda.')
  }

  function deleteMedication(id: string) {
    setMedications((current) => current.filter((medication) => medication.id !== id))
    setLogs((current) => current.filter((log) => log.medicationId !== id))
  }

  function saveStock(medicationId: string) {
    const stock = Number(stockDraft.replace(',', '.'))
    if (!Number.isFinite(stock) || stock < 0) return
    setMedications((current) => current.map((medication) => medication.id === medicationId ? { ...medication, stock } : medication))
    setEditingStockId(null)
    setStockDraft('')
  }

  function clearOrganizer() {
    if (!window.confirm('Apagar todos os medicamentos e registros salvos neste navegador?')) return
    setMedications([])
    setLogs([])
    localStorage.removeItem(MEDICATIONS_STORAGE_KEY)
    localStorage.removeItem(LOGS_STORAGE_KEY)
    setReminderStatus('Dados do organizador removidos deste navegador.')
  }

  function changeMonth(amount: number) {
    setShownMonth((current) => new Date(current.getFullYear(), current.getMonth() + amount, 1))
  }

  const monthTitle = new Intl.DateTimeFormat('pt-BR', { month: 'long', year: 'numeric' }).format(shownMonth)
  const refillAlerts = medications.filter((medication) => {
    const remainingDays = estimateSupplyDays(medication)
    return remainingDays !== null && remainingDays <= medication.refillAlertDays
  })

  return (
    <div className="page-content organizer-page">
      <div className="eyebrow"><span className="eyebrow-line" /> ROTINA PESSOAL</div>
      <header className="organizer-heading">
        <div><h1>Organizador de medicamentos</h1><p>Seus horários e registros, no seu dispositivo.</p></div>
        <button className="add-medication-button" onClick={() => setFormOpen(!formOpen)}>
          {formOpen ? <X size={17} /> : <Plus size={17} />}<span>{formOpen ? 'Fechar' : 'Adicionar'}</span>
        </button>
      </header>

      <aside className="organizer-privacy"><ShieldCheck size={17} /><p><strong>Organização pessoal, sem recomendações.</strong><span>Não insira dados de pacientes. As informações ficam neste navegador e não são criptografadas.</span></p></aside>

      <div className="organizer-notice-row">
        <button className={`reminder-control ${notificationPermission === 'granted' ? 'reminder-enabled' : ''}`} onClick={enableReminders}>
          <Bell size={16} /><span>{notificationPermission === 'granted' ? 'Lembretes ativos' : 'Ativar lembretes'}</span>
        </button>
        <span className="reminder-limit">Notificações só com o app aberto</span>
      </div>

      {reminderStatus && <p className="organizer-feedback" role="status">{reminderStatus}</p>}
      {storageWarning && <p className="organizer-feedback warning" role="alert">{storageWarning}</p>}

      {formOpen && <MedicationForm onSubmit={addMedication} onCancel={() => setFormOpen(false)} />}

      <div className="organizer-layout">
        <section className="schedule-section" aria-labelledby="schedule-heading">
          <div className="organizer-section-heading"><div><p className="section-kicker">AGENDA DO DIA</p><h2 id="schedule-heading">{selectedDateKey === todayKey ? 'Hoje' : formatLongDate(selectedDate)}</h2></div><span className="schedule-date-label">{formatLongDate(selectedDate)}</span></div>
          {selectedDaySchedules.length === 0 ? (
            <div className="organizer-empty"><span><CalendarDays size={22} /></span><strong>{medications.length ? 'Nenhum horário cadastrado para esta data' : 'Sua agenda começa aqui'}</strong><p>{medications.length ? 'Adicione horários ao registro para vê-los nesta agenda.' : 'Adicione seus medicamentos e horários já definidos para organizar a rotina.'}</p>{!medications.length && <button onClick={() => setFormOpen(true)}><Plus size={16} /> Adicionar medicamento</button>}</div>
          ) : (
            <div className="schedule-list">{selectedDaySchedules.map(({ medication, time, key }) => {
              const isTaken = logs.some((log) => log.key === key)
              const isToday = selectedDateKey === todayKey
              const now = new Date()
              const nowTime = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`
              const isPastDue = !isTaken && time < nowTime && isToday
              return <article className={`schedule-item ${isTaken ? 'dose-taken' : ''}`} key={key}>
                <time>{time}</time><span className="schedule-rail" />
                <div className="schedule-med-info"><strong>{medication.name}</strong><span>{medication.unitsPerDose} {medication.unit} · horário cadastrado</span>{isPastDue && <small className="late-label">Horário passou; registro pendente</small>}</div>
                <button className={`dose-log-button ${isTaken ? 'logged' : ''}`} disabled={!isToday} onClick={() => toggleDose(medication, time, key)} aria-label={isTaken ? `Desfazer registro de ${medication.name} às ${time}` : `Registrar tomada de ${medication.name} às ${time}`}>
                  {isTaken ? <><CheckCircle2 size={17} /><span>Tomado</span></> : <><Check size={16} /><span>Registrar</span></>}
                </button>
              </article>
            })}</div>
          )}
          {selectedDateKey !== todayKey && <p className="calendar-readonly-note">Consulta de histórico. Só é possível registrar tomadas na data atual.</p>}
        </section>

        <section className="calendar-section" aria-labelledby="calendar-heading">
          <div className="calendar-heading"><div><p className="section-kicker">HISTÓRICO</p><h2 id="calendar-heading">Calendário</h2></div><div className="month-controls"><button aria-label="Mês anterior" onClick={() => changeMonth(-1)}><ChevronLeft size={17} /></button><button aria-label="Próximo mês" onClick={() => changeMonth(1)}><ChevronRight size={17} /></button></div></div>
          <div className="calendar-month-label">{monthTitle}</div>
          <div className="calendar-grid" role="grid" aria-label={monthTitle}>
            {weekdays.map((day, index) => <span className="calendar-weekday" key={`${day}-${index}`} aria-hidden="true">{day}</span>)}
            {calendarCells.map((date, index) => {
              if (!date) return <span className="calendar-blank" key={`blank-${index}`} />
              const dateKey = localDateKey(date)
              const count = logsByDate.get(dateKey)?.length ?? 0
              const isSelected = dateKey === selectedDateKey
              const isToday = dateKey === todayKey
              return <button
                className={`calendar-day ${isSelected ? 'selected' : ''} ${isToday ? 'today' : ''} ${count ? 'has-log' : ''}`}
                key={dateKey}
                onClick={() => setSelectedDate(date)}
                aria-label={`${date.getDate()} de ${monthTitle}${count ? `, ${count} tomadas registradas` : ''}`}
                aria-pressed={isSelected}
              >{date.getDate()}{count > 0 && <i aria-hidden="true" />}</button>
            })}
          </div>
          <div className="calendar-legend"><span><i className="legend-today" /> Hoje</span><span><i className="legend-logged" /> Registro salvo</span></div>
        </section>
      </div>

      <section className="medication-list-section" aria-labelledby="medication-list-heading">
        <div className="organizer-section-heading"><div><p className="section-kicker">SEUS REGISTROS</p><h2 id="medication-list-heading">Medicamentos cadastrados <span>{medications.length}</span></h2></div>{medications.length > 0 && <button className="clear-data-button" onClick={clearOrganizer}><Trash2 size={14} /> Apagar dados</button>}</div>
        {refillAlerts.length > 0 && <div className="refill-banner"><CircleAlert size={17} /><p><strong>Confira o estoque registrado.</strong><span>{refillAlerts.map((medication) => medication.name).join(', ')} está no limite que você configurou.</span></p></div>}
        {medications.length === 0 ? <p className="medication-list-empty">Nenhum medicamento cadastrado.</p> : <div className="medication-cards">{medications.map((medication) => {
          const days = estimateSupplyDays(medication)
          const needsRefill = days !== null && days <= medication.refillAlertDays
          return <article className="medication-card" key={medication.id}>
            <div className="medication-card-top"><span className="medication-avatar"><Pill size={18} /></span><div><strong>{medication.name}</strong><small>{medication.times.join(' · ')}</small></div><button aria-label={`Remover ${medication.name}`} onClick={() => deleteMedication(medication.id)}><Trash2 size={16} /></button></div>
            <div className="stock-summary"><span><PackageCheck size={15} /> Estoque cadastrado</span><strong className={needsRefill ? 'stock-low' : ''}>{medication.stock} {medication.unit}</strong></div>
            <div className={`supply-estimate ${needsRefill ? 'supply-low' : ''}`}><Clock3 size={14} /><span>{days === null ? 'Estimativa indisponível' : days === 0 ? 'Estoque estimado para menos de 1 dia' : `Estimativa: ${days} ${days === 1 ? 'dia' : 'dias'} de estoque`}</span></div>
            {editingStockId === medication.id ? <div className="stock-edit-form"><label htmlFor={`stock-${medication.id}`}>Quantidade total atual</label><div><input id={`stock-${medication.id}`} type="number" min="0" step="any" inputMode="decimal" value={stockDraft} onChange={(event) => setStockDraft(event.target.value)} /><button onClick={() => saveStock(medication.id)}>Salvar estoque</button><button aria-label="Cancelar atualização de estoque" onClick={() => setEditingStockId(null)}><X size={15} /></button></div></div> : <button className="update-stock-button" onClick={() => { setEditingStockId(medication.id); setStockDraft(String(medication.stock)) }}>Atualizar estoque</button>}
          </article>
        })}</div>}
        <p className="supply-disclaimer">Estimativas usam apenas o estoque, a quantidade por horário e os horários cadastrados por você. Não conferem a prescrição nem substituem orientação profissional.</p>
      </section>
    </div>
  )
}

function MedicationForm({ onSubmit, onCancel }: { onSubmit: (event: FormEvent<HTMLFormElement>) => void; onCancel: () => void }) {
  const [timeList, setTimeList] = useState(['08:00'])
  return (
    <form className="medication-form" onSubmit={onSubmit}>
      <div className="form-title"><div><p className="section-kicker">NOVO REGISTRO</p><h2>Adicionar medicamento</h2></div><button type="button" className="form-close" aria-label="Fechar formulário" onClick={onCancel}><X size={18} /></button></div>
      <p className="form-disclaimer">Registre exatamente as orientações que você já recebeu. Este organizador não define medicamentos, doses nem horários.</p>
      <div className="organizer-form-grid">
        <label className="organizer-field full-field">Nome do medicamento<input name="name" required maxLength={80} placeholder="Nome para identificar seu registro" autoComplete="off" /></label>
        <fieldset className="schedule-time-field full-field"><legend>Horários já definidos</legend><div className="time-input-list">{timeList.map((time, index) => <label key={index} className="organizer-field">Horário {index + 1}<input type="time" value={time} required onChange={(event) => setTimeList((current) => current.map((item, itemIndex) => itemIndex === index ? event.target.value : item))} /></label>)}</div><input type="hidden" name="times" value={timeList.join(',')} /><button type="button" className="add-time-button" onClick={() => setTimeList((current) => [...current, ''])}><Plus size={15} /> Adicionar horário</button></fieldset>
        <label className="organizer-field">Quantidade por horário<input name="unitsPerDose" type="number" min="0.01" step="any" required inputMode="decimal" placeholder="Informada na orientação" /></label>
        <label className="organizer-field">Unidade<select name="unit" defaultValue="comprimidos">{unitChoices.map((unit) => <option key={unit}>{unit}</option>)}</select></label>
        <label className="organizer-field">Estoque atual<input name="stock" type="number" min="0" step="any" required inputMode="decimal" placeholder="Quantidade disponível" /></label>
        <label className="organizer-field">Avisar quando restarem<input name="refillAlertDays" type="number" min="0" max="365" step="1" required defaultValue="3" /><small>dias estimados de estoque</small></label>
      </div>
      <div className="organizer-form-actions"><button type="button" className="cancel-form-button" onClick={onCancel}>Cancelar</button><button type="submit" className="save-medication-button"><Check size={16} /> Salvar registro</button></div>
    </form>
  )
}

export default Organizer
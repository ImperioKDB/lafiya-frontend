import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../lib/AuthContext.jsx'
import { fetchPatients, submitVoiceTriage, submitTextTriage } from './api.js'
import {
  MicIcon,
  StopIcon,
  KeyboardIcon,
  SearchIcon,
  AlertIcon,
  ChevronRightIcon,
  PulseIcon,
} from '../../components/icons.jsx'

const STEP = { PICK: 'pick', CATEGORY: 'category', CAPTURE: 'capture', SUBMITTING: 'submitting', SCORED: 'scored', ERROR: 'error' }

// Exact same five categories, same order, as the USSD numeric menu
// (Master Build Spec SS9 / app/api/ussd.py's SYMPTOM_MENU_ORDER) --
// PRD SS6.7's "single source of truth" note applies to the category
// list itself, not just the scorer behind it. Selecting one is now
// required before recording or typing -- nothing on this screen falls
// through to a bare "other" default anymore.
const SYMPTOM_CATEGORIES = [
  { value: 'fever_body_pain', label: 'Fever / Body pain' },
  { value: 'stomach_digestive', label: 'Stomach / Digestive' },
  { value: 'pregnancy_related', label: 'Pregnancy-related' },
  { value: 'injury', label: 'Injury' },
  { value: 'other', label: 'Other' },
]

export default function TriageScreen() {
  const { accessToken } = useAuth()
  const navigate = useNavigate()

  const [step, setStep] = useState(STEP.PICK)
  const [patients, setPatients] = useState([])
  const [patientsLoading, setPatientsLoading] = useState(true)
  const [patientsGap, setPatientsGap] = useState(false)
  const [manualPatientId, setManualPatientId] = useState('')
  const [search, setSearch] = useState('')
  const [selectedPatient, setSelectedPatient] = useState(null)

  const [symptomCategory, setSymptomCategory] = useState(null)
  const [mode, setMode] = useState('voice') // voice | text
  const [transcriptDraft, setTranscriptDraft] = useState('')
  const [errorMessage, setErrorMessage] = useState(null)
  const [result, setResult] = useState(null)

  useEffect(() => {
    let active = true
    fetchPatients(accessToken).then(({ patients: p, notBuilt }) => {
      if (!active) return
      setPatients(p)
      setPatientsGap(notBuilt)
      setPatientsLoading(false)
    })
    return () => { active = false }
  }, [accessToken])

  function pickPatient(patient) {
    setSelectedPatient(patient)
    setStep(STEP.CATEGORY)
  }

  function pickManualPatient() {
    if (!manualPatientId) return
    setStep(STEP.CATEGORY)
  }

  async function handleSubmit({ audioBlob, transcript }) {
    const patientId = selectedPatient?.id || manualPatientId
    if (!patientId || !symptomCategory) return
    setStep(STEP.SUBMITTING)
    setErrorMessage(null)
    try {
      const consultation = audioBlob
        ? await submitVoiceTriage(patientId, symptomCategory, audioBlob, accessToken)
        : await submitTextTriage(patientId, symptomCategory, transcript, accessToken)
      setResult(consultation)
      setStep(STEP.SCORED)
    } catch (err) {
      setErrorMessage(err.message || 'Triage submission failed -- please try again.')
      setStep(STEP.ERROR)
    }
  }

  function reset() {
    setStep(STEP.PICK)
    setSelectedPatient(null)
    setManualPatientId('')
    setSymptomCategory(null)
    setTranscriptDraft('')
    setResult(null)
    setErrorMessage(null)
  }

  const filteredPatients = patients.filter((p) => {
    const q = search.trim().toLowerCase()
    if (!q) return true
    return (p.full_name || '').toLowerCase().includes(q) || (p.phone || '').includes(q)
  })

  return (
    <div>
      <h1 className="page-title">Symptom Triage</h1>
      <p className="page-subtitle">
        Voice capture feeds the same urgency scorer as the USSD path.
      </p>
      <div style={{ height: 20 }} />

      {step === STEP.PICK && (
        <PickPatientStep
          loading={patientsLoading}
          patients={filteredPatients}
          gap={patientsGap}
          search={search}
          onSearch={setSearch}
          onPick={pickPatient}
          manualPatientId={manualPatientId}
          onManualPatientId={setManualPatientId}
          onManualContinue={pickManualPatient}
        />
      )}

      {step === STEP.CATEGORY && (
        <CategoryStep
          patient={selectedPatient}
          selected={symptomCategory}
          onSelect={setSymptomCategory}
          onBack={() => setStep(STEP.PICK)}
          onContinue={() => symptomCategory && setStep(STEP.CAPTURE)}
        />
      )}

      {step === STEP.CAPTURE && (
        <CaptureStep
          patient={selectedPatient}
          symptomCategory={symptomCategory}
          mode={mode}
          onModeChange={setMode}
          transcriptDraft={transcriptDraft}
          onTranscriptDraft={setTranscriptDraft}
          onBack={() => setStep(STEP.CATEGORY)}
          onSubmit={handleSubmit}
        />
      )}

      {step === STEP.SUBMITTING && (
        <div className="loader-row" style={{ justifyContent: 'center', padding: '40px 0' }}>
          <span className="loader-stamp"><span /><span /><span /></span>
          {mode === 'voice' ? 'Transcribing and scoring…' : 'Scoring…'}
        </div>
      )}

      {step === STEP.SCORED && result && (
        <ScoredResult result={result} onNext={() => navigate('/chw')} onAnother={reset} />
      )}

      {step === STEP.ERROR && (
        <div className="state-block error" role="alert">
          <AlertIcon className="state-icon" />
          <p className="state-title">Couldn't submit triage</p>
          <p className="state-desc">{errorMessage}</p>
          <div style={{ display: 'flex', gap: 10, justifyContent: 'center', flexWrap: 'wrap' }}>
            <button className="btn btn-outline" onClick={() => setStep(STEP.CAPTURE)}>
              Try again
            </button>
            {mode === 'voice' && (
              <button className="btn btn-primary" onClick={() => { setMode('text'); setStep(STEP.CAPTURE) }}>
                Switch to typing
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

function PickPatientStep({ loading, patients, gap, search, onSearch, onPick, manualPatientId, onManualPatientId, onManualContinue }) {
  if (loading) {
    return (
      <div>
        <div className="skeleton skeleton-line" style={{ width: '60%' }} />
        <div className="skeleton skeleton-card" />
        <div className="skeleton skeleton-card" />
        <div className="skeleton skeleton-card" />
      </div>
    )
  }

  return (
    <div>
      <p className="section-label">Select patient</p>

      {gap ? (
        <div className="state-block notice" style={{ marginBottom: 16 }}>
          <AlertIcon className="state-icon" />
          <p className="state-title">Patient list isn't wired up yet</p>
          <p className="state-desc">
            Enter a patient ID directly to continue testing this screen.
          </p>
          <div style={{ display: 'flex', gap: 8, maxWidth: 320, margin: '0 auto' }}>
            <input
              value={manualPatientId}
              onChange={(e) => onManualPatientId(e.target.value)}
              placeholder="patient id"
              style={{ minHeight: 44, border: '1.5px solid var(--border)', borderRadius: 'var(--radius-sm)', padding: '0 12px', flex: 1 }}
            />
            <button className="btn btn-primary" disabled={!manualPatientId} onClick={onManualContinue}>
              Go
            </button>
          </div>
        </div>
      ) : (
        <>
          <div className="field" style={{ position: 'relative' }}>
            <SearchIcon style={{ position: 'absolute', left: 12, top: 12, width: 18, height: 18, color: 'var(--ink-soft)' }} />
            <input
              value={search}
              onChange={(e) => onSearch(e.target.value)}
              placeholder="Search by name or phone"
              style={{ paddingLeft: 38 }}
            />
          </div>

          {patients.length === 0 ? (
            <div className="state-block">
              <p className="state-title">No patients found</p>
              <p className="state-desc">
                {search ? 'Try a different search.' : 'Register a patient before starting triage.'}
              </p>
            </div>
          ) : (
            patients.map((p, i) => (
              <div
                key={p.id}
                className="ledger-card patient-pick stagger-in"
                style={{ animationDelay: `${i * 30}ms` }}
                onClick={() => onPick(p)}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && onPick(p)}
              >
                <div className="entry-row">
                  <div className="entry-avatar">{initials(p.full_name)}</div>
                  <div className="entry-body">
                    <div className="entry-name">{p.full_name || 'Unnamed patient'}</div>
                    <div className="entry-meta">{p.phone || 'no phone on file'}</div>
                  </div>
                  <ChevronRightIcon style={{ width: 18, height: 18, color: 'var(--ink-soft)', flexShrink: 0 }} />
                </div>
              </div>
            ))
          )}
        </>
      )}
    </div>
  )
}

// New step -- mirrors the USSD "Select symptom category" sub-menu
// (Master Build Spec SS9) as a ledger-card radio group, same visual
// pattern as LoansScreen's tier picker so the interaction feels
// consistent across the CHW app rather than inventing a new control.
function CategoryStep({ patient, selected, onSelect, onBack, onContinue }) {
  return (
    <div>
      {patient && (
        <div className="ledger-card" style={{ marginBottom: 18 }}>
          <p className="ledger-number" style={{ margin: 0 }}>TRIAGE FOR</p>
          <p style={{ margin: '3px 0 0', fontWeight: 600 }}>{patient.full_name}</p>
        </div>
      )}
      <p className="section-label">Symptom category</p>
      <p className="muted" style={{ marginBottom: 14 }}>
        Same categories as the USSD line -- this feeds the same urgency scorer either way.
      </p>

      {SYMPTOM_CATEGORIES.map((cat) => (
        <div
          key={cat.value}
          className={'ledger-card finance tier-card' + (selected === cat.value ? ' selected' : '')}
          onClick={() => onSelect(cat.value)}
          role="radio"
          aria-checked={selected === cat.value}
          tabIndex={0}
          onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && onSelect(cat.value)}
        >
          <div className="tier-amount" style={{ fontFamily: 'var(--font-sans)', fontSize: 15, fontWeight: 600 }}>
            {cat.label}
          </div>
          <div className="tier-radio" />
        </div>
      ))}

      <div style={{ display: 'flex', gap: 10, marginTop: 16 }}>
        <button className="btn btn-outline" style={{ flex: 1 }} onClick={onBack}>Back</button>
        <button className="btn btn-primary" style={{ flex: 1 }} disabled={!selected} onClick={onContinue}>
          Continue
        </button>
      </div>
    </div>
  )
}

function CaptureStep({ patient, symptomCategory, mode, onModeChange, transcriptDraft, onTranscriptDraft, onBack, onSubmit }) {
  const [micState, setMicState] = useState('idle') // idle | recording | recorded | denied
  const [elapsed, setElapsed] = useState(0)
  const [audioBlob, setAudioBlob] = useState(null)
  const mediaRecorderRef = useRef(null)
  const chunksRef = useRef([])
  const timerRef = useRef(null)
  const streamRef = useRef(null)

  const categoryLabel = SYMPTOM_CATEGORIES.find((c) => c.value === symptomCategory)?.label

  useEffect(() => () => cleanupStream(), [])

  function cleanupStream() {
    if (timerRef.current) clearInterval(timerRef.current)
    streamRef.current?.getTracks().forEach((t) => t.stop())
  }

  async function startRecording() {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      streamRef.current = stream
      chunksRef.current = []
      const recorder = new MediaRecorder(stream)
      recorder.ondataavailable = (e) => e.data.size > 0 && chunksRef.current.push(e.data)
      recorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: recorder.mimeType || 'audio/webm' })
        setAudioBlob(blob)
        setMicState('recorded')
      }
      mediaRecorderRef.current = recorder
      recorder.start()
      setMicState('recording')
      setElapsed(0)
      timerRef.current = setInterval(() => setElapsed((s) => s + 1), 1000)
    } catch {
      setMicState('denied')
    }
  }

  function stopRecording() {
    clearInterval(timerRef.current)
    mediaRecorderRef.current?.stop()
    streamRef.current?.getTracks().forEach((t) => t.stop())
  }

  function retake() {
    setAudioBlob(null)
    setMicState('idle')
    setElapsed(0)
  }

  return (
    <div>
      {patient && (
        <div className="ledger-card" style={{ marginBottom: 12 }}>
          <p className="ledger-number" style={{ margin: 0 }}>TRIAGE FOR</p>
          <p style={{ margin: '3px 0 0', fontWeight: 600 }}>{patient.full_name}</p>
        </div>
      )}

      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
        <button type="button" className="mode-toggle" onClick={onBack}>
          {categoryLabel ? `Category: ${categoryLabel}` : 'Change category'}
        </button>
        <button
          type="button"
          className="mode-toggle"
          onClick={() => onModeChange(mode === 'voice' ? 'text' : 'voice')}
        >
          {mode === 'voice' ? <><KeyboardIcon /> Type instead</> : <><MicIcon /> Use microphone</>}
        </button>
      </div>

      {mode === 'voice' ? (
        <div style={{ textAlign: 'center', padding: '20px 0 8px' }}>
          {micState !== 'recorded' && (
            <>
              <button
                type="button"
                className={'mic-button' + (micState === 'recording' ? ' recording' : '')}
                onClick={micState === 'recording' ? stopRecording : startRecording}
                aria-label={micState === 'recording' ? 'Stop recording' : 'Start recording'}
              >
                {micState === 'recording' ? <StopIcon /> : <MicIcon />}
              </button>
              {micState === 'recording' && (
                <p className="mic-timer">{formatTimer(elapsed)}</p>
              )}
              {micState === 'idle' && (
                <p className="mic-hint">Tap to record the patient's symptoms</p>
              )}
              {micState === 'denied' && (
                <div className="state-block error" style={{ marginTop: 16 }}>
                  <AlertIcon className="state-icon" />
                  <p className="state-title">Microphone access denied</p>
                  <p className="state-desc">
                    Allow microphone access in your browser settings, or switch to typing instead.
                  </p>
                  <button className="btn btn-primary" onClick={() => onModeChange('text')}>
                    <KeyboardIcon style={{ width: 16, height: 16 }} />
                    Type instead
                  </button>
                </div>
              )}
            </>
          )}

          {micState === 'recorded' && audioBlob && (
            <div className="stagger-in">
              <div className="ledger-card" style={{ textAlign: 'left', display: 'flex', alignItems: 'center', gap: 12 }}>
                <PulseIcon style={{ width: 22, height: 22, color: 'var(--teal)', flexShrink: 0 }} />
                <div>
                  <p style={{ margin: 0, fontWeight: 600, fontSize: 13.5 }}>Recording captured</p>
                  <p className="muted" style={{ margin: '2px 0 0' }}>{formatTimer(elapsed)} long</p>
                </div>
              </div>
              <div style={{ display: 'flex', gap: 10, marginTop: 14, justifyContent: 'center' }}>
                <button className="btn btn-outline" onClick={retake}>Retake</button>
                <button className="btn btn-primary" onClick={() => onSubmit({ audioBlob })}>
                  Submit for scoring
                </button>
              </div>
            </div>
          )}
        </div>
      ) : (
        <div>
          <div className="field">
            <label>Symptom notes</label>
            <textarea
              rows={6}
              value={transcriptDraft}
              onChange={(e) => onTranscriptDraft(e.target.value)}
              placeholder="Describe what the patient reports, in their own words where possible…"
              style={{ padding: 12, resize: 'vertical' }}
            />
          </div>
          <button
            className="btn btn-primary"
            style={{ width: '100%' }}
            disabled={!transcriptDraft.trim()}
            onClick={() => onSubmit({ transcript: transcriptDraft.trim() })}
          >
            Submit for scoring
          </button>
        </div>
      )}
    </div>
  )
}

function ScoredResult({ result, onNext, onAnother }) {
  const score = Number(result.urgency_score)
  const band = urgencyBand(score)

  return (
    <div className="stagger-in">
      <div className="state-block success" style={{ borderStyle: 'solid', borderColor: 'var(--teal-tint)', background: 'var(--teal-tint)' }}>
        <p className="state-title" style={{ marginBottom: 12 }}>Triage scored</p>
        <div className={`urgency-badge ${band.className}`} style={{ margin: '0 auto 16px' }}>
          <span className="urgency-dot" />
          {Number.isFinite(score) ? `Urgency ${score}/10` : 'Scored'} · {band.label}
        </div>
        {result.transcript && (
          <p className="state-desc" style={{ textAlign: 'left', fontStyle: 'italic' }}>
            "{result.transcript}"
          </p>
        )}
        <p className="state-desc">
          Added to the doctor's urgency-sorted queue. No diagnosis is made here.
        </p>
        <div style={{ display: 'flex', gap: 10, justifyContent: 'center', flexWrap: 'wrap' }}>
          <button className="btn btn-primary" onClick={onAnother}>Triage another patient</button>
          <button className="btn btn-outline" onClick={onNext}>
            Dashboard
            <ChevronRightIcon style={{ width: 16, height: 16 }} />
          </button>
        </div>
      </div>
    </div>
  )
}

function urgencyBand(score) {
  if (!Number.isFinite(score)) return { className: 'elevated', label: 'Pending review' }
  if (score >= 7) return { className: 'urgent', label: 'Urgent' }
  if (score >= 4) return { className: 'elevated', label: 'Elevated' }
  return { className: 'routine', label: 'Routine' }
}

function formatTimer(totalSeconds) {
  const m = Math.floor(totalSeconds / 60)
  const s = totalSeconds % 60
  return `${m}:${String(s).padStart(2, '0')}`
}

function initials(name) {
  if (!name) return '?'
  const parts = name.trim().split(/\s+/)
  return ((parts[0]?.[0] || '') + (parts[1]?.[0] || '')).toUpperCase()
}

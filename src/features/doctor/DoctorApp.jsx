import { useEffect, useState } from 'react'
import { useAuth } from '../../lib/AuthContext.jsx'
import { fetchQueue, completeConsultation } from './api.js'
import { displayNameFromEmail } from '../../lib/format.js'
import {
  AlertIcon,
  ChevronRightIcon,
  ClipboardIcon,
  UserIcon,
  LogoutIcon,
  BackArrowIcon,
  PulseIcon,
} from '../../components/icons.jsx'

export default function DoctorApp() {
  const { profile, signOut, accessToken } = useAuth()

  const [status, setStatus] = useState('loading') // loading | ready | error
  const [queue, setQueue] = useState([])
  const [errorMessage, setErrorMessage] = useState(null)
  const [selectedId, setSelectedId] = useState(null)

  useEffect(() => {
    load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  function load() {
    setStatus('loading')
    fetchQueue(accessToken)
      .then((data) => {
        setQueue(data)
        setStatus('ready')
      })
      .catch((err) => {
        setErrorMessage(err.message || 'Could not load the queue.')
        setStatus('error')
      })
  }

  function handleCompleted(id) {
    setQueue((q) => q.filter((c) => c.id !== id))
    setSelectedId(null)
  }

  const selected = queue.find((c) => c.id === selectedId) || null

  return (
    <div className={'doctor-shell' + (selectedId ? ' detail-open' : '')}>
      <div className="doctor-queue-pane">
        <div className="doctor-queue-header">
          <div>
            <p className="eyebrow" style={{ margin: 0 }}>LAFIYA · Doctor</p>
            <p style={{ margin: '2px 0 0', fontWeight: 700, fontSize: 17 }}>
              {displayNameFromEmail(profile?.email)}
            </p>
          </div>
          <button
            type="button"
            className="icon-btn"
            onClick={signOut}
            aria-label="Sign out"
            title="Sign out"
          >
            <LogoutIcon />
          </button>
        </div>

        <div className="doctor-queue-list">
          {status === 'loading' && <QueueSkeleton />}

          {status === 'error' && (
            <div className="state-block error" role="alert">
              <AlertIcon className="state-icon" />
              <p className="state-title">Couldn't load the queue</p>
              <p className="state-desc">{errorMessage}</p>
              <button className="btn btn-outline" onClick={load}>Retry</button>
            </div>
          )}

          {status === 'ready' && queue.length === 0 && (
            <div className="state-block">
              <p className="state-title">Queue is empty</p>
              <p className="state-desc">No pending cases right now.</p>
            </div>
          )}

          {status === 'ready' && queue.map((c) => (
            <QueueItem
              key={c.id}
              consultation={c}
              selected={c.id === selectedId}
              onSelect={() => setSelectedId(c.id)}
            />
          ))}
        </div>
      </div>

      <div className="doctor-detail-pane">
        {selected ? (
          <DetailPane
            key={selected.id}
            consultation={selected}
            accessToken={accessToken}
            onBack={() => setSelectedId(null)}
            onCompleted={() => handleCompleted(selected.id)}
          />
        ) : (
          <div className="detail-empty">
            <PulseIcon />
            <p className="state-title">Select a case</p>
            <p className="state-desc">Choose a patient from the queue to review their triage and prescribe.</p>
          </div>
        )}
      </div>
    </div>
  )
}

function QueueItem({ consultation, selected, onSelect }) {
  const band = urgencyBand(consultation.urgency_score)
  return (
    <button
      type="button"
      className={`queue-item ${band.className}` + (selected ? ' selected' : '')}
      onClick={onSelect}
    >
      <div className="queue-item-top">
        <span className="queue-item-name">{patientLabel(consultation)}</span>
        <span className={`urgency-badge ${band.className}`} style={{ padding: '3px 9px', fontSize: 11 }}>
          <span className="urgency-dot" />
          {Number.isFinite(Number(consultation.urgency_score)) ? consultation.urgency_score : '—'}
        </span>
      </div>
      <p className="queue-item-snippet">{consultation.transcript || 'No transcript on file.'}</p>
    </button>
  )
}

function DetailPane({ consultation, accessToken, onBack, onCompleted }) {
  const [prescription, setPrescription] = useState('')
  const [costEstimate, setCostEstimate] = useState('')
  const [submitState, setSubmitState] = useState('idle') // idle | submitting | success | error
  const [errorMessage, setErrorMessage] = useState(null)

  const band = urgencyBand(consultation.urgency_score)

  async function handleSubmit(e) {
    e.preventDefault()
    if (!prescription.trim() || !costEstimate) return
    setSubmitState('submitting')
    setErrorMessage(null)
    try {
      await completeConsultation(
        consultation.id,
        { prescription: prescription.trim(), costEstimate: Number(costEstimate) },
        accessToken
      )
      setSubmitState('success')
    } catch (err) {
      setErrorMessage(err.message || 'Could not save this consultation.')
      setSubmitState('error')
    }
  }

  if (submitState === 'success') {
    return (
      <div className="stagger-in">
        <button type="button" className="mode-toggle doctor-back-btn" onClick={onBack} style={{ marginBottom: 14 }}>
          <BackArrowIcon /> Back to queue
        </button>
        <div className="state-block success" style={{ borderStyle: 'solid', borderColor: 'var(--teal-tint)', background: 'var(--teal-tint)' }}>
          <div className="stamp completed" style={{ display: 'inline-flex', margin: '0 auto 14px' }}>
            <ClipboardIcon style={{ width: 13, height: 13 }} />
            Completed
          </div>
          <p className="state-title">Consultation saved</p>
          <p className="state-desc">
            Prescription and cost estimate sent to the CHW. Your ₦500 stipend has accrued.
          </p>
          <button className="btn btn-primary" onClick={onCompleted}>
            Next case
            <ChevronRightIcon style={{ width: 16, height: 16 }} />
          </button>
        </div>
      </div>
    )
  }

  return (
    <div style={{ maxWidth: 560 }}>
      <button type="button" className="mode-toggle doctor-back-btn" onClick={onBack} style={{ marginBottom: 14 }}>
        <BackArrowIcon /> Back to queue
      </button>

      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 6 }}>
        <div className="guarantor-phone-icon" style={{ background: 'var(--indigo-tint)', color: 'var(--indigo)' }}>
          <UserIcon />
        </div>
        <div>
          <h1 className="page-title" style={{ fontSize: 21 }}>{patientLabel(consultation)}</h1>
          <div className={`urgency-badge ${band.className}`} style={{ marginTop: 4 }}>
            <span className="urgency-dot" />
            Urgency {consultation.urgency_score ?? '—'}/10 · {band.label}
          </div>
        </div>
      </div>

      <p className="section-label" style={{ marginTop: 22 }}>Symptom transcript</p>
      <div className="transcript-block">
        {consultation.transcript ? `"${consultation.transcript}"` : 'No transcript recorded.'}
      </div>

      {submitState === 'error' && (
        <div className="ledger-card alert" role="alert" style={{ marginBottom: 16 }}>
          <div style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
            <AlertIcon style={{ width: 18, height: 18, color: 'var(--stamp)', flexShrink: 0, marginTop: 2 }} />
            <div>
              <p style={{ margin: 0, fontWeight: 600, fontSize: 13.5 }}>Couldn't save</p>
              <p className="muted" style={{ margin: '3px 0 0' }}>{errorMessage}</p>
            </div>
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit}>
        <div className="field">
          <label>Prescription</label>
          <textarea
            rows={4}
            value={prescription}
            onChange={(e) => setPrescription(e.target.value)}
            placeholder="What should be dispensed at the pharmacy…"
            style={{ padding: 12, resize: 'vertical' }}
          />
        </div>
        <div className="field" style={{ maxWidth: 220 }}>
          <label>Cost estimate (₦)</label>
          <input
            type="number"
            min="0"
            value={costEstimate}
            onChange={(e) => setCostEstimate(e.target.value)}
            placeholder="e.g. 3500"
          />
          <p className="muted" style={{ marginTop: 5 }}>
            Pharmacy claims are matched against this, within a 15% variance.
          </p>
        </div>
        <button
          type="submit"
          className="btn btn-primary"
          disabled={submitState === 'submitting' || !prescription.trim() || !costEstimate}
        >
          {submitState === 'submitting' ? (
            <>
              <span className="loader-stamp" style={{ height: 12 }}>
                <span style={{ background: '#fff' }} />
                <span style={{ background: '#fff' }} />
                <span style={{ background: '#fff' }} />
              </span>
              Saving…
            </>
          ) : (
            <>
              <ClipboardIcon style={{ width: 16, height: 16 }} />
              Complete consultation
            </>
          )}
        </button>
      </form>
    </div>
  )
}

function QueueSkeleton() {
  return (
    <div aria-busy="true" aria-label="Loading queue">
      <div className="loader-row" style={{ marginBottom: 14 }}>
        <span className="loader-stamp"><span /><span /><span /></span>
        Sorting by urgency…
      </div>
      <div className="skeleton skeleton-card" />
      <div className="skeleton skeleton-card" />
      <div className="skeleton skeleton-card" />
    </div>
  )
}

// ASSUMPTION -- falls back gracefully if the queue endpoint doesn't
// join patient info in. Confirm the real response shape before demo day.
function patientLabel(c) {
  return c.patient_name || c.patient?.full_name || `Patient #${c.patient_id ?? c.id}`
}

function urgencyBand(rawScore) {
  const score = Number(rawScore)
  if (!Number.isFinite(score)) return { className: 'elevated', label: 'Unscored' }
  if (score >= 7) return { className: 'urgent', label: 'Urgent' }
  if (score >= 4) return { className: 'elevated', label: 'Elevated' }
  return { className: 'routine', label: 'Routine' }
}

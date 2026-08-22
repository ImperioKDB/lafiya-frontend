import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../lib/AuthContext.jsx'
import { registerPatient } from './api.js'
import { formatEntryNumber } from '../../lib/format.js'
import { RegisterIcon, AlertIcon, PlusIcon, ChevronRightIcon } from '../../components/icons.jsx'

const EMPTY_FORM = { fullName: '', phone: '', age: '', nin: '' }

export default function RegisterPatientScreen() {
  const { accessToken } = useAuth()
  const navigate = useNavigate()

  const [form, setForm] = useState(EMPTY_FORM)
  const [touched, setTouched] = useState({})
  const [submitState, setSubmitState] = useState('idle') // idle | submitting | success | error
  const [errorMessage, setErrorMessage] = useState(null)
  const [result, setResult] = useState(null)

  const errors = validate(form)

  function handleChange(field, value) {
    setForm((f) => ({ ...f, [field]: value }))
  }
  function handleBlur(field) {
    setTouched((t) => ({ ...t, [field]: true }))
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setTouched({ fullName: true, phone: true, age: true, nin: true })
    if (Object.keys(errors).length > 0) return

    setSubmitState('submitting')
    setErrorMessage(null)
    try {
      const patient = await registerPatient(form, accessToken)
      setResult(patient)
      setSubmitState('success')
    } catch (err) {
      setErrorMessage(err.message || 'Registration failed -- please try again.')
      setSubmitState('error')
    }
  }

  function registerAnother() {
    setForm(EMPTY_FORM)
    setTouched({})
    setResult(null)
    setSubmitState('idle')
  }

  if (submitState === 'success') {
    return <SuccessState patient={result} onAnother={registerAnother} onDashboard={() => navigate('/chw')} />
  }

  return (
    <div>
      <h1 className="page-title">Register Patient</h1>
      <p className="page-subtitle">
        Creates a new ledger entry and accrues your ₦150 registration fee.
      </p>

      <div style={{ height: 20 }} />

      {submitState === 'error' && (
        <div className="ledger-card alert" role="alert" style={{ marginBottom: 16 }}>
          <div style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
            <AlertIcon style={{ width: 18, height: 18, color: 'var(--stamp)', flexShrink: 0, marginTop: 2 }} />
            <div>
              <p style={{ margin: 0, fontWeight: 600, fontSize: 13.5 }}>Couldn't save this patient</p>
              <p className="muted" style={{ margin: '3px 0 0' }}>{errorMessage}</p>
            </div>
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit} noValidate>
        <Field
          label="Full name"
          required
          value={form.fullName}
          onChange={(v) => handleChange('fullName', v)}
          onBlur={() => handleBlur('fullName')}
          error={touched.fullName && errors.fullName}
          placeholder="e.g. Hauwa Abdullahi"
          autoComplete="name"
        />
        <Field
          label="Phone number"
          required
          type="tel"
          value={form.phone}
          onChange={(v) => handleChange('phone', v)}
          onBlur={() => handleBlur('phone')}
          error={touched.phone && errors.phone}
          placeholder="e.g. 080XXXXXXXX"
          autoComplete="tel"
        />
        <Field
          label="Age"
          type="number"
          value={form.age}
          onChange={(v) => handleChange('age', v)}
          onBlur={() => handleBlur('age')}
          error={touched.age && errors.age}
          placeholder="e.g. 34"
        />
        <Field
          label="NIN"
          value={form.nin}
          onChange={(v) => handleChange('nin', v)}
          onBlur={() => handleBlur('nin')}
          error={touched.nin && errors.nin}
          placeholder="Optional -- not verified yet"
          helper="NIN verification is simulated for now. Leave blank if unavailable."
        />

        <button
          type="submit"
          className="btn btn-primary"
          disabled={submitState === 'submitting'}
          style={{ width: '100%', marginTop: 6 }}
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
              <PlusIcon style={{ width: 16, height: 16 }} />
              Register patient
            </>
          )}
        </button>
      </form>
    </div>
  )
}

function Field({ label, required, error, helper, value, onChange, onBlur, ...inputProps }) {
  return (
    <div className="field">
      <label>
        {label}
        {required && <span style={{ color: 'var(--stamp)' }}> *</span>}
      </label>
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onBlur={onBlur}
        aria-invalid={!!error}
        style={error ? { borderColor: 'var(--stamp)' } : undefined}
        {...inputProps}
      />
      {error ? (
        <p className="field-error" role="alert">{error}</p>
      ) : helper ? (
        <p className="muted" style={{ marginTop: 5 }}>{helper}</p>
      ) : null}
    </div>
  )
}

function SuccessState({ patient, onAnother, onDashboard }) {
  const entryLabel = patient?.id
    ? formatEntryNumber(String(patient.id).replace(/\D/g, '').slice(-4) || '0')
    : null

  return (
    <div className="stagger-in">
      <div className="state-block success" style={{ borderStyle: 'solid', borderColor: 'var(--teal-tint)', background: 'var(--teal-tint)' }}>
        <div className="stamp verified" style={{ display: 'inline-flex', margin: '0 auto 14px' }}>
          <RegisterIcon style={{ width: 14, height: 14 }} />
          Verified
        </div>
        <p className="state-title">Patient registered</p>
        <p className="state-desc">
          {patient?.full_name ? `${patient.full_name} has been` : 'The patient has been'}{' '}
          added to your ledger{entryLabel ? ` (${entryLabel})` : ''}. Your ₦150 registration
          fee is now pending.
        </p>
        <div style={{ display: 'flex', gap: 10, justifyContent: 'center', flexWrap: 'wrap' }}>
          <button className="btn btn-primary" onClick={onAnother}>
            <PlusIcon style={{ width: 16, height: 16 }} />
            Register another
          </button>
          <button className="btn btn-outline" onClick={onDashboard}>
            Dashboard
            <ChevronRightIcon style={{ width: 16, height: 16 }} />
          </button>
        </div>
      </div>
    </div>
  )
}

function validate(form) {
  const errors = {}
  if (!form.fullName.trim()) {
    errors.fullName = 'Enter the patient\'s full name.'
  }
  if (!form.phone.trim()) {
    errors.phone = 'Enter a phone number.'
  } else if (!/^[0-9+\s-]{7,15}$/.test(form.phone.trim())) {
    errors.phone = 'That doesn\'t look like a valid phone number.'
  }
  if (form.age && (Number(form.age) < 0 || Number(form.age) > 120)) {
    errors.age = 'Enter an age between 0 and 120.'
  }
  return errors
}

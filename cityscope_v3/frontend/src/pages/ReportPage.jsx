import { useState, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { MapContainer, TileLayer, Marker, useMapEvents } from 'react-leaflet'
import L from 'leaflet'
import { issuesAPI } from '../api'

delete L.Icon.Default.prototype._getIconUrl
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl:       'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl:     'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
})

function LocationPicker({ onSelect }) {
  useMapEvents({ click(e) { onSelect(e.latlng.lat, e.latlng.lng) } })
  return null
}

export default function ReportPage() {
  const navigate = useNavigate()
  const fileRef  = useRef(null)

  const [form, setForm]           = useState({ title:'', description:'', category:'road', severity:'low', latitude:'', longitude:'' })
  const [imageFile, setImageFile] = useState(null)
  const [preview, setPreview]     = useState('')
  const [marker, setMarker]       = useState(null)
  const [errors, setErrors]       = useState({})
  const [busy, setBusy]           = useState(false)

  const handle = e => setForm({ ...form, [e.target.name]: e.target.value })

  const handleImage = e => {
    const f = e.target.files[0]
    if (!f) return
    setImageFile(f)
    setPreview(URL.createObjectURL(f))
  }

  const handleMapClick = (lat, lng) => {
    setMarker([lat, lng])
    setForm(f => ({ ...f, latitude: lat.toFixed(6), longitude: lng.toFixed(6) }))
  }

const submit = async e => {
  e.preventDefault()
  const errs = {}
  if (!form.latitude)           errs.location    = 'Click the map to set a location.'
  if (!form.title.trim())       errs.title       = 'Title is required.'
  if (!form.description.trim()) errs.description = 'Description is required.'
  if (Object.keys(errs).length) { setErrors(errs); return }

  setErrors({}); setBusy(true)
  try {
    const fd = new FormData()
    fd.append('title',       form.title)
    fd.append('description', form.description)
    fd.append('category',    form.category)
    fd.append('severity',    form.severity)
    fd.append('latitude',    form.latitude)
    fd.append('longitude',   form.longitude)
    if (imageFile) fd.append('image', imageFile)
    const { data } = await issuesAPI.create(fd)
    navigate(`/issues/${data.id}`)
  } catch (err) {
    console.error(err.response?.data)
    const d = err.response?.data || {}
    setErrors(typeof d === 'object' ? d : { submit: 'Submission failed. Check all fields.' })
  }
  setBusy(false)
}

  return (
    <div>
      <div style={s.hdr}>
        <h1 style={s.title}>Report an Issue</h1>
        <p style={s.sub}>Fill in the details and pin the location on the map</p>
      </div>

      <form onSubmit={submit} style={s.layout}>
        {/* Left column */}
        <div style={s.leftCol}>

          {/* Details card */}
          <div style={s.card}>
            <h2 style={s.cardTitle}>Issue Details</h2>
            {errors.submit && <div style={s.errBox}>{errors.submit}</div>}

            <label style={s.label}>
              Title *
              <input name="title" value={form.title} onChange={handle} placeholder="e.g. Large pothole on main road" style={{ marginTop:'6px' }} />
              {errors.title && <span style={s.fe}>{errors.title}</span>}
            </label>

            <label style={s.label}>
              Description *
              <textarea name="description" value={form.description} onChange={handle} rows={4} placeholder="Describe the issue in detail…" style={{ marginTop:'6px', resize:'vertical' }} />
              {errors.description && <span style={s.fe}>{errors.description}</span>}
            </label>

            <div style={s.row}>
              <label style={s.label}>
                Category *
                <select name="category" value={form.category} onChange={handle} style={{ marginTop:'6px' }}>
                  <option value="road">Road</option>
                  <option value="water">Water</option>
                  <option value="electricity">Electricity</option>
                  <option value="waste">Waste</option>
                </select>
              </label>
              <label style={s.label}>
                Severity *
                <select name="severity" value={form.severity} onChange={handle} style={{ marginTop:'6px' }}>
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                </select>
              </label>
            </div>

            <label style={s.label}>
              Photo (optional)
              <div style={s.uploadBox} onClick={() => fileRef.current?.click()}>
                {preview
                  ? <img src={preview} alt="preview" style={{ width:'100%', height:'160px', objectFit:'cover', borderRadius:'6px' }} />
                  : <div style={{ textAlign:'center', color:'var(--text-dim)' }}>
                      <div style={{ fontSize:'2rem', marginBottom:'6px' }}>📷</div>
                      <div style={{ fontSize:'0.85rem' }}>Click to upload a photo</div>
                    </div>
                }
              </div>
              <input ref={fileRef} type="file" accept="image/*" onChange={handleImage} style={{ display:'none' }} />
            </label>
          </div>

          {/* Location card */}
          <div style={s.card}>
            <h2 style={s.cardTitle}>Location</h2>
            <p style={{ fontSize:'0.85rem', color:'var(--text-muted)', marginBottom:'10px' }}>
              Click anywhere on the map below to drop a pin at the issue location.
            </p>
            {errors.location && <div style={s.errBox}>{errors.location}</div>}
            <div style={s.row}>
              <label style={s.label}>Latitude
                <input name="latitude" value={form.latitude} onChange={handle} placeholder="Auto-filled from map" style={{ marginTop:'6px' }} />
              </label>
              <label style={s.label}>Longitude
                <input name="longitude" value={form.longitude} onChange={handle} placeholder="Auto-filled from map" style={{ marginTop:'6px' }} />
              </label>
            </div>
          </div>

          <button type="submit" disabled={busy} style={s.submitBtn}>
            {busy ? 'Submitting…' : '📍 Submit Issue Report'}
          </button>
        </div>

        {/* Right column — map */}
        <div style={s.rightCol}>
          <div style={s.card}>
            <h2 style={s.cardTitle}>Pin Location on Map</h2>
            <div style={{ height:'520px', borderRadius:'8px', overflow:'hidden', marginTop:'12px', border:'1px solid var(--border)' }}>
              <MapContainer center={[20.5937, 78.9629]} zoom={5} style={{ height:'100%', width:'100%' }}>
                <TileLayer
                  url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                  attribution='&copy; <a href="https://openstreetmap.org">OpenStreetMap</a>'
                />
                <LocationPicker onSelect={handleMapClick} />
                {marker && <Marker position={marker} />}
              </MapContainer>
            </div>
          </div>
        </div>
      </form>
    </div>
  )
}

const s = {
  hdr:       { marginBottom:'24px' },
  title: { fontFamily:'var(--font-display)', fontWeight:800, fontSize:'2.4rem', letterSpacing:'-0.05em', lineHeight:1.1 },
  sub:   { color:'var(--text-muted)', fontSize:'1.05rem', marginTop:'8px', fontWeight:400 },
  layout:    { display:'grid', gridTemplateColumns:'1fr 1fr', gap:'20px', alignItems:'start' },
  leftCol:   { display:'flex', flexDirection:'column', gap:'16px' },
  rightCol:  { position:'sticky', top:'24px' },
  card:      { background:'var(--bg-card)', border:'1px solid var(--border)', borderRadius:'var(--radius)', padding:'20px', display:'flex', flexDirection:'column', gap:'14px', boxShadow:'var(--shadow)' },
  cardTitle: { fontFamily:'var(--font-display)', fontWeight:700, fontSize:'1rem' },
  label:     { display:'flex', flexDirection:'column', fontSize:'0.83rem', fontWeight:600, color:'var(--text-muted)' },
  row:       { display:'grid', gridTemplateColumns:'1fr 1fr', gap:'12px' },
  uploadBox: { marginTop:'6px', border:'2px dashed var(--border)', borderRadius:'var(--radius-sm)', padding:'20px', cursor:'pointer', minHeight:'80px', display:'flex', alignItems:'center', justifyContent:'center', background:'var(--bg-raised)', transition:'border-color var(--transition)' },
  errBox:    { background:'var(--red-light)', border:'1px solid var(--red)', color:'var(--red)', borderRadius:'var(--radius-sm)', padding:'10px 14px', fontSize:'0.85rem' },
  fe:        { color:'var(--red)', fontSize:'0.75rem', marginTop:'3px' },
  submitBtn: { background:'var(--accent)', color:'#fff', padding:'14px', borderRadius:'var(--radius-sm)', fontFamily:'var(--font-display)', fontWeight:800, fontSize:'1rem', cursor:'pointer', border:'none', width:'100%', boxShadow:'var(--shadow-md)' },
}

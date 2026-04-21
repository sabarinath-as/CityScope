import { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { MapContainer, TileLayer, Marker, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import { issuesAPI } from '../api';

// Fix Leaflet default icon
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

function LocationPicker({ onSelect }) {
  useMapEvents({
    click(e) { onSelect(e.latlng.lat, e.latlng.lng); },
  });
  return null;
}

export default function ReportPage() {
  const navigate = useNavigate();
  const fileRef = useRef(null);
  const [form, setForm] = useState({ title: '', description: '', category: 'road', severity: 'low', latitude: '', longitude: '' });
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState('');
  const [markerPos, setMarkerPos] = useState(null);
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);

  const handle = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleImage = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setImageFile(file);
    setImagePreview(URL.createObjectURL(file));
  };

  const handleMapClick = (lat, lng) => {
    setMarkerPos([lat, lng]);
    setForm((f) => ({ ...f, latitude: lat.toFixed(6), longitude: lng.toFixed(6) }));
  };

  const submit = async (e) => {
    e.preventDefault();
    const errs = {};
    if (!form.latitude || !form.longitude) errs.location = 'Please click on the map to select a location.';
    if (!form.title.trim()) errs.title = 'Title is required.';
    if (!form.description.trim()) errs.description = 'Description is required.';
    if (Object.keys(errs).length) { setErrors(errs); return; }

    setErrors({}); setLoading(true);
    try {
      const fd = new FormData();
      Object.entries(form).forEach(([k, v]) => fd.append(k, v));
      if (imageFile) fd.append('image', imageFile);
      const { data } = await issuesAPI.create(fd);
      navigate(`/issues/${data.id}`);
    } catch (err) {
      const data = err.response?.data || {};
      setErrors(typeof data === 'object' ? data : { submit: 'Submission failed. Please try again.' });
    }
    setLoading(false);
  };

  return (
    <div>
      <div style={{ marginBottom: '24px' }}>
        <h1 style={styles.title}>Report an Issue</h1>
        <p style={styles.sub}>Describe the problem and drop a pin on the map to pinpoint its location</p>
      </div>

      <form onSubmit={submit} style={styles.layout}>
        {/* Left: form fields */}
        <div style={styles.formCol}>
          <div style={styles.card}>
            <h2 style={styles.sectionTitle}>Issue Details</h2>

            {errors.submit && <div style={styles.errorBox}>{errors.submit}</div>}

            <label style={styles.label}>Title *
              <input name="title" value={form.title} onChange={handle} placeholder="e.g. Large pothole on Main St" style={{ marginTop: '6px' }} />
              {errors.title && <span style={styles.fieldErr}>{errors.title}</span>}
            </label>

            <label style={styles.label}>Description *
              <textarea name="description" value={form.description} onChange={handle} rows={4} placeholder="Describe the issue in detail…" style={{ marginTop: '6px', resize: 'vertical' }} />
              {errors.description && <span style={styles.fieldErr}>{errors.description}</span>}
            </label>

            <div style={styles.row}>
              <label style={styles.label}>Category *
                <select name="category" value={form.category} onChange={handle} style={{ marginTop: '6px' }}>
                  <option value="road">Road</option>
                  <option value="water">Water</option>
                  <option value="electricity">Electricity</option>
                  <option value="waste">Waste</option>
                </select>
              </label>
              <label style={styles.label}>Severity *
                <select name="severity" value={form.severity} onChange={handle} style={{ marginTop: '6px' }}>
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                </select>
              </label>
            </div>

            <label style={styles.label}>Photo (optional)
              <div style={styles.uploadArea} onClick={() => fileRef.current?.click()}>
                {imagePreview ? (
                  <img src={imagePreview} alt="preview" style={{ width: '100%', height: '160px', objectFit: 'cover', borderRadius: '6px' }} />
                ) : (
                  <div style={{ textAlign: 'center', color: 'var(--text-dim)' }}>
                    <div style={{ fontSize: '1.5rem', marginBottom: '6px' }}>📷</div>
                    <div style={{ fontSize: '0.85rem' }}>Click to upload an image</div>
                  </div>
                )}
              </div>
              <input ref={fileRef} type="file" accept="image/*" onChange={handleImage} style={{ display: 'none' }} />
            </label>
          </div>

          <div style={styles.card}>
            <h2 style={styles.sectionTitle}>Location</h2>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '12px' }}>Click anywhere on the map to drop a pin</p>
            {errors.location && <div style={styles.errorBox}>{errors.location}</div>}
            <div style={styles.row}>
              <label style={styles.label}>Latitude
                <input name="latitude" value={form.latitude} onChange={handle} placeholder="Auto-filled from map" style={{ marginTop: '6px' }} />
              </label>
              <label style={styles.label}>Longitude
                <input name="longitude" value={form.longitude} onChange={handle} placeholder="Auto-filled from map" style={{ marginTop: '6px' }} />
              </label>
            </div>
          </div>

          <button type="submit" disabled={loading} style={styles.submitBtn}>
            {loading ? 'Submitting…' : '📍 Submit Issue'}
          </button>
        </div>

        {/* Right: map */}
        <div style={styles.mapCol}>
          <div style={styles.card}>
            <h2 style={styles.sectionTitle}>Pin Location</h2>
            <div style={{ height: '500px', borderRadius: '8px', overflow: 'hidden', marginTop: '12px' }}>
              <MapContainer center={[20.5937, 78.9629]} zoom={5} style={{ height: '100%', width: '100%' }}>
                <TileLayer
                  url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                  attribution='&copy; <a href="https://openstreetmap.org">OpenStreetMap</a>'
                />
                <LocationPicker onSelect={handleMapClick} />
                {markerPos && <Marker position={markerPos} />}
              </MapContainer>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
}

const styles = {
  title: { fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: '1.8rem', letterSpacing: '-0.5px' },
  sub: { color: 'var(--text-muted)', fontSize: '0.9rem', marginTop: '4px' },
  layout: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', alignItems: 'start' },
  formCol: { display: 'flex', flexDirection: 'column', gap: '16px' },
  mapCol: { position: 'sticky', top: '24px' },
  card: { background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 'var(--radius)', padding: '20px', display: 'flex', flexDirection: 'column', gap: '14px' },
  sectionTitle: { fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: '1rem', marginBottom: '4px' },
  label: { display: 'flex', flexDirection: 'column', fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-muted)' },
  row: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' },
  uploadArea: { marginTop: '6px', border: '2px dashed var(--border)', borderRadius: 'var(--radius-sm)', padding: '20px', cursor: 'pointer', transition: 'border-color 0.2s', minHeight: '80px', display: 'flex', alignItems: 'center', justifyContent: 'center' },
  errorBox: { background: 'var(--red-dim)', border: '1px solid var(--red)', color: 'var(--red)', borderRadius: 'var(--radius-sm)', padding: '10px 14px', fontSize: '0.85rem' },
  fieldErr: { color: 'var(--red)', fontSize: '0.75rem', marginTop: '4px' },
  submitBtn: { background: 'var(--accent)', color: '#fff', padding: '14px', borderRadius: 'var(--radius-sm)', fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: '1rem', cursor: 'pointer', border: 'none', width: '100%' },
};

import { useEffect, useMemo, useState } from 'react';

const initialState = {
  username: '',
  name: '',
  bio: '',
  avatarUrl: '',
  locationName: '',
  languages: [],
  interests: [],
  birthdate: '',
};

export default function ProfilePage({ userId, apiClient }) {
  const [profile, setProfile] = useState(initialState);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);

  const client = useMemo(() => apiClient || window.fetch.bind(window), [apiClient]);

  useEffect(() => {
    if (!userId) return;
    let cancelled = false;

    async function loadProfile() {
      setLoading(true);
      setError(null);
      try {
        const response = await client(`/user/${userId}`);
        const data = await response.json();
        if (!response.ok) throw new Error(data.error || 'Failed to load profile');
        if (!cancelled) {
          setProfile({
            username: data.user.username || '',
            name: data.user.name || '',
            bio: data.user.bio || '',
            avatarUrl: data.user.avatarUrl || '',
            locationName: data.user.location?.name || '',
            languages: data.user.languages || [],
            interests: data.user.interests?.map((interest) => interest.label) || [],
            birthdate: data.user.birthdate ? data.user.birthdate.substring(0, 10) : '',
          });
        }
      } catch (err) {
        if (!cancelled) setError(err.message);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    loadProfile();
    return () => {
      cancelled = true;
    };
  }, [client, userId]);

  const handleChange = (field) => (event) => {
    const value = event.target.value;
    setProfile((prev) => ({ ...prev, [field]: value }));
  };

  const handleArrayChange = (field) => (event) => {
    const value = event.target.value.split(',').map((item) => item.trim()).filter(Boolean);
    setProfile((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!userId) return;

    setSaving(true);
    setError(null);
    setSuccess(false);

    try {
      const response = await client(`/user/${userId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: profile.username,
          name: profile.name,
          bio: profile.bio,
          avatarUrl: profile.avatarUrl,
          location: profile.locationName
            ? { name: profile.locationName }
            : undefined,
          languages: profile.languages,
          interests: profile.interests.map((label) => ({ label })),
          birthdate: profile.birthdate || undefined,
        }),
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Failed to save profile');

      setSuccess(true);
      setProfile((prev) => ({
        ...prev,
        username: data.user.username || '',
        name: data.user.name || '',
        bio: data.user.bio || '',
        avatarUrl: data.user.avatarUrl || '',
        locationName: data.user.location?.name || '',
        languages: data.user.languages || [],
        interests: data.user.interests?.map((interest) => interest.label) || [],
        birthdate: data.user.birthdate ? data.user.birthdate.substring(0, 10) : '',
      }));
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="profile-page">
      <h1>Profile</h1>
      {loading && <p>Loading profile…</p>}
      {error && <p className="error">{error}</p>}
      {success && <p className="success">Profile updated successfully!</p>}

      <form className="profile-form" onSubmit={handleSubmit}>
        <label>
          Username
          <input value={profile.username} onChange={handleChange('username')} required />
        </label>
        <label>
          Name
          <input value={profile.name} onChange={handleChange('name')} />
        </label>
        <label>
          Bio
          <textarea value={profile.bio} onChange={handleChange('bio')} maxLength={500} />
        </label>
        <label>
          Avatar URL
          <input value={profile.avatarUrl} onChange={handleChange('avatarUrl')} />
        </label>
        <label>
          Location
          <input value={profile.locationName} onChange={handleChange('locationName')} placeholder="City, Country" />
        </label>
        <label>
          Languages (comma separated)
          <input value={profile.languages.join(', ')} onChange={handleArrayChange('languages')} />
        </label>
        <label>
          Interests (comma separated)
          <input value={profile.interests.join(', ')} onChange={handleArrayChange('interests')} />
        </label>
        <label>
          Birthdate
          <input type="date" value={profile.birthdate} onChange={handleChange('birthdate')} />
        </label>
        <button type="submit" disabled={saving}>
          {saving ? 'Saving…' : 'Save Profile'}
        </button>
      </form>
    </div>
  );
}

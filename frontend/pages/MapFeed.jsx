import mapboxgl from 'mapbox-gl';
import { useEffect, useMemo, useRef, useState } from 'react';

mapboxgl.accessToken = process.env.MAPBOX_TOKEN || '';

export default function MapFeed({ apiClient, userPosition }) {
  const mapContainer = useRef(null);
  const mapRef = useRef(null);
  const markersRef = useRef([]);
  const [posts, setPosts] = useState([]);
  const [error, setError] = useState(null);
  const client = useMemo(() => apiClient || window.fetch.bind(window), [apiClient]);

  useEffect(() => {
    if (!mapContainer.current || mapRef.current) return;
    const map = new mapboxgl.Map({
      container: mapContainer.current,
      style: 'mapbox://styles/mapbox/streets-v11',
      center: userPosition ? [userPosition.lng, userPosition.lat] : [0, 0],
      zoom: userPosition ? 12 : 2,
    });

    map.addControl(new mapboxgl.NavigationControl());
    mapRef.current = map;

    return () => {
      map.remove();
      mapRef.current = null;
    };
  }, [userPosition]);

  useEffect(() => {
    if (!userPosition) return;
    let cancelled = false;

    async function loadPosts() {
      try {
        const response = await client(`/posts?lat=${userPosition.lat}&lng=${userPosition.lng}`);
        const data = await response.json();
        if (!response.ok) throw new Error(data.error || 'Failed to fetch posts');
        if (!cancelled) setPosts(data.posts || []);
      } catch (err) {
        if (!cancelled) setError(err.message);
      }
    }

    loadPosts();
    const interval = setInterval(loadPosts, 30000);
    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, [client, userPosition]);

  useEffect(() => {
    if (!mapRef.current) return;
    markersRef.current.forEach((marker) => marker.remove());
    markersRef.current = [];

    posts.forEach((post) => {
      if (!post.location?.coordinates) return;
      const marker = new mapboxgl.Marker({ color: '#ff5722' })
        .setLngLat(post.location.coordinates)
        .setPopup(
          new mapboxgl.Popup().setHTML(
            `<strong>${post.title}</strong><p>${post.body || ''}</p><small>Open nearby to unlock</small>`
          )
        )
        .addTo(mapRef.current);

      markersRef.current.push(marker);
    });
  }, [posts]);

  return (
    <div className="map-feed">
      {error && <p className="error">{error}</p>}
      <div className="map" ref={mapContainer} style={{ width: '100%', height: '80vh' }} />
      <section className="post-list">
        <h2>Nearby Flames</h2>
        <ul>
          {posts.map((post) => (
            <li key={post._id}>
              <h3>{post.title}</h3>
              <p>{post.body}</p>
              <small>{post.author?.username}</small>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}

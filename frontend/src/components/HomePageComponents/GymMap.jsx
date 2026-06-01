import { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import { useNavigate } from 'react-router-dom';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Vite doesn't resolve Leaflet's default marker PNG paths correctly, so we use
// custom divIcon markers instead of the default image-based ones.
// divIcon renders a plain HTML element as the marker — no image files needed.

const gymIcon = L.divIcon({
  className: '',
  html: `<div style="
    width: 32px; height: 32px;
    background: #78350f;
    border: 3px solid #fef3c7;
    border-radius: 50% 50% 50% 0;
    transform: rotate(-45deg);
    box-shadow: 0 2px 6px rgba(0,0,0,0.3);
  "></div>`,
  iconSize: [32, 32],
  iconAnchor: [16, 32],
  popupAnchor: [0, -36],
});

const userIcon = L.divIcon({
  className: '',
  html: `<div style="
    width: 16px; height: 16px;
    background: #3b82f6;
    border: 3px solid white;
    border-radius: 50%;
    box-shadow: 0 0 0 4px rgba(59,130,246,0.25);
  "></div>`,
  iconSize: [16, 16],
  iconAnchor: [8, 8],
});

// Imperatively flies the map to the user's position once we have it.
// Lives inside MapContainer so it has access to the Leaflet map instance
// via useMap() — that hook only works inside a MapContainer child.
function FlyToUser({ position }) {
  const map = useMap();
  useEffect(() => {
    if (position) {
      map.flyTo(position, 13, { duration: 1.5 });
    }
  }, [position]);
  return null;
}

function GymMap({ gyms }) {
  const navigate = useNavigate();
  const [userPos, setUserPos] = useState(null);
  const [geoError, setGeoError] = useState(null);

  // Only gyms with both lat and lng set can be shown on the map.
  const mappableGyms = gyms.filter(g => g.lat != null && g.lng != null);

  useEffect(() => {
    if (!navigator.geolocation) {
      setGeoError("Your browser doesn't support geolocation.");
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => setUserPos([pos.coords.latitude, pos.coords.longitude]),
      () => setGeoError("Couldn't get your location — showing all gyms."),
    );
  }, []);

  // Default center: somewhere central if we have no user position yet.
  // Once geolocation resolves, FlyToUser animates to the real position.
  const defaultCenter = userPos ?? [-25.2744, 133.7751];

  return (
    <div className="flex flex-col gap-3">
      {geoError && (
        <p className="text-xs italic text-amber-500">{geoError}</p>
      )}

      {mappableGyms.length === 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 text-xs italic text-amber-700">
          No gyms have map coordinates set yet. Setters can add them when creating a gym.
        </div>
      )}

      <div className="rounded-xl overflow-hidden border border-amber-200" style={{ height: '420px' }}>
        <MapContainer
          center={defaultCenter}
          zoom={userPos ? 13 : 4}
          style={{ height: '100%', width: '100%' }}
          // Disable scroll wheel zoom so the page doesn't hijack normal scrolling.
          scrollWheelZoom={false}
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />

          <FlyToUser position={userPos} />

          {userPos && (
            <Marker position={userPos} icon={userIcon}>
              <Popup>
                <span className="text-xs italic">You are here</span>
              </Popup>
            </Marker>
          )}

          {mappableGyms.map(gym => (
            <Marker key={gym.id} position={[gym.lat, gym.lng]} icon={gymIcon}>
              <Popup>
                <div className="font-serif min-w-[140px]">
                  <p className="font-bold text-amber-900 text-sm mb-0.5">{gym.name}</p>
                  <p className="text-xs text-amber-600 italic mb-2">{gym.location}</p>
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-xs px-2 py-0.5 rounded-full bg-orange-100 text-amber-800 italic">
                      {gym.climb_count} climbs
                    </span>
                    <span className={`text-xs px-2 py-0.5 rounded-full italic
                      ${gym.is_active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                      {gym.is_active ? 'Open' : 'Closed'}
                    </span>
                  </div>
                  <button
                    onClick={() => navigate(`/gym/${gym.id}`)}
                    className="w-full text-xs py-1.5 rounded-lg bg-amber-900 text-amber-50 italic font-bold"
                  >
                    Go to gym →
                  </button>
                </div>
              </Popup>
            </Marker>
          ))}
        </MapContainer>
      </div>

      {mappableGyms.length > 0 && (
        <p className="text-xs italic text-amber-500 text-center">
          Showing {mappableGyms.length} of {gyms.length} gyms · click a pin to view
        </p>
      )}
    </div>
  );
}

export default GymMap;

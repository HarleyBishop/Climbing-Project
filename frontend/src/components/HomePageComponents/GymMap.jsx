import { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import { useNavigate } from 'react-router-dom';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { Chip } from '../ui/primitives';

// Vite doesn't resolve Leaflet's default marker PNG paths, so markers are
// divIcons — plain HTML elements, no image files needed. Tailwind classes
// work here because the class names are in this source file.
const gymIcon = L.divIcon({
  className: '',
  html: '<div class="size-7 rounded-[50%_50%_50%_0] -rotate-45 border-[3px] border-white bg-accent shadow-lg"></div>',
  iconSize: [28, 28],
  iconAnchor: [14, 28],
  popupAnchor: [0, -32],
});

const userIcon = L.divIcon({
  className: '',
  html: '<div class="size-4 rounded-full border-[3px] border-white bg-info shadow-[0_0_0_6px_rgba(0,102,204,.25)]"></div>',
  iconSize: [16, 16],
  iconAnchor: [8, 8],
});

// Flies the map to the user's position once geolocation resolves. Must live
// inside MapContainer because useMap() only works in its children.
function FlyToUser({ position }) {
  const map = useMap();
  useEffect(() => {
    if (position) map.flyTo(position, 13, { duration: 1.5 });
  }, [map, position]);
  return null;
}

function GymMap({ gyms }) {
  const navigate = useNavigate();
  const [userPos, setUserPos] = useState(null);
  const [geoError, setGeoError] = useState(
    navigator.geolocation ? null : "Your browser doesn't support geolocation."
  );

  // Only gyms with both coordinates can be pinned.
  const mappableGyms = gyms.filter(g => g.lat != null && g.lng != null);

  useEffect(() => {
    if (!navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition(
      pos => setUserPos([pos.coords.latitude, pos.coords.longitude]),
      () => setGeoError("Couldn't get your location — showing all gyms."),
    );
  }, []);

  // Centre of Australia until geolocation resolves.
  const defaultCenter = userPos ?? [-25.2744, 133.7751];

  return (
    <div className="space-y-3">
      {/* The tile filter mutes OpenStreetMap's bright default colours to suit
          the UI; markers live in a different pane so they keep their colour. */}
      <div className="isolate h-[420px] overflow-hidden rounded-3xl ring-1 ring-line [&_.leaflet-tile-pane]:brightness-105 [&_.leaflet-tile-pane]:saturate-[.35]">
        <MapContainer
          center={defaultCenter}
          zoom={userPos ? 13 : 4}
          className="h-full w-full"
          // Don't hijack page scrolling.
          scrollWheelZoom={false}
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          <FlyToUser position={userPos} />

          {userPos && (
            <Marker position={userPos} icon={userIcon}>
              <Popup>You are here</Popup>
            </Marker>
          )}

          {mappableGyms.map(gym => (
            <Marker key={gym.id} position={[gym.lat, gym.lng]} icon={gymIcon}>
              <Popup>
                <div className="min-w-40 font-sans">
                  <p className="text-[15px] font-semibold text-ink">{gym.name}</p>
                  <p className="mb-2 text-xs text-muted">{gym.location}</p>
                  <div className="mb-3 flex gap-1.5">
                    <Chip>{gym.climb_count} climbs</Chip>
                    <Chip tone={gym.is_active ? 'open' : 'closed'}>{gym.is_active ? 'Open' : 'Closed'}</Chip>
                  </div>
                  <button
                    onClick={() => navigate(`/gym/${gym.id}`)}
                    className="w-full cursor-pointer rounded-full bg-ink py-1.5 text-xs font-medium text-white"
                  >
                    View gym
                  </button>
                </div>
              </Popup>
            </Marker>
          ))}
        </MapContainer>
      </div>

      <p className="text-center text-sm text-muted">
        {geoError ?? (mappableGyms.length > 0
          ? `Showing ${mappableGyms.length} of ${gyms.length} gyms`
          : 'No gyms have map coordinates yet. Setters can add them when creating a gym.')}
      </p>
    </div>
  );
}

export default GymMap;

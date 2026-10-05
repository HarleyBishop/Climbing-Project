import { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import { QRCodeSVG } from 'qrcode.react';
import api from '../api';
import { isSetter, getDecodedToken } from '../auth';
import { PageShell } from '../components/ui/PageShell';
import { PageSkeleton } from '../components/Skeleton';
import { holdColour } from '../lib/holds';
import { cn } from '../lib/utils';
import {
  Card, Chip, Btn, SectionLabel, Field, Modal, Tabs, Toggle, Avatar, Stat, ProgressBar,
  Empty, ErrorText, ErrorScreen, inputClass,
} from '../components/ui/primitives';

const fmtDate = (iso) => new Date(iso).toLocaleDateString('en-AU', { day: 'numeric', month: 'short', year: 'numeric' });
const fmtDateTime = (iso) => new Date(iso).toLocaleString('en-AU', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });

// ─── Info tab ────────────────────────────────────────────────────────────────
function InfoTab({ comp, onRegister, registering, isSetterUser, registrationUrl }) {
  const [showQR, setShowQR] = useState(false);
  const [copied, setCopied] = useState(false);
  const svgRef = useRef(null);

  const handleCopy = () => {
    navigator.clipboard.writeText(registrationUrl).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  // Serialise the rendered QR <svg> and download it as a file.
  const handleDownload = () => {
    const svg = svgRef.current?.querySelector('svg');
    if (!svg) return;
    const blob = new Blob([new XMLSerializer().serializeToString(svg)], { type: 'image/svg+xml' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${comp.title.replace(/\s+/g, '-').toLowerCase()}-qr.svg`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-10">
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Stat value={comp.registration_count} label="Registered" />
        <Stat value={comp.comp_type === 'qualifier' ? 'Qual.' : 'Finals'} label="Format" />
        <Stat value={fmtDateTime(comp.start_date)} label="Opens" className="[&>p:first-child]:text-base" />
        <Stat value={fmtDateTime(comp.end_date)} label="Closes" className="[&>p:first-child]:text-base" />
      </div>

      {comp.top_x_advance && (
        <p className="rounded-2xl bg-info-soft px-5 py-4 text-info">Top {comp.top_x_advance} climbers advance to finals.</p>
      )}

      {comp.description && (
        <section>
          <SectionLabel>About</SectionLabel>
          <p className="text-lg leading-relaxed">{comp.description}</p>
        </section>
      )}

      {comp.rules && (
        <section>
          <SectionLabel>Rules</SectionLabel>
          <p className="leading-relaxed whitespace-pre-line text-muted">{comp.rules}</p>
        </section>
      )}

      {comp.divisions?.length > 0 && (
        <section>
          <SectionLabel>Divisions</SectionLabel>
          <div className="flex flex-wrap gap-2">
            {comp.divisions.map(d => <Chip key={d.id}>{d.name}</Chip>)}
          </div>
        </section>
      )}

      {comp.rounds?.length > 0 && (
        <section>
          <SectionLabel>Rounds</SectionLabel>
          <ol className="space-y-2">
            {comp.rounds.map((r, i) => (
              <li key={r.id} className="flex items-center gap-3">
                <span className="flex size-7 items-center justify-center rounded-full bg-accent-soft text-sm font-semibold text-accent">{i + 1}</span>
                {r.name}
              </li>
            ))}
          </ol>
        </section>
      )}

      {comp.status === 'closed' ? (
        <Empty>This competition has ended.</Empty>
      ) : comp.is_registered ? (
        <Card className="flex items-center gap-4 p-5">
          <span className="flex size-9 items-center justify-center rounded-full bg-good-soft text-good">✓</span>
          <p>You're registered. Head to Climbs to log your sends.</p>
        </Card>
      ) : (
        <Btn full variant="accent" onClick={onRegister} disabled={registering}>
          {registering ? 'Registering…' : 'Register for this competition'}
        </Btn>
      )}

      {isSetterUser && (
        <Card className="flex items-center justify-between gap-4 p-5">
          <div>
            <p className="font-medium">Registration QR code</p>
            <p className="text-sm text-muted">Let climbers scan to jump straight to registration</p>
          </div>
          <Btn size="sm" variant="ghost" onClick={() => setShowQR(true)}>Show QR</Btn>
        </Card>
      )}

      {showQR && (
        <Modal title="Registration QR code" subtitle={comp.title} onClose={() => setShowQR(false)}>
          <div ref={svgRef} className="flex justify-center">
            <QRCodeSVG value={registrationUrl} size={220} bgColor="#ffffff" fgColor="#1d1d1f" level="M" />
          </div>
          <p className="text-center text-xs break-all text-muted">{registrationUrl}</p>
          <div className="flex gap-3">
            <Btn full variant="ghost" onClick={handleDownload}>Save SVG</Btn>
            <Btn full onClick={handleCopy}>{copied ? 'Copied!' : 'Copy link'}</Btn>
          </div>
        </Modal>
      )}
    </div>
  );
}

// ─── Climbs tab ──────────────────────────────────────────────────────────────
function ClimbsTab({ comp, compClimbs, mySends, gymId, canEdit, onChange }) {
  const [showAddModal, setShowAddModal] = useState(false);
  const [gymClimbs, setGymClimbs] = useState([]);
  const [addSearch, setAddSearch] = useState('');
  const [pendingAdd, setPendingAdd] = useState(null);
  const [pendingPoints, setPendingPoints] = useState(100);
  const [adding, setAdding] = useState(false);
  const [addError, setAddError] = useState(null);

  const [logModal, setLogModal] = useState(null);
  const [logAttempts, setLogAttempts] = useState('');
  const [logging, setLogging] = useState(false);
  const [logError, setLogError] = useState(null);

  const alreadyInComp = new Set(compClimbs.map(cc => cc.climb));
  const mySendMap = Object.fromEntries(mySends.map(s => [s.comp_climb, s]));
  const canLog = comp.status === 'open' && comp.is_registered;

  const openAddModal = async () => {
    setAddError(null);
    setShowAddModal(true);
    if (gymClimbs.length === 0) {
      try {
        setGymClimbs((await api.get(`/api/gyms/${gymId}/all-climbs/`)).data);
      } catch { setAddError('Failed to load gym climbs.'); }
    }
  };

  const handleAdd = async () => {
    if (!pendingAdd) return;
    setAdding(true);
    setAddError(null);
    try {
      await api.post(`/api/competitions/${comp.id}/climbs/`, { climb: pendingAdd.id, points_value: pendingPoints });
      onChange();
      setShowAddModal(false);
      setPendingAdd(null);
      setPendingPoints(100);
    } catch (err) {
      setAddError(err.response?.data?.non_field_errors?.[0] || 'Failed to add climb.');
    } finally { setAdding(false); }
  };

  const handleRemove = async (compClimbId) => {
    try {
      await api.delete(`/api/competitions/${comp.id}/climbs/${compClimbId}/`);
      onChange();
    } catch { toast.error("Couldn't remove that climb."); }
  };

  const handleLogSend = async () => {
    setLogError(null);
    const att = parseInt(logAttempts);
    if (!att || att < 1) return setLogError('Enter a valid number of attempts.');
    setLogging(true);
    try {
      await api.post(`/api/competitions/${comp.id}/log-send/`, { comp_climb: logModal.id, attempts: att });
      onChange();
      setLogModal(null);
      setLogAttempts('');
    } catch (err) {
      setLogError(err.response?.data?.detail || 'Failed to log send.');
    } finally { setLogging(false); }
  };

  const search = addSearch.toLowerCase();
  const filtered = gymClimbs.filter(c =>
    !alreadyInComp.has(c.id) &&
    (c.name.toLowerCase().includes(search) || c.wall_name?.toLowerCase().includes(search))
  );

  return (
    <div>
      {canEdit && (
        <div className="mb-4 flex justify-end">
          <Btn size="sm" onClick={openAddModal}>Add climb</Btn>
        </div>
      )}

      {compClimbs.length === 0 && <Empty>No climbs added yet.</Empty>}
      <div className="space-y-3">
        {compClimbs.map(cc => {
          const mySend = mySendMap[cc.id];
          return (
            <Card key={cc.id} className="flex items-center gap-4 p-4">
              <span className="flex size-11 shrink-0 items-center justify-center rounded-xl text-sm font-semibold text-white" style={{ background: holdColour(cc.climb_colour) }}>
                V{cc.climb_grade}
              </span>
              <div className="min-w-0 flex-1">
                <p className="truncate font-semibold">{cc.climb_name}</p>
                <p className="text-sm text-muted">{cc.wall_name} · {cc.points_value} pts</p>
              </div>
              {mySend ? (
                <Chip tone="open">✓ {mySend.attempts} att.</Chip>
              ) : canLog && (
                <Btn size="sm" variant="accent" onClick={() => { setLogModal(cc); setLogAttempts(''); setLogError(null); }}>Log send</Btn>
              )}
              {canEdit && (
                <button onClick={() => handleRemove(cc.id)} title="Remove" className="cursor-pointer px-1 text-faint hover:text-danger">✕</button>
              )}
            </Card>
          );
        })}
      </div>

      {!comp.is_registered && comp.status === 'open' && (
        <p className="mt-6 text-center text-sm text-muted">Register on the Info tab to log your sends.</p>
      )}

      {logModal && (
        <Modal title="Log comp send" subtitle={`${logModal.climb_name} · ${logModal.points_value} pts`} onClose={() => setLogModal(null)}>
          {logError && <ErrorText>{logError}</ErrorText>}
          <Field label="Attempts" value={logAttempts} onChange={setLogAttempts} placeholder="e.g. 3" type="number" />
          <div className="flex gap-3">
            <Btn full variant="ghost" onClick={() => setLogModal(null)}>Cancel</Btn>
            <Btn full onClick={handleLogSend} disabled={logging}>{logging ? 'Saving…' : 'Save'}</Btn>
          </div>
        </Modal>
      )}

      {showAddModal && (
        <Modal title="Add climb" subtitle="Pick a climb from the gym" onClose={() => setShowAddModal(false)}>
          {addError && <ErrorText>{addError}</ErrorText>}
          {pendingAdd ? (
            <>
              <p>Adding <strong>{pendingAdd.name}</strong> (V{pendingAdd.suggested_grade})</p>
              <Field label="Points value" value={String(pendingPoints)} onChange={v => setPendingPoints(parseInt(v) || 100)} type="number" />
              <div className="flex gap-3">
                <Btn full variant="ghost" onClick={() => setPendingAdd(null)}>Back</Btn>
                <Btn full onClick={handleAdd} disabled={adding}>{adding ? 'Adding…' : 'Confirm'}</Btn>
              </div>
            </>
          ) : (
            <>
              <input type="search" placeholder="Search climbs" value={addSearch} onChange={e => setAddSearch(e.target.value)} className={inputClass} />
              <div className="-mx-2 max-h-64 overflow-y-auto">
                {filtered.length === 0 && <Empty className="py-6">No climbs available.</Empty>}
                {filtered.map(c => (
                  <button key={c.id} onClick={() => setPendingAdd(c)} className="flex w-full cursor-pointer items-center gap-3 rounded-xl p-2 text-left hover:bg-surface">
                    <span className="size-8 shrink-0 rounded-lg" style={{ background: holdColour(c.colour) }} />
                    <span className="min-w-0">
                      <span className="block truncate font-medium">{c.name}</span>
                      <span className="block text-xs text-muted">{c.wall_name} · V{c.suggested_grade}</span>
                    </span>
                  </button>
                ))}
              </div>
            </>
          )}
        </Modal>
      )}
    </div>
  );
}

// ─── Qualifier leaderboard ───────────────────────────────────────────────────
// Polls every 30s so the board stays live during an event.
function QualifierLeaderboard({ compId, currentUserId }) {
  const navigate = useNavigate();
  const [rankings, setRankings] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchRankings = useCallback(async () => {
    try {
      setRankings((await api.get(`/api/competitions/${compId}/leaderboard/`)).data);
    } catch { /* keep showing the last good data */ }
    finally { setLoading(false); }
  }, [compId]);

  useEffect(() => {
    fetchRankings();
    const id = setInterval(fetchRankings, 30000);
    return () => clearInterval(id);
  }, [fetchRankings]);

  if (loading) return <Empty>Loading…</Empty>;
  if (rankings.length === 0) return <Empty>No sends logged yet.</Empty>;

  const maxPts = rankings[0]?.points || 1;
  return (
    <div className="space-y-2">
      {rankings.map(entry => {
        const isMe = entry.user_id === currentUserId;
        return (
          <Card key={entry.user_id} onClick={() => navigate(`/profile/${entry.user_id}`)} className={cn('flex items-center gap-4 px-5 py-3', isMe && 'ring-2 ring-accent')}>
            <span className="w-6 text-center font-semibold text-faint">{entry.rank}</span>
            <Avatar name={entry.username} size={32} />
            <div className="min-w-0 flex-1">
              <div className="mb-1.5 flex items-center gap-2">
                <span className="truncate text-sm font-semibold">@{entry.username}</span>
                {isMe && <Chip tone="you">You</Chip>}
                {entry.advances && <Chip tone="advances">Advances</Chip>}
              </div>
              <ProgressBar pct={Math.round((entry.points / maxPts) * 100)} />
            </div>
            <div className="text-right">
              <p className="text-sm font-semibold">{entry.points} pts</p>
              <p className="text-xs text-muted">{entry.climbs_completed} climbs · {entry.total_attempts} att.</p>
            </div>
          </Card>
        );
      })}
    </div>
  );
}

// ─── Finals tab ──────────────────────────────────────────────────────────────
const EMPTY_RESULT = { topped: false, top_attempts: '', zoned: false, zone_attempts: '' };

function FinalsTab({ comp, compClimbs, registrations, isSetterUser, currentUserId }) {
  const navigate = useNavigate();
  const [results, setResults] = useState([]);
  const [leaderboard, setLeaderboard] = useState([]);
  const [loadingResults, setLoadingResults] = useState(true);
  const [judgingClimb, setJudgingClimb] = useState(null);
  const [judgeForm, setJudgeForm] = useState({});
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState(null);

  const refresh = useCallback(async () => {
    try {
      const [resultsRes, boardRes] = await Promise.all([
        api.get(`/api/competitions/${comp.id}/finals-results/`),
        api.get(`/api/competitions/${comp.id}/finals-leaderboard/`),
      ]);
      setResults(resultsRes.data);
      setLeaderboard(boardRes.data);
    } catch { /* keep showing the last good data */ }
    finally { setLoadingResults(false); }
  }, [comp.id]);

  useEffect(() => {
    refresh();
    const id = setInterval(refresh, 30000);
    return () => clearInterval(id);
  }, [refresh]);

  const openJudging = (cc) => {
    const existing = {};
    registrations.forEach(reg => {
      existing[reg.user] = results.find(r => r.comp_climb === cc.id && r.user === reg.user) || EMPTY_RESULT;
    });
    setJudgeForm(existing);
    setJudgingClimb(cc);
    setSaveError(null);
  };

  const updateForm = (userId, patch) => setJudgeForm(prev => ({ ...prev, [userId]: { ...prev[userId], ...patch } }));

  const saveResult = async (userId) => {
    setSaving(true);
    setSaveError(null);
    const f = judgeForm[userId];
    try {
      await api.post(`/api/competitions/${comp.id}/finals-results/`, {
        comp_climb: judgingClimb.id,
        user: userId,
        topped: f.topped,
        top_attempts: f.topped ? (parseInt(f.top_attempts) || null) : null,
        zoned: f.zoned,
        zone_attempts: f.zoned ? (parseInt(f.zone_attempts) || null) : null,
      });
      await refresh();
    } catch (err) {
      setSaveError(err.response?.data?.detail || 'Failed to save result.');
    } finally { setSaving(false); }
  };

  return (
    <div>
      {leaderboard.length === 0 && !loadingResults && <Empty>No results recorded yet.</Empty>}
      {leaderboard.length > 0 && (
        <Card className="mb-12 overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-surface text-xs text-muted">
              <tr>
                <th className="px-5 py-3 text-left font-medium">#</th>
                <th className="py-3 text-left font-medium">Climber</th>
                <th className="py-3 font-medium">Tops</th>
                <th className="py-3 font-medium">Zones</th>
                <th className="px-5 py-3 font-medium">Att.</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {leaderboard.map(e => (
                <tr key={e.user_id} onClick={() => navigate(`/profile/${e.user_id}`)} className={cn('cursor-pointer hover:bg-surface', e.user_id === currentUserId && 'bg-accent-soft/50')}>
                  <td className="px-5 py-3 font-semibold text-faint">{e.rank}</td>
                  <td className="py-3 font-semibold">@{e.username}</td>
                  <td className="py-3 text-center font-semibold">{e.tops}<span className="text-xs font-normal text-faint"> / {e.top_attempts}a</span></td>
                  <td className="py-3 text-center">{e.zones}<span className="text-xs text-faint"> / {e.zone_attempts}a</span></td>
                  <td className="px-5 py-3 text-center text-muted">{e.top_attempts + e.zone_attempts}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      )}

      {isSetterUser && (
        <section>
          <SectionLabel>Judging panel</SectionLabel>
          {saveError && <ErrorText>{saveError}</ErrorText>}
          {compClimbs.length === 0 && <Empty>No climbs added yet.</Empty>}
          <div className="mb-6 space-y-2">
            {compClimbs.map(cc => (
              <button
                key={cc.id}
                type="button"
                onClick={() => openJudging(cc)}
                className={cn(
                  'flex w-full cursor-pointer items-center justify-between rounded-2xl bg-white px-5 py-4 text-left ring-1 transition',
                  judgingClimb?.id === cc.id ? 'ring-2 ring-accent' : 'ring-line hover:bg-surface'
                )}
              >
                <span>
                  <span className="block font-semibold">{cc.climb_name}</span>
                  <span className="block text-sm text-muted">{cc.wall_name} · V{cc.climb_grade}</span>
                </span>
                <span className="text-sm text-muted">
                  {results.filter(r => r.comp_climb === cc.id).length}/{registrations.length} judged
                </span>
              </button>
            ))}
          </div>

          {judgingClimb && registrations.length > 0 && (
            <Card className="divide-y divide-line">
              <p className="p-5 font-semibold">{judgingClimb.climb_name}: results per climber</p>
              {registrations.map(reg => {
                const f = judgeForm[reg.user] || EMPTY_RESULT;
                return (
                  <div key={reg.user} className="space-y-4 p-5">
                    <div className="flex items-center justify-between">
                      <p className="font-medium">@{reg.username}</p>
                      <Btn size="sm" onClick={() => saveResult(reg.user)} disabled={saving}>{saving ? '…' : 'Save'}</Btn>
                    </div>
                    <div className="grid grid-cols-2 items-end gap-4">
                      <label className="flex items-center gap-3 text-sm">
                        <Toggle on={f.topped} onChange={v => updateForm(reg.user, { topped: v })} /> Topped
                      </label>
                      {f.topped ? <Field label="Top attempts" value={f.top_attempts} type="number" onChange={v => updateForm(reg.user, { top_attempts: v })} /> : <span />}
                      <label className="flex items-center gap-3 text-sm">
                        <Toggle on={f.zoned} onChange={v => updateForm(reg.user, { zoned: v })} /> Zoned
                      </label>
                      {f.zoned && <Field label="Zone attempts" value={f.zone_attempts} type="number" onChange={v => updateForm(reg.user, { zone_attempts: v })} />}
                    </div>
                  </div>
                );
              })}
            </Card>
          )}
        </section>
      )}
    </div>
  );
}

// ─── Page ────────────────────────────────────────────────────────────────────
function CompetitionPage() {
  const { gymId, compId } = useParams();
  const currentUserId = getDecodedToken()?.user_id;
  const isSetterUser = isSetter();

  const [comp, setComp] = useState(null);
  const [compClimbs, setCompClimbs] = useState([]);
  const [registrations, setRegistrations] = useState([]);
  const [mySends, setMySends] = useState([]);
  const [activeTab, setActiveTab] = useState('info');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [registering, setRegistering] = useState(false);

  const fetchComp = useCallback(async () => {
    setComp((await api.get(`/api/competitions/${compId}/`)).data);
  }, [compId]);

  const fetchClimbs = useCallback(async () => {
    const [climbsRes, sendsRes] = await Promise.all([
      api.get(`/api/competitions/${compId}/climbs/`),
      api.get(`/api/competitions/${compId}/sends/`),
    ]);
    setCompClimbs(climbsRes.data);
    setMySends(sendsRes.data);
  }, [compId]);

  const fetchRegistrations = useCallback(async () => {
    setRegistrations((await api.get(`/api/competitions/${compId}/registrations/`)).data);
  }, [compId]);

  useEffect(() => {
    setLoading(true);
    setError(null);
    Promise.all([fetchComp(), fetchClimbs(), fetchRegistrations()])
      .catch(() => setError('Failed to load competition.'))
      .finally(() => setLoading(false));
  }, [fetchComp, fetchClimbs, fetchRegistrations]);

  const handleRegister = async () => {
    setRegistering(true);
    try {
      await api.post(`/api/competitions/${compId}/register/`, {});
      await Promise.all([fetchComp(), fetchRegistrations()]);
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Registration failed.');
    } finally { setRegistering(false); }
  };

  if (loading) return <PageSkeleton />;
  if (error || !comp) return <ErrorScreen message={error || 'Competition not found.'} onRetry={() => window.location.reload()} />;

  const isQualifier = comp.comp_type === 'qualifier';
  const tabs = [
    { key: 'info', label: 'Info' },
    { key: 'climbs', label: `Climbs · ${compClimbs.length}` },
    { key: 'leaderboard', label: isQualifier ? 'Leaderboard' : 'Results' },
  ];
  const status = comp.status === 'open' ? 'Live now' : comp.status.charAt(0).toUpperCase() + comp.status.slice(1);
  const registrationUrl = `${window.location.origin}/gym/${gymId}/competitions/${compId}`;

  return (
    <PageShell
      back backLabel="Competitions" backPath={`/gym/${gymId}/competitions`}
      eyebrow={`${isQualifier ? 'Qualifier' : 'Finals'} · ${status}`}
      title={comp.title}
      right={<p className="mt-3 text-muted">{fmtDate(comp.start_date)} – {fmtDate(comp.end_date)}</p>}
    >
      <Tabs tabs={tabs} active={activeTab} onChange={setActiveTab} />

      {activeTab === 'info' && (
        <InfoTab comp={comp} onRegister={handleRegister} registering={registering} isSetterUser={isSetterUser} registrationUrl={registrationUrl} />
      )}
      {activeTab === 'climbs' && (
        <ClimbsTab comp={comp} compClimbs={compClimbs} mySends={mySends} gymId={gymId} canEdit={isSetterUser} onChange={fetchClimbs} />
      )}
      {activeTab === 'leaderboard' && (isQualifier
        ? <QualifierLeaderboard compId={compId} currentUserId={currentUserId} />
        : <FinalsTab comp={comp} compClimbs={compClimbs} registrations={registrations} isSetterUser={isSetterUser} currentUserId={currentUserId} />
      )}
    </PageShell>
  );
}

export default CompetitionPage;

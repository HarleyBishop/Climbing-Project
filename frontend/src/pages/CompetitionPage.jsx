import { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { jwtDecode } from 'jwt-decode';
import api from '../api';
import { PageShell } from '../components/ui/PageShell';
import { isSetter, getDecodedToken } from '../auth';
import { PageSkeleton } from '../components/Skeleton';
import toast from 'react-hot-toast';
import { HOLD } from '../theme';
import { Card, Chip, Btn, Eyebrow, Divider, Field, Modal, Tabs, Toggle, ErrorScreen } from '../components/ui/primitives';
import { QRCodeSVG } from 'qrcode.react';

function fmtDate(iso) {
  return new Date(iso).toLocaleDateString('en-AU', { day: 'numeric', month: 'short', year: 'numeric' });
}
function fmtDateTime(iso) {
  return new Date(iso).toLocaleString('en-AU', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });
}

// ─── Info tab ────────────────────────────────────────────────────────────────
function InfoTab({ comp, isRegistered, onRegister, registering, isSetterUser, registrationUrl }) {
  const [showQR, setShowQR] = useState(false);
  const [copied, setCopied] = useState(false);
  const svgRef = useRef(null);

  const handleCopy = () => {
    navigator.clipboard.writeText(registrationUrl).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  const handleDownload = () => {
    const svg = svgRef.current?.querySelector('svg');
    if (!svg) return;
    const serialised = new XMLSerializer().serializeToString(svg);
    const blob = new Blob([serialised], { type: 'image/svg+xml' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${comp.title.replace(/\s+/g, '-').toLowerCase()}-qr.svg`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div>
      <div className="grid grid-cols-2 gap-[10px] mb-[18px]">
        {[
          { l: 'Opens', v: fmtDateTime(comp.start_date) },
          { l: 'Closes', v: fmtDateTime(comp.end_date) },
          { l: 'Registered', v: comp.registration_count },
          { l: 'Type', v: comp.comp_type === 'qualifier' ? 'Qualifier' : 'Finals' },
        ].map(s => (
          <div key={s.l} className="bg-card border border-line rounded-[12px] px-[14px] py-3 text-center">
            <p className="font-display font-normal text-[17px] m-0 text-ink">{s.v}</p>
            <p className="font-body font-semibold text-[9.5px] tracking-[0.08em] uppercase text-ink2 mt-1 mb-0">{s.l}</p>
          </div>
        ))}
      </div>

      {comp.top_x_advance && (
        <div className="bg-info-bg rounded-[12px] px-[14px] py-[11px] mb-[18px] font-serif italic text-sm text-info">
          Top {comp.top_x_advance} climbers advance to finals.
        </div>
      )}

      {comp.description && (
        <div className="mb-[18px]">
          <Eyebrow style={{ marginBottom: 8 }}>About</Eyebrow>
          <p className="font-serif italic text-[15px] leading-[1.5] text-ink m-0">{comp.description}</p>
        </div>
      )}

      {comp.rules && (
        <div className="mb-[18px]">
          <Eyebrow style={{ marginBottom: 8 }}>Rules</Eyebrow>
          <p className="font-serif italic text-sm leading-[1.6] text-ink m-0 whitespace-pre-line">{comp.rules}</p>
        </div>
      )}

      {comp.divisions?.length > 0 && (
        <div className="mb-[18px]">
          <Eyebrow style={{ marginBottom: 10 }}>Divisions</Eyebrow>
          <div className="flex gap-[7px] flex-wrap">
            {comp.divisions.map(d => <Chip key={d.id} tone="soft">{d.name}</Chip>)}
          </div>
        </div>
      )}

      {comp.rounds?.length > 0 && (
        <div className="mb-[22px]">
          <Eyebrow style={{ marginBottom: 10 }}>Rounds</Eyebrow>
          <div className="flex flex-col gap-2">
            {comp.rounds.map((r, i) => (
              <div key={r.id} className="flex items-center gap-[10px]">
                <span className="w-[22px] h-[22px] rounded-full bg-primary-soft text-primary-d font-body font-bold text-[11px] flex items-center justify-center shrink-0">{i + 1}</span>
                <span className="font-serif italic text-[14.5px]">{r.name}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      <Divider m={6} />
      <div className="mt-[18px]">
        {comp.status === 'closed' ? (
          <p className="font-serif italic text-sm text-ink3 text-center py-4">This competition has ended.</p>
        ) : isRegistered ? (
          <Card style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '13px 15px', background: 'var(--good-bg)', borderColor: 'transparent' }}>
            <span className="text-good text-[17px]">✓</span>
            <p className="flex-1 font-serif italic text-sm text-good m-0">You're registered — head to Climbs to log your sends.</p>
          </Card>
        ) : (
          <Btn full onClick={onRegister} disabled={registering}>
            {registering ? 'Registering…' : 'Register for this competition'}
          </Btn>
        )}
      </div>

      {isSetterUser && (
        <div className="mt-6">
          <Divider m={0} />
          <div className="mt-[18px] flex items-center justify-between">
            <div>
              <p className="font-body font-bold text-[12.5px] text-ink m-0">Registration QR code</p>
              <p className="font-serif italic text-[12.5px] text-ink3 mt-[2px] mb-0">Let climbers scan to jump straight to registration</p>
            </div>
            <Btn size="sm" variant="ghost" onClick={() => setShowQR(true)}>Show QR</Btn>
          </div>
        </div>
      )}

      {showQR && (
        <Modal title="Registration QR code" subtitle={comp.title} onClose={() => setShowQR(false)}>
          <div ref={svgRef} className="flex justify-center py-2 pb-5">
            <QRCodeSVG value={registrationUrl} size={220} bgColor="#ffffff" fgColor="#2a2a1e" level="M" style={{ borderRadius: 12 }} />
          </div>
          <p className="font-body text-[11.5px] text-ink3 text-center m-0 mb-4 break-all">{registrationUrl}</p>
          <div className="flex gap-[10px]">
            <Btn full onClick={handleCopy}>{copied ? 'Copied!' : 'Copy link'}</Btn>
            <Btn full variant="ghost" onClick={handleDownload}>Save SVG</Btn>
          </div>
        </Modal>
      )}
    </div>
  );
}

// ─── Climbs tab ──────────────────────────────────────────────────────────────
function ClimbsTab({ comp, compClimbs, mySends, gymId, canEdit, onSendLogged, onClimbRemoved }) {
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
        const res = await api.get(`/api/gyms/${gymId}/all-climbs/`);
        setGymClimbs(res.data);
      } catch { setAddError('Failed to load gym climbs.'); }
    }
  };

  const handleAdd = async () => {
    if (!pendingAdd) return;
    setAdding(true);
    setAddError(null);
    try {
      await api.post(`/api/competitions/${comp.id}/climbs/`, { climb: pendingAdd.id, points_value: pendingPoints });
      onClimbRemoved();
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
      onClimbRemoved();
    } catch {}
  };

  const handleLogSend = async () => {
    setLogError(null);
    const att = parseInt(logAttempts);
    if (!att || att < 1) return setLogError('Enter a valid number of attempts.');
    setLogging(true);
    try {
      await api.post(`/api/competitions/${comp.id}/log-send/`, { comp_climb: logModal.id, attempts: att });
      onSendLogged();
      setLogModal(null);
      setLogAttempts('');
    } catch (err) {
      setLogError(err.response?.data?.detail || 'Failed to log send.');
    } finally { setLogging(false); }
  };

  const filtered = gymClimbs.filter(c =>
    !alreadyInComp.has(c.id) &&
    (c.name.toLowerCase().includes(addSearch.toLowerCase()) ||
     c.wall_name?.toLowerCase().includes(addSearch.toLowerCase()))
  );

  return (
    <div>
      {canEdit && (
        <div className="flex justify-end mb-[14px]">
          <Btn size="sm" onClick={openAddModal}>+ Add climb</Btn>
        </div>
      )}

      {compClimbs.length === 0 ? (
        <p className="font-serif italic text-sm text-ink3 text-center py-12">No climbs added yet.</p>
      ) : (
        <div className="flex flex-col gap-[11px]">
          {compClimbs.map(cc => {
            const colour = HOLD[cc.climb_colour] || '#cd6f3f';
            const mySend = mySendMap[cc.id];
            return (
              <Card key={cc.id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '11px 13px' }}>
                <div className="w-10 h-10 rounded-[10px] shrink-0 flex items-center justify-center font-body font-bold text-[12.5px] text-white" style={{ background: colour }}>
                  V{cc.climb_grade}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-display font-normal text-base m-0 text-ink leading-[1.1]">{cc.climb_name}</p>
                  <p className="font-body text-[11.5px] text-ink2 mt-[3px] mb-0">{cc.wall_name} · {cc.points_value} pts</p>
                </div>
                {mySend ? (
                  <Chip tone="open">✓ {mySend.attempts} att.</Chip>
                ) : canLog ? (
                  <Btn size="sm" onClick={() => { setLogModal(cc); setLogAttempts(''); setLogError(null); }}>Log send</Btn>
                ) : null}
                {canEdit && (
                  <button onClick={() => handleRemove(cc.id)} className="bg-transparent border-0 cursor-pointer text-[15px] text-ink3 ml-1">✕</button>
                )}
              </Card>
            );
          })}
        </div>
      )}

      {!comp.is_registered && comp.status === 'open' && (
        <p className="font-serif italic text-[13px] text-ink3 text-center mt-4">
          Register on the Info tab to log your sends.
        </p>
      )}

      {logModal && (
        <Modal title="Log comp send" subtitle={`${logModal.climb_name} · ${logModal.points_value} pts`} onClose={() => setLogModal(null)}>
          {logError && <p className="font-serif italic text-danger text-[13px] mb-[10px]">{logError}</p>}
          <Field label="Attempts" value={logAttempts} onChange={setLogAttempts} placeholder="e.g. 3" type="number" />
          <div className="flex gap-[10px]">
            <Btn full onClick={handleLogSend} disabled={logging}>{logging ? 'Saving…' : 'Save'}</Btn>
            <Btn full variant="ghost" onClick={() => setLogModal(null)}>Cancel</Btn>
          </div>
        </Modal>
      )}

      {showAddModal && (
        <Modal title="Add climb" subtitle="Pick a climb from the gym" onClose={() => setShowAddModal(false)}>
          {addError && <p className="font-serif italic text-danger text-[13px] mb-[10px]">{addError}</p>}
          {pendingAdd ? (
            <div>
              <p className="font-serif italic text-sm mb-[14px]">
                Adding <strong>{pendingAdd.name}</strong> (V{pendingAdd.suggested_grade})
              </p>
              <Field label="Points value" value={String(pendingPoints)} onChange={v => setPendingPoints(parseInt(v) || 100)} type="number" />
              <div className="flex gap-[10px]">
                <Btn full onClick={handleAdd} disabled={adding}>{adding ? 'Adding…' : 'Confirm'}</Btn>
                <Btn full variant="ghost" onClick={() => setPendingAdd(null)}>Back</Btn>
              </div>
            </div>
          ) : (
            <>
              <input
                type="text"
                placeholder="Search climbs…"
                value={addSearch}
                onChange={e => setAddSearch(e.target.value)}
                className="w-full bg-card border border-line rounded-[11px] px-[14px] py-[10px] font-body text-sm text-ink outline-none box-border mb-3"
              />
              <div style={{ maxHeight: 240, overflowY: 'auto' }}>
                {filtered.length === 0 ? (
                  <p className="font-serif italic text-sm text-ink3 text-center py-4">No climbs available.</p>
                ) : filtered.map(c => (
                  <div
                    key={c.id}
                    onClick={() => setPendingAdd(c)}
                    className="flex items-center gap-3 px-1 py-[9px] rounded-[10px] cursor-pointer mb-1"
                  >
                    <div className="w-8 h-8 rounded-2 shrink-0 rounded-lg" style={{ background: HOLD[c.colour] || '#cd6f3f' }} />
                    <div className="flex-1 min-w-0">
                      <p className="font-display text-[15px] m-0 text-ink">{c.name}</p>
                      <p className="font-body text-[11.5px] text-ink2 mt-[2px] mb-0">{c.wall_name} · V{c.suggested_grade}</p>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </Modal>
      )}
    </div>
  );
}

// ─── Qualifier leaderboard ────────────────────────────────────────────────────
function QualifierLeaderboard({ compId, currentUserId }) {
  const navigate = useNavigate();
  const [rankings, setRankings] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetch = useCallback(async () => {
    try {
      const res = await api.get(`/api/competitions/${compId}/leaderboard/`);
      setRankings(res.data);
    } catch {} finally { setLoading(false); }
  }, [compId]);

  useEffect(() => {
    fetch();
    const id = setInterval(fetch, 30000);
    return () => clearInterval(id);
  }, [fetch]);

  const rankColour = (n) => n === 1 ? 'var(--primary)' : n === 2 ? 'var(--ink2)' : n === 3 ? 'var(--accent)' : 'var(--ink3)';
  const maxPts = rankings[0]?.points || 1;

  if (loading) return <p className="font-serif italic text-ink3 text-sm text-center py-8">Loading…</p>;
  if (rankings.length === 0) return <p className="font-serif italic text-ink3 text-sm text-center py-8">No sends logged yet.</p>;

  return (
    <div className="flex flex-col gap-[9px]">
      {rankings.map(entry => {
        const isMe = entry.user_id === currentUserId;
        const bar = Math.round((entry.points / maxPts) * 100);
        return (
          <Card
            key={entry.user_id}
            hover
            onClick={() => navigate(`/profile/${entry.user_id}`)}
            style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '11px 14px', border: isMe ? `2px solid var(--primary)` : `1px solid var(--line)` }}
          >
            <span className="font-display text-lg min-w-[22px] text-center" style={{ color: rankColour(entry.rank) }}>{entry.rank}</span>
            <div className="w-[30px] h-[30px] rounded-full bg-line-soft border border-line flex items-center justify-center font-body font-bold text-[11px] text-ink shrink-0">
              {entry.username?.slice(0, 2).toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-[7px] mb-[6px]">
                <span className="font-body font-bold text-[13px] text-ink">@{entry.username}</span>
                {isMe && <Chip tone="you">You</Chip>}
                {entry.advances && <Chip tone="advances">Advances</Chip>}
              </div>
              <div className="h-[6px] bg-line-soft rounded-full overflow-hidden">
                <div className="h-full rounded-full bg-primary" style={{ width: `${bar}%` }} />
              </div>
            </div>
            <div className="text-right shrink-0">
              <p className="font-body font-bold text-[12.5px] text-ink m-0">{entry.points} pts</p>
              <p className="font-body text-[10.5px] text-ink2 mt-[2px] mb-0">{entry.climbs_completed} climbs · {entry.total_attempts} att.</p>
            </div>
          </Card>
        );
      })}
    </div>
  );
}

// ─── Finals tab ───────────────────────────────────────────────────────────────
function FinalsTab({ comp, compClimbs, registrations, isSetterUser, currentUserId }) {
  const navigate = useNavigate();
  const [results, setResults] = useState([]);
  const [loadingResults, setLoadingResults] = useState(true);
  const [judgingClimb, setJudgingClimb] = useState(null);
  const [judgeForm, setJudgeForm] = useState({});
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState(null);

  const fetchResults = useCallback(async () => {
    try {
      const res = await api.get(`/api/competitions/${comp.id}/finals-results/`);
      setResults(res.data);
    } catch {} finally { setLoadingResults(false); }
  }, [comp.id]);

  const fetchLeaderboard = useCallback(async () => {
    try {
      const res = await api.get(`/api/competitions/${comp.id}/finals-leaderboard/`);
      return res.data;
    } catch { return []; }
  }, [comp.id]);

  const [leaderboard, setLeaderboard] = useState([]);
  useEffect(() => {
    fetchResults();
    fetchLeaderboard().then(setLeaderboard);
    const id = setInterval(() => {
      fetchResults();
      fetchLeaderboard().then(setLeaderboard);
    }, 30000);
    return () => clearInterval(id);
  }, [fetchResults, fetchLeaderboard]);

  const openJudging = (cc) => {
    const existing = {};
    registrations.forEach(reg => {
      const result = results.find(r => r.comp_climb === cc.id && r.user === reg.user);
      existing[reg.user] = result || { topped: false, top_attempts: '', zoned: false, zone_attempts: '' };
    });
    setJudgeForm(existing);
    setJudgingClimb(cc);
    setSaveError(null);
  };

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
      await fetchResults();
      fetchLeaderboard().then(setLeaderboard);
    } catch (err) {
      setSaveError(err.response?.data?.detail || 'Failed to save result.');
    } finally { setSaving(false); }
  };

  const rankColour = (n) => n === 1 ? 'var(--primary)' : n === 2 ? 'var(--ink2)' : n === 3 ? 'var(--accent)' : 'var(--ink3)';

  return (
    <div>
      {leaderboard.length > 0 && (
        <div className="mb-6">
          <Eyebrow style={{ marginBottom: 12 }}>Results</Eyebrow>
          <Card style={{ overflow: 'hidden' }}>
            <div className="grid px-[14px] py-2 bg-line-soft" style={{ gridTemplateColumns: 'auto 1fr auto auto auto', gap: '0 12px' }}>
              {['#', 'Climber', 'Tops', 'Zones', 'Att.'].map(h => (
                <span key={h} className="font-body font-bold text-[10px] tracking-[0.14em] uppercase text-ink2">{h}</span>
              ))}
            </div>
            {leaderboard.map(e => (
              <div
                key={e.user_id}
                onClick={() => navigate(`/profile/${e.user_id}`)}
                className="grid px-[14px] py-[10px] cursor-pointer items-center"
                style={{ gridTemplateColumns: 'auto 1fr auto auto auto', gap: '0 12px', borderTop: `1px solid var(--line)`, background: e.user_id === currentUserId ? 'var(--line-soft)' : 'transparent' }}
              >
                <span className="font-display text-base min-w-5" style={{ color: rankColour(e.rank) }}>{e.rank}</span>
                <span className="font-body font-bold text-[13px] text-ink truncate">@{e.username}</span>
                <span className="font-body font-bold text-[13px] text-ink text-center">{e.tops}<span className="font-body text-[10px] text-ink3">/{e.top_attempts}a</span></span>
                <span className="font-body font-bold text-[13px] text-ink2 text-center">{e.zones}<span className="font-body text-[10px] text-ink3">/{e.zone_attempts}a</span></span>
                <span className="font-body text-[11px] text-ink3 text-center">{e.top_attempts + e.zone_attempts}</span>
              </div>
            ))}
          </Card>
        </div>
      )}

      {leaderboard.length === 0 && !loadingResults && (
        <p className="font-serif italic text-sm text-ink3 text-center py-8">No results recorded yet.</p>
      )}

      {isSetterUser && (
        <div>
          <Divider />
          <Eyebrow style={{ margin: '20px 0 12px' }}>Judging panel</Eyebrow>
          {saveError && <p className="font-serif italic text-danger text-[13px] mb-3">{saveError}</p>}

          {compClimbs.length === 0 ? (
            <p className="font-serif italic text-sm text-ink3">No climbs added yet.</p>
          ) : (
            <div className="flex flex-col gap-2 mb-4">
              {compClimbs.map(cc => (
                <button
                  key={cc.id}
                  type="button"
                  onClick={() => openJudging(cc)}
                  className="flex items-center justify-between px-[14px] py-3 rounded-[12px] cursor-pointer text-left border transition-colors duration-150"
                  style={{ border: `1px solid ${judgingClimb?.id === cc.id ? 'var(--primary)' : 'var(--line)'}`, background: judgingClimb?.id === cc.id ? 'var(--line-soft)' : 'var(--card)' }}
                >
                  <div>
                    <p className="font-display text-[15px] m-0 text-ink">{cc.climb_name}</p>
                    <p className="font-body text-[11.5px] text-ink2 mt-[2px] mb-0">{cc.wall_name} · V{cc.climb_grade}</p>
                  </div>
                  <span className="font-body text-[11.5px] text-ink2">
                    {results.filter(r => r.comp_climb === cc.id).length}/{registrations.length} judged
                  </span>
                </button>
              ))}
            </div>
          )}

          {judgingClimb && registrations.length > 0 && (
            <Card style={{ padding: 16 }}>
              <p className="font-display text-base text-ink mb-4">
                {judgingClimb.climb_name} — enter results per climber
              </p>
              {registrations.map(reg => {
                const f = judgeForm[reg.user] || { topped: false, top_attempts: '', zoned: false, zone_attempts: '' };
                return (
                  <div key={reg.user} className="pb-4 mb-4" style={{ borderBottom: `1px solid var(--line)` }}>
                    <div className="flex items-center justify-between mb-3">
                      <p className="font-display text-[15px] text-ink m-0">@{reg.username}</p>
                      <Btn size="sm" onClick={() => saveResult(reg.user)} disabled={saving}>{saving ? '…' : 'Save'}</Btn>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="flex items-center gap-2">
                        <Toggle on={f.topped} onChange={v => setJudgeForm(prev => ({ ...prev, [reg.user]: { ...prev[reg.user], topped: v } }))} />
                        <span className="font-body text-[13px] text-ink">Topped</span>
                      </div>
                      {f.topped && (
                        <Field label="Top attempts" value={f.top_attempts} type="number"
                          onChange={v => setJudgeForm(prev => ({ ...prev, [reg.user]: { ...prev[reg.user], top_attempts: v } }))}
                          style={{ marginBottom: 0 }} />
                      )}
                      <div className="flex items-center gap-2">
                        <Toggle on={f.zoned} onChange={v => setJudgeForm(prev => ({ ...prev, [reg.user]: { ...prev[reg.user], zoned: v } }))} />
                        <span className="font-body text-[13px] text-ink">Zoned</span>
                      </div>
                      {f.zoned && (
                        <Field label="Zone attempts" value={f.zone_attempts} type="number"
                          onChange={v => setJudgeForm(prev => ({ ...prev, [reg.user]: { ...prev[reg.user], zone_attempts: v } }))}
                          style={{ marginBottom: 0 }} />
                      )}
                    </div>
                  </div>
                );
              })}
            </Card>
          )}
        </div>
      )}
    </div>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────
function CompetitionPage() {
  const { gymId, compId } = useParams();
  const decoded = getDecodedToken();
  const currentUserId = decoded?.user_id;
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
    try {
      const res = await api.get(`/api/competitions/${compId}/`);
      setComp(res.data);
    } catch { setError('Failed to load competition.'); }
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
    const res = await api.get(`/api/competitions/${compId}/registrations/`);
    setRegistrations(res.data);
  }, [compId]);

  useEffect(() => {
    const init = async () => {
      setLoading(true);
      setError(null);
      try { await Promise.all([fetchComp(), fetchClimbs(), fetchRegistrations()]); }
      catch { setError('Failed to load competition.'); }
      finally { setLoading(false); }
    };
    init();
  }, [compId]);

  const handleRegister = async () => {
    setRegistering(true);
    try {
      await api.post(`/api/competitions/${compId}/register/`, {});
      await fetchComp();
      await fetchRegistrations();
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Registration failed.');
    } finally { setRegistering(false); }
  };

  if (loading) return <PageSkeleton />;
  if (error || !comp) return <ErrorScreen message={error || 'Competition not found.'} onRetry={() => window.location.reload()} />;

  const isQualifier = comp.comp_type === 'qualifier';
  const tabs = [
    { key: 'info', label: 'Info' },
    { key: 'climbs', label: `Climbs (${compClimbs.length})` },
    { key: 'leaderboard', label: isQualifier ? 'Leaderboard' : 'Results' },
  ];

  const headerRight = (
    <p className="font-body text-xs text-sky-text opacity-85 mt-2 mb-0">
      {fmtDate(comp.start_date)} → {fmtDate(comp.end_date)}
    </p>
  );

  const eyebrow = `${isQualifier ? 'Qualifier' : 'Finals'} · ${comp.status.charAt(0).toUpperCase() + comp.status.slice(1)}`;
  const registrationUrl = `${window.location.origin}/gym/${gymId}/competitions/${compId}`;

  return (
    <PageShell back backLabel="Competitions" backPath={`/gym/${gymId}/competitions`} eyebrow={eyebrow} title={comp.title} right={headerRight}>
      <Tabs tabs={tabs} active={activeTab} onChange={setActiveTab} />

      {activeTab === 'info' && (
        <InfoTab comp={comp} isRegistered={comp.is_registered} onRegister={handleRegister} registering={registering} isSetterUser={isSetterUser} registrationUrl={registrationUrl} />
      )}
      {activeTab === 'climbs' && (
        <ClimbsTab comp={comp} compClimbs={compClimbs} mySends={mySends} gymId={gymId} canEdit={isSetterUser} onSendLogged={fetchClimbs} onClimbRemoved={fetchClimbs} />
      )}
      {activeTab === 'leaderboard' && isQualifier && (
        <QualifierLeaderboard compId={compId} currentUserId={currentUserId} />
      )}
      {activeTab === 'leaderboard' && !isQualifier && (
        <FinalsTab comp={comp} compClimbs={compClimbs} registrations={registrations} isSetterUser={isSetterUser} currentUserId={currentUserId} />
      )}
    </PageShell>
  );
}

export default CompetitionPage;

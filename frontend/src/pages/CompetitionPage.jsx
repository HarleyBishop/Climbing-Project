import { useState, useEffect, useCallback } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { jwtDecode } from 'jwt-decode';
import api from '../api';
import { PageShell } from '../components/ui/PageShell';
import { isSetter, getDecodedToken } from '../auth';
import { PageSkeleton } from '../components/Skeleton';
import toast from 'react-hot-toast';
import { useTheme, HOLD } from '../theme';
import { Card, Chip, Btn, Eyebrow, Divider, Field, Modal, Tabs, Toggle } from '../components/ui/primitives';

function fmtDate(iso) {
  return new Date(iso).toLocaleDateString('en-AU', { day: 'numeric', month: 'short', year: 'numeric' });
}
function fmtDateTime(iso) {
  return new Date(iso).toLocaleString('en-AU', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });
}

// ─── Info tab ────────────────────────────────────────────────────────────────
function InfoTab({ comp, isRegistered, onRegister, registering }) {
  const P = useTheme();
  return (
    <div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 18 }}>
        {[
          { l: 'Opens', v: fmtDateTime(comp.start_date) },
          { l: 'Closes', v: fmtDateTime(comp.end_date) },
          { l: 'Registered', v: comp.registration_count },
          { l: 'Type', v: comp.comp_type === 'qualifier' ? 'Qualifier' : 'Finals' },
        ].map(s => (
          <div key={s.l} style={{ background: P.card, border: `1px solid ${P.line}`, borderRadius: 12, padding: '12px 14px', textAlign: 'center' }}>
            <p style={{ fontFamily: P.disp, fontWeight: 400, fontSize: 17, margin: 0, color: P.ink }}>{s.v}</p>
            <p style={{ fontFamily: P.body, fontWeight: 600, fontSize: 9.5, letterSpacing: '0.08em', textTransform: 'uppercase', color: P.ink2, margin: '4px 0 0' }}>{s.l}</p>
          </div>
        ))}
      </div>

      {comp.top_x_advance && (
        <div style={{ background: P.infoBg, borderRadius: 12, padding: '11px 14px', marginBottom: 18, fontFamily: P.serif, fontStyle: 'italic', fontSize: 14, color: P.info }}>
          Top {comp.top_x_advance} climbers advance to finals.
        </div>
      )}

      {comp.description && (
        <div style={{ marginBottom: 18 }}>
          <Eyebrow style={{ marginBottom: 8 }}>About</Eyebrow>
          <p style={{ fontFamily: P.serif, fontStyle: 'italic', fontSize: 15, lineHeight: 1.5, color: P.ink, margin: 0 }}>{comp.description}</p>
        </div>
      )}

      {comp.rules && (
        <div style={{ marginBottom: 18 }}>
          <Eyebrow style={{ marginBottom: 8 }}>Rules</Eyebrow>
          <p style={{ fontFamily: P.serif, fontStyle: 'italic', fontSize: 14, lineHeight: 1.6, color: P.ink, margin: 0, whiteSpace: 'pre-line' }}>{comp.rules}</p>
        </div>
      )}

      {comp.divisions?.length > 0 && (
        <div style={{ marginBottom: 18 }}>
          <Eyebrow style={{ marginBottom: 10 }}>Divisions</Eyebrow>
          <div style={{ display: 'flex', gap: 7, flexWrap: 'wrap' }}>
            {comp.divisions.map(d => <Chip key={d.id} tone="soft">{d.name}</Chip>)}
          </div>
        </div>
      )}

      {comp.rounds?.length > 0 && (
        <div style={{ marginBottom: 22 }}>
          <Eyebrow style={{ marginBottom: 10 }}>Rounds</Eyebrow>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {comp.rounds.map((r, i) => (
              <div key={r.id} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <span style={{ width: 22, height: 22, borderRadius: '50%', background: 'rgba(207,111,73,.12)', color: '#b85b39', fontFamily: 'Mulish,sans-serif', fontWeight: 700, fontSize: 11, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>{i + 1}</span>
                <span style={{ fontFamily: 'Newsreader,serif', fontStyle: 'italic', fontSize: 14.5 }}>{r.name}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      <Divider m={6} />
      <div style={{ marginTop: 18 }}>
        {comp.status === 'closed' ? (
          <p style={{ fontFamily: 'Newsreader,serif', fontStyle: 'italic', fontSize: 14, color: '#9aa389', textAlign: 'center', padding: '16px 0' }}>This competition has ended.</p>
        ) : isRegistered ? (
          <Card style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '13px 15px', background: 'rgba(126,155,92,.16)', borderColor: 'transparent' }}>
            <span style={{ color: '#5e7a44', fontSize: 17 }}>✓</span>
            <p style={{ flex: 1, fontFamily: 'Newsreader,serif', fontStyle: 'italic', fontSize: 14, color: '#5e7a44', margin: 0 }}>You're registered — head to Climbs to log your sends.</p>
          </Card>
        ) : (
          <Btn full onClick={onRegister} disabled={registering}>
            {registering ? 'Registering…' : 'Register for this competition'}
          </Btn>
        )}
      </div>
    </div>
  );
}

// ─── Climbs tab ──────────────────────────────────────────────────────────────
function ClimbsTab({ comp, compClimbs, mySends, gymId, canEdit, onSendLogged, onClimbRemoved }) {
  const P = useTheme();
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
        <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 14 }}>
          <Btn size="sm" onClick={openAddModal}>+ Add climb</Btn>
        </div>
      )}

      {compClimbs.length === 0 ? (
        <p style={{ fontFamily: P.serif, fontStyle: 'italic', fontSize: 14, color: P.ink3, textAlign: 'center', padding: '48px 0' }}>No climbs added yet.</p>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 11 }}>
          {compClimbs.map(cc => {
            const colour = HOLD[cc.climb_colour] || '#cd6f3f';
            const mySend = mySendMap[cc.id];
            return (
              <Card key={cc.id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '11px 13px' }}>
                <div style={{ width: 40, height: 40, borderRadius: 10, background: colour, flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: P.body, fontWeight: 700, fontSize: 12.5, color: '#fff' }}>
                  V{cc.climb_grade}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ fontFamily: P.disp, fontWeight: 400, fontSize: 16, margin: 0, color: P.ink, lineHeight: 1.1 }}>{cc.climb_name}</p>
                  <p style={{ fontFamily: P.body, fontSize: 11.5, color: P.ink2, margin: '3px 0 0' }}>{cc.wall_name} · {cc.points_value} pts</p>
                </div>
                {mySend ? (
                  <Chip tone="open">✓ {mySend.attempts} att.</Chip>
                ) : canLog ? (
                  <Btn size="sm" onClick={() => { setLogModal(cc); setLogAttempts(''); setLogError(null); }}>Log send</Btn>
                ) : null}
                {canEdit && (
                  <button onClick={() => handleRemove(cc.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 15, color: P.ink3, marginLeft: 4 }}>✕</button>
                )}
              </Card>
            );
          })}
        </div>
      )}

      {!comp.is_registered && comp.status === 'open' && (
        <p style={{ fontFamily: P.serif, fontStyle: 'italic', fontSize: 13, color: P.ink3, textAlign: 'center', marginTop: 16 }}>
          Register on the Info tab to log your sends.
        </p>
      )}

      {logModal && (
        <Modal title="Log comp send" subtitle={`${logModal.climb_name} · ${logModal.points_value} pts`} onClose={() => setLogModal(null)}>
          {logError && <p style={{ fontFamily: P.serif, fontStyle: 'italic', color: '#bb5b46', fontSize: 13, marginBottom: 10 }}>{logError}</p>}
          <Field label="Attempts" value={logAttempts} onChange={setLogAttempts} placeholder="e.g. 3" type="number" />
          <div style={{ display: 'flex', gap: 10 }}>
            <Btn full onClick={handleLogSend} disabled={logging}>{logging ? 'Saving…' : 'Save'}</Btn>
            <Btn full variant="ghost" onClick={() => setLogModal(null)}>Cancel</Btn>
          </div>
        </Modal>
      )}

      {showAddModal && (
        <Modal title="Add climb" subtitle="Pick a climb from the gym" onClose={() => setShowAddModal(false)}>
          {addError && <p style={{ fontFamily: P.serif, fontStyle: 'italic', color: '#bb5b46', fontSize: 13, marginBottom: 10 }}>{addError}</p>}
          {pendingAdd ? (
            <div>
              <p style={{ fontFamily: P.serif, fontStyle: 'italic', fontSize: 14, marginBottom: 14 }}>
                Adding <strong>{pendingAdd.name}</strong> (V{pendingAdd.suggested_grade})
              </p>
              <Field label="Points value" value={String(pendingPoints)} onChange={v => setPendingPoints(parseInt(v) || 100)} type="number" />
              <div style={{ display: 'flex', gap: 10 }}>
                <Btn full onClick={handleAdd} disabled={adding}>{adding ? 'Adding…' : 'Confirm'}</Btn>
                <Btn full variant="ghost" onClick={() => setPendingAdd(null)}>Back</Btn>
              </div>
            </div>
          ) : (
            <>
              <input type="text" placeholder="Search climbs…" value={addSearch} onChange={e => setAddSearch(e.target.value)}
                style={{ width: '100%', background: P.card, border: `1px solid ${P.line}`, borderRadius: 11, padding: '10px 14px', fontFamily: P.body, fontSize: 14, color: P.ink, outline: 'none', boxSizing: 'border-box', marginBottom: 12 }} />
              <div style={{ maxHeight: 240, overflowY: 'auto' }}>
                {filtered.length === 0 ? (
                  <p style={{ fontFamily: P.serif, fontStyle: 'italic', fontSize: 14, color: P.ink3, textAlign: 'center', padding: '16px 0' }}>No climbs available.</p>
                ) : filtered.map(c => (
                  <div key={c.id} onClick={() => setPendingAdd(c)}
                    style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '9px 4px', borderRadius: 10, cursor: 'pointer', marginBottom: 4 }}>
                    <div style={{ width: 32, height: 32, borderRadius: 8, background: HOLD[c.colour] || '#cd6f3f', flexShrink: 0 }} />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p style={{ fontFamily: P.disp, fontSize: 15, margin: 0, color: P.ink }}>{c.name}</p>
                      <p style={{ fontFamily: P.body, fontSize: 11.5, color: P.ink2, margin: '2px 0 0' }}>{c.wall_name} · V{c.suggested_grade}</p>
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
  const P = useTheme();
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

  const rankColour = (n, P) => n === 1 ? P.primary : n === 2 ? P.ink2 : n === 3 ? P.accent : P.ink3;
  const maxPts = rankings[0]?.points || 1;

  if (loading) return <p style={{ fontFamily: P.serif, fontStyle: 'italic', color: P.ink3, fontSize: 14, textAlign: 'center', padding: '32px 0' }}>Loading…</p>;
  if (rankings.length === 0) return <p style={{ fontFamily: P.serif, fontStyle: 'italic', color: P.ink3, fontSize: 14, textAlign: 'center', padding: '32px 0' }}>No sends logged yet.</p>;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 9 }}>
      {rankings.map(entry => {
        const isMe = entry.user_id === currentUserId;
        const bar = Math.round((entry.points / maxPts) * 100);
        return (
          <Card key={entry.user_id} hover onClick={() => navigate(`/profile/${entry.user_id}`)}
            style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '11px 14px', border: isMe ? `2px solid ${P.primary}` : `1px solid ${P.line}` }}>
            <span style={{ fontFamily: P.disp, fontSize: 18, color: rankColour(entry.rank, P), minWidth: 22, textAlign: 'center' }}>{entry.rank}</span>
            <div style={{ width: 30, height: 30, borderRadius: '50%', background: P.lineSoft, border: `1px solid ${P.line}`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: P.body, fontWeight: 700, fontSize: 11, color: P.ink, flexShrink: 0 }}>
              {entry.username?.slice(0, 2).toUpperCase()}
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 6 }}>
                <span style={{ fontFamily: P.body, fontWeight: 700, fontSize: 13, color: P.ink }}>@{entry.username}</span>
                {isMe && <Chip tone="you">You</Chip>}
                {entry.advances && <Chip tone="advances">Advances</Chip>}
              </div>
              <div style={{ height: 6, background: P.lineSoft, borderRadius: 999, overflow: 'hidden' }}>
                <div style={{ height: '100%', width: `${bar}%`, background: P.primary, borderRadius: 999 }} />
              </div>
            </div>
            <div style={{ textAlign: 'right', flexShrink: 0 }}>
              <p style={{ fontFamily: P.body, fontWeight: 700, fontSize: 12.5, color: P.ink, margin: 0 }}>{entry.points} pts</p>
              <p style={{ fontFamily: P.body, fontSize: 10.5, color: P.ink2, margin: '2px 0 0' }}>{entry.climbs_completed} climbs · {entry.total_attempts} att.</p>
            </div>
          </Card>
        );
      })}
    </div>
  );
}

// ─── Finals tab ───────────────────────────────────────────────────────────────
function FinalsTab({ comp, compClimbs, registrations, isSetterUser, currentUserId }) {
  const P = useTheme();
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

  const rankColour = (n) => n === 1 ? P.primary : n === 2 ? P.ink2 : n === 3 ? P.accent : P.ink3;

  return (
    <div>
      {leaderboard.length > 0 && (
        <div style={{ marginBottom: 24 }}>
          <Eyebrow style={{ marginBottom: 12 }}>Results</Eyebrow>
          <Card style={{ overflow: 'hidden' }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'auto 1fr auto auto auto', gap: '0 12px', background: P.lineSoft, padding: '8px 14px' }}>
              {['#', 'Climber', 'Tops', 'Zones', 'Att.'].map(h => (
                <span key={h} style={{ fontFamily: P.body, fontWeight: 700, fontSize: 10, letterSpacing: '0.14em', textTransform: 'uppercase', color: P.ink2 }}>{h}</span>
              ))}
            </div>
            {leaderboard.map(e => (
              <div key={e.user_id} onClick={() => navigate(`/profile/${e.user_id}`)}
                style={{ display: 'grid', gridTemplateColumns: 'auto 1fr auto auto auto', gap: '0 12px', padding: '10px 14px', borderTop: `1px solid ${P.line}`, cursor: 'pointer', background: e.user_id === currentUserId ? P.lineSoft : 'transparent', alignItems: 'center' }}>
                <span style={{ fontFamily: P.disp, fontSize: 16, color: rankColour(e.rank), minWidth: 20 }}>{e.rank}</span>
                <span style={{ fontFamily: P.body, fontWeight: 700, fontSize: 13, color: P.ink, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>@{e.username}</span>
                <span style={{ fontFamily: P.body, fontWeight: 700, fontSize: 13, color: P.ink, textAlign: 'center' }}>{e.tops}<span style={{ fontFamily: P.body, fontSize: 10, color: P.ink3 }}>/{e.top_attempts}a</span></span>
                <span style={{ fontFamily: P.body, fontWeight: 700, fontSize: 13, color: P.ink2, textAlign: 'center' }}>{e.zones}<span style={{ fontFamily: P.body, fontSize: 10, color: P.ink3 }}>/{e.zone_attempts}a</span></span>
                <span style={{ fontFamily: P.body, fontSize: 11, color: P.ink3, textAlign: 'center' }}>{e.top_attempts + e.zone_attempts}</span>
              </div>
            ))}
          </Card>
        </div>
      )}

      {leaderboard.length === 0 && !loadingResults && (
        <p style={{ fontFamily: P.serif, fontStyle: 'italic', fontSize: 14, color: P.ink3, textAlign: 'center', padding: '32px 0' }}>No results recorded yet.</p>
      )}

      {isSetterUser && (
        <div>
          <Divider />
          <Eyebrow style={{ margin: '20px 0 12px' }}>Judging panel</Eyebrow>
          {saveError && <p style={{ fontFamily: P.serif, fontStyle: 'italic', color: '#bb5b46', fontSize: 13, marginBottom: 12 }}>{saveError}</p>}

          {compClimbs.length === 0 ? (
            <p style={{ fontFamily: P.serif, fontStyle: 'italic', fontSize: 14, color: P.ink3 }}>No climbs added yet.</p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 16 }}>
              {compClimbs.map(cc => (
                <button key={cc.id} type="button" onClick={() => openJudging(cc)}
                  style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 14px', borderRadius: 12, border: `1px solid ${judgingClimb?.id === cc.id ? P.primary : P.line}`, background: judgingClimb?.id === cc.id ? P.lineSoft : P.card, cursor: 'pointer', textAlign: 'left' }}>
                  <div>
                    <p style={{ fontFamily: P.disp, fontSize: 15, margin: 0, color: P.ink }}>{cc.climb_name}</p>
                    <p style={{ fontFamily: P.body, fontSize: 11.5, color: P.ink2, margin: '2px 0 0' }}>{cc.wall_name} · V{cc.climb_grade}</p>
                  </div>
                  <span style={{ fontFamily: P.body, fontSize: 11.5, color: P.ink2 }}>
                    {results.filter(r => r.comp_climb === cc.id).length}/{registrations.length} judged
                  </span>
                </button>
              ))}
            </div>
          )}

          {judgingClimb && registrations.length > 0 && (
            <Card style={{ padding: 16 }}>
              <p style={{ fontFamily: P.disp, fontSize: 16, color: P.ink, marginBottom: 16 }}>
                {judgingClimb.climb_name} — enter results per climber
              </p>
              {registrations.map(reg => {
                const f = judgeForm[reg.user] || { topped: false, top_attempts: '', zoned: false, zone_attempts: '' };
                return (
                  <div key={reg.user} style={{ borderBottom: `1px solid ${P.line}`, paddingBottom: 16, marginBottom: 16 }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
                      <p style={{ fontFamily: P.disp, fontSize: 15, color: P.ink, margin: 0 }}>@{reg.username}</p>
                      <Btn size="sm" onClick={() => saveResult(reg.user)} disabled={saving}>{saving ? '…' : 'Save'}</Btn>
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <Toggle on={f.topped} onChange={v => setJudgeForm(prev => ({ ...prev, [reg.user]: { ...prev[reg.user], topped: v } }))} />
                        <span style={{ fontFamily: P.body, fontSize: 13, color: P.ink }}>Topped</span>
                      </div>
                      {f.topped && (
                        <Field label="Top attempts" value={f.top_attempts} type="number"
                          onChange={v => setJudgeForm(prev => ({ ...prev, [reg.user]: { ...prev[reg.user], top_attempts: v } }))}
                          style={{ marginBottom: 0 }} />
                      )}
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <Toggle on={f.zoned} onChange={v => setJudgeForm(prev => ({ ...prev, [reg.user]: { ...prev[reg.user], zoned: v } }))} />
                        <span style={{ fontFamily: P.body, fontSize: 13, color: P.ink }}>Zoned</span>
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
  const P = useTheme();
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

  if (error || !comp) return (
    <div style={{ minHeight: '100vh', background: P.sheet, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ textAlign: 'center', padding: '0 24px' }}>
        <p style={{ fontFamily: P.serif, fontStyle: 'italic', color: '#bb5b46', fontSize: 14, marginBottom: 16 }}>{error || 'Competition not found.'}</p>
        <button onClick={() => window.location.reload()} style={{ fontFamily: P.body, fontWeight: 700, fontSize: 13.5, padding: '10px 20px', borderRadius: 12, background: P.primary, color: '#fff', border: 'none', cursor: 'pointer' }}>Retry</button>
      </div>
    </div>
  );

  const isQualifier = comp.comp_type === 'qualifier';
  const tabs = [
    { key: 'info', label: 'Info' },
    { key: 'climbs', label: `Climbs (${compClimbs.length})` },
    { key: 'leaderboard', label: isQualifier ? 'Leaderboard' : 'Results' },
  ];

  const headerRight = (
    <p style={{ fontFamily: P.body, fontSize: 12, color: P.skyText, opacity: .85, margin: '8px 0 0' }}>
      {fmtDate(comp.start_date)} → {fmtDate(comp.end_date)}
    </p>
  );

  const eyebrow = `${isQualifier ? 'Qualifier' : 'Finals'} · ${comp.status.charAt(0).toUpperCase() + comp.status.slice(1)}`;

  return (
    <PageShell back backLabel="Competitions" backPath={`/gym/${gymId}/competitions`} eyebrow={eyebrow} title={comp.title} right={headerRight}>
      <Tabs tabs={tabs} active={activeTab} onChange={setActiveTab} />

      {activeTab === 'info' && (
        <InfoTab comp={comp} isRegistered={comp.is_registered} onRegister={handleRegister} registering={registering} />
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

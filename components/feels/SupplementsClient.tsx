'use client';

import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import {
  DndContext, DragEndEvent, DragOverlay, DragStartEvent,
  PointerSensor, useSensor, useSensors,
} from '@dnd-kit/core';
import { useDraggable, useDroppable } from '@dnd-kit/core';
import { CSS } from '@dnd-kit/utilities';
import { Card } from '@/components/ui/Card';
import { NeonButton } from '@/components/ui/NeonButton';
import { NeonInput } from '@/components/ui/NeonInput';
import { NeonSelect } from '@/components/ui/Select';
import { Modal } from '@/components/ui/Modal';
import { Skeleton } from '@/components/ui/Skeleton';
import { cn, toDateOnly, todayUTC } from '@/lib/utils';
import { useI18n } from '@/components/providers/I18nProvider';
import { useAdvancedView } from '@/lib/useAdvancedView';
import { SUPPLEMENTS, SUPPLEMENT_TIMINGS, type SupplementTiming } from '@/lib/supplements';
import { GripVertical, Plus, Trash2, Flame, TrendingUp } from 'lucide-react';
import toast from 'react-hot-toast';

interface UserSupplement {
  id: string;
  name: string;
  isCustom: boolean;
  dose: number | null;
  doseUnit: string | null;
  timing: string | null;
}

interface SupplementLogEntry {
  supplement: string;
  taken: boolean;
  date: string;
}

interface FeelsLog {
  date: string;
  performance: number;
}

// ── Draggable supplement card ──────────────────────────────────────────────────

function SuppDragCard({ supp, onRemove, t }: {
  supp: UserSupplement;
  onRemove: (id: string) => void;
  t: (k: string, v?: Record<string, string | number>) => string;
}) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({ id: supp.id });
  const style = { transform: CSS.Translate.toString(transform) };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        'flex items-center gap-2 px-2.5 py-2 rounded-lg bg-dark-card border border-dark-border text-sm select-none',
        isDragging && 'opacity-40'
      )}
    >
      <button
        {...listeners}
        {...attributes}
        className="text-slate-600 hover:text-slate-400 cursor-grab active:cursor-grabbing touch-none shrink-0"
      >
        <GripVertical size={14} />
      </button>
      <div className="flex-1 min-w-0">
        <p className="text-slate-200 font-medium truncate text-xs">
          {supp.isCustom ? supp.name : t(`supp.${supp.name}`)}
        </p>
        {supp.dose && (
          <p className="text-[10px] text-slate-600">{supp.dose} {supp.doseUnit ?? ''}</p>
        )}
      </div>
      <button
        onClick={() => onRemove(supp.id)}
        className="text-slate-700 hover:text-neon-pink transition-colors shrink-0"
        title={t('supp.remove')}
      >
        <Trash2 size={12} />
      </button>
    </div>
  );
}

// ── Droppable slot ─────────────────────────────────────────────────────────────

function SlotZone({ id, label, supps, onRemove, t, accentClass }: {
  id: string;
  label: string;
  supps: UserSupplement[];
  onRemove: (id: string) => void;
  t: (k: string, v?: Record<string, string | number>) => string;
  accentClass: string;
}) {
  const { setNodeRef, isOver } = useDroppable({ id });
  return (
    <div
      ref={setNodeRef}
      className={cn(
        'rounded-xl border p-3 min-h-[80px] transition-all',
        isOver ? 'border-neon-cyan/60 bg-neon-cyan/5' : 'border-dark-border bg-dark-muted/30'
      )}
    >
      <p className={cn('text-[10px] font-bold uppercase tracking-wider mb-2', accentClass)}>{label}</p>
      <div className="space-y-1.5">
        {supps.length === 0 && (
          <p className="text-[10px] text-slate-700 text-center py-2">{t('supp.emptySlot')}</p>
        )}
        {supps.map((s) => <SuppDragCard key={s.id} supp={s} onRemove={onRemove} t={t} />)}
      </div>
    </div>
  );
}

// ── Check-in row ───────────────────────────────────────────────────────────────

function CheckInRow({ supp, taken, streak, corr, advancedView, onToggle, t }: {
  supp: UserSupplement;
  taken: boolean;
  streak: number;
  corr: { avgWith: number; avgWithout: number | null; nWith: number; nWithout: number } | null;
  advancedView: boolean;
  onToggle: () => void;
  t: (k: string, v?: Record<string, string | number>) => string;
}) {
  return (
    <div>
      <div
        role="button"
        tabIndex={0}
        onClick={onToggle}
        onKeyDown={(e) => e.key === 'Enter' && onToggle()}
        className={cn(
          'flex items-center gap-3 p-2.5 rounded-lg transition-colors cursor-pointer select-none',
          taken
            ? 'bg-neon-green/10 border border-neon-green/20'
            : 'bg-dark-muted hover:bg-dark-hover border border-transparent'
        )}
      >
        <div className={cn(
          'w-5 h-5 rounded border-2 flex items-center justify-center shrink-0 transition-all',
          taken ? 'bg-neon-green border-neon-green' : 'border-slate-600'
        )}>
          {taken && <span className="text-dark-bg text-[10px] font-black leading-none">✓</span>}
        </div>
        <div className="flex-1 min-w-0">
          <p className={cn('text-sm font-medium', taken ? 'text-neon-green' : 'text-slate-300')}>
            {supp.isCustom ? supp.name : t(`supp.${supp.name}`)}
          </p>
          {supp.dose && (
            <p className="text-[10px] text-slate-600">{supp.dose} {supp.doseUnit ?? ''}</p>
          )}
        </div>
        {streak > 0 && (
          <span className="flex items-center gap-0.5 text-[10px] text-neon-yellow font-semibold shrink-0">
            <Flame size={10} />
            {t('supp.streak', { n: streak })}
          </span>
        )}
      </div>
      {advancedView && corr && (
        <div className="ml-8 mt-1 px-2.5 py-1.5 rounded-lg bg-dark-muted/50 border border-dark-border/40 flex items-center gap-2 text-[10px] text-slate-500">
          <TrendingUp size={10} className="shrink-0 text-neon-cyan" />
          <span>
            {t('supp.corrDays', { n: corr.nWith })}: <span className="text-neon-cyan font-semibold">{corr.avgWith}/5</span>
            {corr.avgWithout !== null && corr.nWithout >= 3 && (
              <> · {t('supp.corrWithout', { n: corr.nWithout })}: <span className="text-slate-400 font-semibold">{corr.avgWithout}/5</span></>
            )}
          </span>
        </div>
      )}
    </div>
  );
}

// ── Main component ─────────────────────────────────────────────────────────────

export function SupplementsClient() {
  const { t } = useI18n();
  const qc = useQueryClient();
  const advancedView = useAdvancedView();
  const today = toDateOnly(todayUTC());

  const [showAdd, setShowAdd] = useState(false);
  const [addMode, setAddMode] = useState<'preloaded' | 'custom'>('preloaded');
  const [selectedKey, setSelectedKey] = useState('');
  const [customName, setCustomName] = useState('');
  const [addDose, setAddDose] = useState('');
  const [addUnit, setAddUnit] = useState('g');
  const [adding, setAdding] = useState(false);
  const [activeId, setActiveId] = useState<string | null>(null);

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 8 } }));

  // User's supplement bag
  const { data: userSupps = [], isLoading } = useQuery<UserSupplement[]>({
    queryKey: ['user-supplements'],
    queryFn: () => fetch('/api/supplements').then((r) => r.json()),
  });

  // Today's check-in logs
  const { data: todayLogs = [] } = useQuery<SupplementLogEntry[]>({
    queryKey: ['supplements-log', today],
    queryFn: () => fetch(`/api/supplements/log?date=${today}`).then((r) => r.json()),
  });

  // History for streaks + correlation
  const { data: histLogs = [] } = useQuery<SupplementLogEntry[]>({
    queryKey: ['supplements-history'],
    queryFn: () => {
      const from = new Date(todayUTC());
      from.setDate(from.getDate() - 60);
      return fetch(`/api/supplements/log?from=${toDateOnly(from)}&to=${today}`).then((r) => r.json());
    },
    staleTime: 5 * 60_000,
  });

  const { data: feelsLogs = [] } = useQuery<FeelsLog[]>({
    queryKey: ['feels'],
    queryFn: () => fetch('/api/feels?limit=60').then((r) => r.json()),
    enabled: advancedView,
    staleTime: 5 * 60_000,
  });

  // ── Helpers ────────────────────────────────────────────────────────────────

  function getStreak(name: string): number {
    const taken = new Set(histLogs.filter((l) => l.supplement === name && l.taken).map((l) => toDateOnly(new Date(l.date))));
    let streak = 0;
    const d = new Date(todayUTC());
    while (streak < 60) {
      if (!taken.has(toDateOnly(d))) break;
      streak++;
      d.setDate(d.getDate() - 1);
    }
    return streak;
  }

  function computeCorrelation(name: string) {
    if (!advancedView || feelsLogs.length < 7) return null;
    const taken = new Set(histLogs.filter((l) => l.supplement === name && l.taken).map((l) => toDateOnly(new Date(l.date))));
    const w: number[] = [], wo: number[] = [];
    for (const fl of feelsLogs) {
      const d = toDateOnly(new Date(fl.date));
      taken.has(d) ? w.push(fl.performance) : wo.push(fl.performance);
    }
    if (w.length < 3) return null;
    const avg = (a: number[]) => Math.round(a.reduce((s, x) => s + x, 0) / a.length * 10) / 10;
    return { avgWith: avg(w), avgWithout: wo.length >= 3 ? avg(wo) : null, nWith: w.length, nWithout: wo.length };
  }

  // ── Drag and drop ──────────────────────────────────────────────────────────

  function handleDragStart(event: DragStartEvent) {
    setActiveId(event.active.id as string);
  }

  async function handleDragEnd(event: DragEndEvent) {
    setActiveId(null);
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const suppId = active.id as string;
    const newTiming = over.id === 'bag' ? null : (over.id as string);

    await fetch(`/api/supplements/${suppId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ timing: newTiming }),
    });
    qc.invalidateQueries({ queryKey: ['user-supplements'] });
  }

  // ── Add supplement ─────────────────────────────────────────────────────────

  async function addSupplement() {
    const name = addMode === 'preloaded' ? selectedKey : customName.trim();
    if (!name) return;
    setAdding(true);
    try {
      const res = await fetch('/api/supplements', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          isCustom: addMode === 'custom',
          dose: addDose ? parseFloat(addDose) : null,
          doseUnit: addUnit || null,
        }),
      });
      if (!res.ok) { toast.error(t('supp.alreadyAdded')); return; }
      qc.invalidateQueries({ queryKey: ['user-supplements'] });
      setShowAdd(false);
      setSelectedKey(''); setCustomName(''); setAddDose(''); setAddUnit('g');
    } finally {
      setAdding(false);
    }
  }

  async function removeSupplement(id: string) {
    await fetch(`/api/supplements/${id}`, { method: 'DELETE' });
    qc.invalidateQueries({ queryKey: ['user-supplements'] });
  }

  async function toggleTaken(name: string) {
    const entry = todayLogs.find((l) => l.supplement === name);
    await fetch('/api/supplements/log', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ supplement: name, taken: !(entry?.taken ?? false), date: today }),
    });
    qc.invalidateQueries({ queryKey: ['supplements-log'] });
    qc.invalidateQueries({ queryKey: ['supplements-history'] });
  }

  if (isLoading) return <div className="space-y-3">{Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-20" />)}</div>;

  const suppsByTiming: Record<string, UserSupplement[]> = { bag: [] };
  for (const slot of SUPPLEMENT_TIMINGS) suppsByTiming[slot] = [];
  for (const s of userSupps) (suppsByTiming[s.timing ?? 'bag'] ??= []).push(s);

  const activeSupp = activeId ? userSupps.find((s) => s.id === activeId) : null;
  const logMap = Object.fromEntries(todayLogs.map((l) => [l.supplement, l]));

  const slotAccents: Record<string, string> = {
    MORNING: 'text-neon-yellow',
    PREWORKOUT: 'text-neon-cyan',
    POSTWORKOUT: 'text-neon-green',
    EVENING: 'text-neon-purple',
  };

  const alreadyAdded = new Set(userSupps.map((s) => s.name));

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <p className="text-sm font-semibold text-slate-300">{t('supp.mySupplements')}</p>
        <NeonButton variant="cyan" size="sm" onClick={() => setShowAdd(true)}>
          <Plus size={12} /> {t('supp.addSupp')}
        </NeonButton>
      </div>

      {userSupps.length === 0 ? (
        <Card className="text-center py-10">
          <p className="text-3xl mb-2">💊</p>
          <p className="text-slate-400 text-sm">{t('supp.dragHint')}</p>
          <NeonButton variant="cyan" size="sm" className="mt-3 mx-auto" onClick={() => setShowAdd(true)}>
            <Plus size={12} /> {t('supp.addSupp')}
          </NeonButton>
        </Card>
      ) : (
        <DndContext sensors={sensors} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
          {/* Time slots */}
          <div className="grid grid-cols-2 gap-2">
            {SUPPLEMENT_TIMINGS.map((slot) => (
              <SlotZone
                key={slot}
                id={slot}
                label={t(`supp.${slot.toLowerCase()}`)}
                supps={suppsByTiming[slot] ?? []}
                onRemove={removeSupplement}
                t={t}
                accentClass={slotAccents[slot] ?? 'text-slate-400'}
              />
            ))}
          </div>

          {/* Bag (unassigned) */}
          {suppsByTiming.bag.length > 0 && (
            <SlotZone
              id="bag"
              label={t('supp.bag')}
              supps={suppsByTiming.bag}
              onRemove={removeSupplement}
              t={t}
              accentClass="text-slate-500"
            />
          )}

          {/* Drag overlay */}
          <DragOverlay>
            {activeSupp && (
              <div className="flex items-center gap-2 px-2.5 py-2 rounded-lg bg-dark-card border border-neon-cyan/40 text-xs text-slate-200 shadow-lg cursor-grabbing">
                <GripVertical size={14} className="text-neon-cyan" />
                {activeSupp.isCustom ? activeSupp.name : t(`supp.${activeSupp.name}`)}
              </div>
            )}
          </DragOverlay>
        </DndContext>
      )}

      {/* Today's check-in */}
      {userSupps.length > 0 && (
        <div>
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">{t('supp.checkin')}</p>
          <div className="space-y-2">
            {userSupps.map((supp) => (
              <CheckInRow
                key={supp.id}
                supp={supp}
                taken={logMap[supp.name]?.taken ?? false}
                streak={getStreak(supp.name)}
                corr={computeCorrelation(supp.name)}
                advancedView={advancedView}
                onToggle={() => toggleTaken(supp.name)}
                t={t}
              />
            ))}
          </div>
        </div>
      )}

      {/* Add supplement modal */}
      <Modal open={showAdd} onClose={() => setShowAdd(false)} title={t('supp.addSuppTitle')}>
        <div className="space-y-3">
          {/* Mode toggle */}
          <div className="flex gap-1 bg-dark-muted rounded-lg p-1">
            {(['preloaded', 'custom'] as const).map((mode) => (
              <button
                key={mode}
                onClick={() => setAddMode(mode)}
                className={`flex-1 py-1.5 rounded-md text-xs font-semibold transition-all ${
                  addMode === mode ? 'bg-dark-card text-slate-100' : 'text-slate-500 hover:text-slate-300'
                }`}
              >
                {t(`supp.${mode}`)}
              </button>
            ))}
          </div>

          {addMode === 'preloaded' ? (
            <NeonSelect
              label={t('supp.addSuppTitle')}
              value={selectedKey}
              onChange={(e) => setSelectedKey(e.target.value)}
            >
              <option value="">{t('supp.addSuppTitle')}…</option>
              {SUPPLEMENTS.filter((s) => !alreadyAdded.has(s.key)).map((s) => (
                <option key={s.key} value={s.key}>
                  {t(`supp.${s.key}`)} — {s.defaultDose} {s.doseUnit}
                </option>
              ))}
            </NeonSelect>
          ) : (
            <NeonInput
              label={t('supp.addSuppTitle')}
              placeholder={t('supp.customNamePlaceholder')}
              value={customName}
              onChange={(e) => setCustomName(e.target.value)}
            />
          )}

          <div className="grid grid-cols-2 gap-2">
            <NeonInput
              label={t('supp.dose')}
              type="number"
              step="0.1"
              value={addDose}
              onChange={(e) => setAddDose(e.target.value)}
              placeholder={
                addMode === 'preloaded' && selectedKey
                  ? String(SUPPLEMENTS.find((s) => s.key === selectedKey)?.defaultDose ?? '')
                  : '—'
              }
            />
            <NeonSelect label={t('supp.unit')} value={addUnit} onChange={(e) => setAddUnit(e.target.value)}>
              {['g', 'mg', 'IU', 'mcg', 'ml'].map((u) => <option key={u} value={u}>{u}</option>)}
            </NeonSelect>
          </div>

          <NeonButton variant="cyan" loading={adding} onClick={addSupplement} className="w-full">
            <Plus size={14} /> {t('supp.addSupp')}
          </NeonButton>
        </div>
      </Modal>
    </div>
  );
}

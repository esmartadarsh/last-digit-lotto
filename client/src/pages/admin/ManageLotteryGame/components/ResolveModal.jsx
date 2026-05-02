import { useRef } from 'react';
import { FiX, FiAward, FiImage, FiTrash2 } from 'react-icons/fi';
import { PRIZE_CONFIG } from '@/data.js';

const BOX_META_1ST = [
    { type: 'tel' }, { type: 'tel' }, { type: 'text' },
    { type: 'tel' }, { type: 'tel' }, { type: 'tel' }, { type: 'tel' }, { type: 'tel' },
];

export default function ResolveModal({
    draw,
    onClose,
    onSubmit,
    resolving,

    firstBoxes,
    firstRefs,
    handleFirstBoxChange,
    handleFirstBoxKeyDown,

    prizeNumbers,
    pasteDraft,
    setPasteDraft,
    handlePasteDraft,
    removeChip,

    // Result image
    resultImagePreview,
    onResultImageSelect,
    onResultImageClear,
}) {
    if (!draw) return null;

    const fileInputRef = useRef(null);

    return (
        <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-3"
            onClick={e => { if (e.target === e.currentTarget) onClose(); }}
        >
            <div
                className="bg-[#0f172a] border border-[#1e293b] rounded-2xl shadow-2xl w-full flex flex-col"
                style={{ maxWidth: 720, maxHeight: '92vh' }}
            >
                {/* ── Modal Header ── */}
                <div className="flex items-center justify-between px-6 py-4 border-b border-[#1e293b] shrink-0">
                    <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-indigo-500/20 flex items-center justify-center">
                            <FiAward className="text-indigo-400" size={16} />
                        </div>
                        <div>
                            <h2 className="text-base font-bold text-white leading-none">Announce Result</h2>
                            <p className="text-xs text-slate-500 mt-0.5">
                                {draw.game?.name} · {new Date(draw.scheduled_at).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' })}
                            </p>
                        </div>
                    </div>
                    <button onClick={onClose} className="text-slate-500 hover:text-white transition-colors p-1 rounded-lg hover:bg-slate-700">
                        <FiX size={18} />
                    </button>
                </div>

                {/* ── Scrollable body ── */}
                <div className="overflow-y-auto flex-1 px-6 py-5 space-y-5">

                    {/* ── Result Image Upload ── */}
                    <div className="rounded-xl p-4" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)' }}>
                        <p className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3">
                            📄 Result Image (optional but recommended)
                        </p>
                        {resultImagePreview ? (
                            <div className="relative rounded-xl overflow-hidden border border-slate-700 group" style={{ maxHeight: 180 }}>
                                <img src={resultImagePreview} alt="Result preview" className="w-full object-cover" style={{ maxHeight: 180 }} />
                                <button
                                    type="button"
                                    onClick={onResultImageClear}
                                    className="absolute top-2 right-2 p-1.5 bg-black/70 hover:bg-red-600 text-white rounded-lg transition-colors opacity-0 group-hover:opacity-100"
                                >
                                    <FiTrash2 size={14} />
                                </button>
                            </div>
                        ) : (
                            <button
                                type="button"
                                onClick={() => fileInputRef.current?.click()}
                                className="w-full h-20 rounded-xl border-2 border-dashed border-slate-700 hover:border-indigo-500 flex items-center justify-center gap-2 text-slate-500 hover:text-indigo-400 transition-colors"
                            >
                                <FiImage size={18} />
                                <span className="text-sm font-medium">Upload Result Image</span>
                            </button>
                        )}
                        <input
                            ref={fileInputRef}
                            type="file"
                            accept="image/*"
                            className="hidden"
                            onChange={e => {
                                const file = e.target.files?.[0];
                                if (file) onResultImageSelect(file);
                                e.target.value = '';
                            }}
                        />
                        {resultImagePreview && (
                            <button
                                type="button"
                                onClick={() => fileInputRef.current?.click()}
                                className="text-xs text-slate-400 hover:text-white mt-1.5 transition-colors"
                            >
                                ↑ Change image
                            </button>
                        )}
                    </div>

                    {/* ── 1st Prize ── */}
                    <div className="rounded-xl p-4" style={{ background: 'rgba(99,102,241,0.07)', border: '1px solid rgba(99,102,241,0.25)' }}>
                        <div className="flex items-center justify-between mb-3">
                            <span className="text-xs font-bold uppercase tracking-wider" style={{ color: '#818cf8' }}>
                                🥇 1st Prize — 1 × 8-digit Number
                            </span>
                            {firstBoxes.every(b => b !== '') && (
                                <span className="text-[10px] font-mono px-2 py-0.5 rounded-md bg-indigo-500/20 text-indigo-300 tracking-widest">
                                    {firstBoxes.join('').toUpperCase()}
                                </span>
                            )}
                        </div>
                        <div className="flex gap-1.5">
                            {BOX_META_1ST.map((meta, i) => (
                                <div key={i} className="flex flex-col items-center gap-1 flex-1">
                                    <input
                                        ref={el => firstRefs.current[i] = el}
                                        type={meta.type}
                                        inputMode={meta.type === 'tel' ? 'numeric' : 'text'}
                                        maxLength={1}
                                        value={firstBoxes[i]}
                                        onChange={e => handleFirstBoxChange(i, e.target.value)}
                                        onKeyDown={e => handleFirstBoxKeyDown(i, e)}
                                        style={{
                                            height: 48, width: '100%', borderRadius: 10,
                                            textAlign: 'center', fontWeight: 900, fontSize: '1.1rem',
                                            outline: 'none', transition: 'all 0.15s',
                                            background: firstBoxes[i] ? '#1e3a5f' : '#0a0f1e',
                                            border: `2px solid ${firstBoxes[i] ? (i === 2 ? '#dc2626' : '#6366f1') : '#1e293b'}`,
                                            color: i === 2 ? '#f87171' : '#a5b4fc',
                                            fontFamily: "'Inter', monospace",
                                        }}
                                    />
                                    <span style={{ fontSize: 8, fontWeight: 900, color: i === 2 ? '#dc2626' : '#6366f1' }}>
                                        {i === 2 ? 'L' : 'N'}
                                    </span>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* ── 2nd – 5th Prizes ── */}
                    {PRIZE_CONFIG.map(cfg => {
                        const nums = prizeNumbers[cfg.key];
                        const draft = pasteDraft[cfg.key];
                        const isFull = nums.length >= cfg.count;
                        return (
                            <div key={cfg.key} className="rounded-xl p-4" style={{ background: cfg.bg, border: `1px solid ${cfg.border}` }}>
                                {/* Prize header */}
                                <div className="flex items-center justify-between mb-3">
                                    <span className="text-xs font-bold uppercase tracking-wider" style={{ color: cfg.color }}>
                                        {cfg.key === 'second' ? '🥈' : cfg.key === 'third' ? '🥉' : cfg.key === 'fourth' ? '🏅' : '🎖️'}{' '}
                                        {cfg.label} — {cfg.count} × {cfg.digits}-digit Numbers
                                    </span>
                                    <span
                                        className="text-[10px] font-bold px-2 py-0.5 rounded-full"
                                        style={{
                                            background: isFull ? 'rgba(52,211,153,0.15)' : 'rgba(255,255,255,0.05)',
                                            color: isFull ? '#34d399' : cfg.color,
                                            border: `1px solid ${isFull ? 'rgba(52,211,153,0.3)' : cfg.border}`,
                                        }}
                                    >
                                        {nums.length} / {cfg.count}
                                    </span>
                                </div>

                                {/* Chips */}
                                {nums.length > 0 && (
                                    <div className="flex flex-wrap gap-1.5 mb-3">
                                        {nums.map((n, i) => (
                                            <span
                                                key={i}
                                                className="flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-mono font-bold"
                                                style={{ background: 'rgba(255,255,255,0.06)', color: cfg.color, border: `1px solid ${cfg.border}` }}
                                            >
                                                {n}
                                                <button
                                                    onClick={() => removeChip(cfg.key, i)}
                                                    className="ml-0.5 opacity-50 hover:opacity-100 transition-opacity"
                                                    style={{ color: cfg.color, lineHeight: 1 }}
                                                >
                                                    <FiX size={10} />
                                                </button>
                                            </span>
                                        ))}
                                    </div>
                                )}

                                {/* Paste / type area */}
                                {!isFull && (
                                    <div className="relative">
                                        <textarea
                                            rows={2}
                                            value={draft}
                                            onChange={e => setPasteDraft(prev => ({ ...prev, [cfg.key]: e.target.value }))}
                                            onPaste={e => {
                                                e.preventDefault();
                                                handlePasteDraft(cfg.key, cfg.digits, e.clipboardData.getData('text'));
                                            }}
                                            onKeyDown={e => {
                                                if (e.key === 'Enter') {
                                                    e.preventDefault();
                                                    handlePasteDraft(cfg.key, cfg.digits, draft);
                                                }
                                            }}
                                            placeholder={`Paste ${cfg.digits}-digit numbers here (space / newline separated)…`}
                                            className="w-full resize-none text-xs font-mono rounded-lg px-3 py-2.5 focus:outline-none transition-colors placeholder-slate-600"
                                            style={{
                                                background: 'rgba(0,0,0,0.25)',
                                                border: `1px solid ${cfg.border}`,
                                                color: cfg.color,
                                            }}
                                        />
                                        {draft.trim() && (
                                            <button
                                                onClick={() => handlePasteDraft(cfg.key, cfg.digits, draft)}
                                                className="absolute right-2 bottom-2 text-[10px] font-bold px-2 py-0.5 rounded-md transition-colors"
                                                style={{ background: cfg.border, color: cfg.color }}
                                            >
                                                Add
                                            </button>
                                        )}
                                    </div>
                                )}
                                {isFull && (
                                    <p className="text-[10px] font-semibold" style={{ color: '#34d399' }}>
                                        ✓ Complete — {cfg.count} numbers entered
                                    </p>
                                )}
                            </div>
                        );
                    })}
                </div>

                {/* ── Footer ── */}
                <div className="px-6 py-4 border-t border-[#1e293b] flex items-center justify-between gap-4 shrink-0">
                    <div className="text-xs text-slate-500">
                        All prizes must be complete before confirming.
                    </div>
                    <div className="flex gap-3">
                        <button onClick={onClose} className="px-5 py-2 font-medium text-slate-400 hover:text-white transition-colors text-sm">
                            Cancel
                        </button>
                        <button
                            onClick={onSubmit}
                            disabled={resolving}
                            className="bg-indigo-600 hover:bg-indigo-500 text-white px-6 py-2 rounded-xl font-semibold transition-colors disabled:opacity-60 shadow-lg shadow-indigo-500/20 text-sm"
                        >
                            {resolving ? 'Processing...' : 'Confirm & Announce'}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
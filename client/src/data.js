const TIME_SLOTS = [
    { label: '12 AM', value: '00:00' }, { label: '1 AM', value: '01:00' },
    { label: '2 AM', value: '02:00' }, { label: '3 AM', value: '03:00' },
    { label: '4 AM', value: '04:00' }, { label: '5 AM', value: '05:00' },
    { label: '6 AM', value: '06:00' }, { label: '7 AM', value: '07:00' },
    { label: '8 AM', value: '08:00' }, { label: '9 AM', value: '09:00' },
    { label: '10 AM', value: '10:00' }, { label: '11 AM', value: '11:00' },
    { label: '12 PM', value: '12:00' }, { label: '1 PM', value: '13:00' },
    { label: '2 PM', value: '14:00' }, { label: '3 PM', value: '15:00' },
    { label: '4 PM', value: '16:00' }, { label: '5 PM', value: '17:00' },
    { label: '6 PM', value: '18:00' }, { label: '7 PM', value: '19:00' },
    { label: '8 PM', value: '20:00' }, { label: '9 PM', value: '21:00' },
    { label: '10 PM', value: '22:00' }, { label: '11 PM', value: '23:00' },
];

const STATUS_COLORS = {
    open: 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20',
    closed: 'bg-amber-500/10 text-amber-400 border border-amber-500/20',
    processing: 'bg-blue-500/10 text-blue-400 border border-blue-500/20',
    completed: 'bg-slate-700/50 text-slate-400 border border-slate-600',
};

// ── Prize configs ──
const PRIZE_CONFIG = [
    { key: 'second', label: '2nd Prize', digits: 5, count: 10, color: '#f59e0b', bg: 'rgba(245,158,11,0.08)', border: 'rgba(245,158,11,0.25)' },
    { key: 'third', label: '3rd Prize', digits: 4, count: 10, color: '#60a5fa', bg: 'rgba(96,165,250,0.08)', border: 'rgba(96,165,250,0.25)' },
    { key: 'fourth', label: '4th Prize', digits: 4, count: 10, color: '#a78bfa', bg: 'rgba(167,139,250,0.08)', border: 'rgba(167,139,250,0.25)' },
    { key: 'fifth', label: '5th Prize', digits: 4, count: 100, color: '#34d399', bg: 'rgba(52,211,153,0.08)', border: 'rgba(52,211,153,0.25)' },
];

export { TIME_SLOTS, STATUS_COLORS, PRIZE_CONFIG };
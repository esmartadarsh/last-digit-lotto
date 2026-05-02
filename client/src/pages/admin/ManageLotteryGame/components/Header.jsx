import { FiPlus, FiActivity } from 'react-icons/fi'

export default function Header({ setShowGameForm, setShowDrawForm, games }) {
    return (
        <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
                <h1 className="text-3xl font-bold text-white tracking-tight">Lottery Game Manager</h1>
                <p className="text-slate-400 text-sm mt-1">Create lottery games and manage their draws & results.</p>
            </div>
            <div className="flex gap-3">
                <button
                    onClick={() => { setShowGameForm(v => !v); setShowDrawForm(false); }}
                    className="flex items-center gap-2 px-4 py-2.5 rounded-xl font-semibold text-sm bg-indigo-600 hover:bg-indigo-500 transition-colors shadow-lg shadow-indigo-500/20"
                >
                    <FiPlus size={16} /> New Game
                </button>
                <button
                    onClick={() => { setShowDrawForm(v => !v); setShowGameForm(false); }}
                    disabled={games.length === 0}
                    className="flex items-center gap-2 px-4 py-2.5 rounded-xl font-semibold text-sm bg-red-600 hover:bg-red-500 transition-colors shadow-lg shadow-red-500/20 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    <FiActivity size={16} /> New Draw
                </button>
            </div>
        </div>
    )
}
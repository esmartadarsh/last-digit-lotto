import { FiX } from 'react-icons/fi'

export default function GameForm({ show, onClose, onSubmit, gameName, gameSlug, setGameName, setGameSlug, loading }) {
    if (!show) return null;
    return (
        <div className="bg-[#1e293b] border border-indigo-500/30 rounded-2xl p-6 shadow-xl">
            <div className="flex justify-between items-start mb-6">
                <div>
                    <h2 className="text-lg font-bold text-white">Create Lottery Game</h2>
                    <p className="text-sm text-slate-400 mt-1">Add a new lottery game that players can participate in.</p>
                </div>
                <button onClick={() => onClose()} className="text-slate-400 hover:text-white transition-colors p-1">
                    <FiX size={20} />
                </button>
            </div>
            <form onSubmit={onSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                    <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Game Name</label>
                    <input type="text" value={gameName} onChange={e => setGameName(e.target.value)} placeholder="e.g. Nagaland State Lottery"
                        className="w-full bg-[#0f172a] border border-slate-700 rounded-xl px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition-colors" />
                </div>
                <div>
                    <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Slug (URL key)</label>
                    <input type="text" value={gameSlug} onChange={e => setGameSlug(e.target.value)} placeholder="e.g. nagaland"
                        className="w-full bg-[#0f172a] border border-slate-700 rounded-xl px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition-colors" />
                </div>
                <div className="md:col-span-2 flex justify-end">
                    <button type="submit" disabled={loading}
                        className="bg-indigo-600 hover:bg-indigo-500 text-white px-6 py-2.5 rounded-xl font-semibold transition-colors disabled:opacity-60">
                        {loading ? 'Creating...' : 'Create Game'}
                    </button>
                </div>
            </form>
        </div>
    )
}
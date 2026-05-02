import { FiX, FiImage, FiTrash2 } from 'react-icons/fi';
import ImageCropperModal from '@/components/ImageCropperModal';
import { TIME_SLOTS } from '@/data.js';

export default function DrawForm({
    show,
    onClose,
    onSubmit,
    games,

    selectedGameId,
    setSelectedGameId,
    drawDate,
    setDrawDate,
    drawHour,
    setDrawHour,
    ticketPrice,
    setTicketPrice,

    bannerPreview,
    setBannerPreview,
    setBannerBlob,

    showCropper,
    setShowCropper,

    loading,
    uploading
}) {
    if (!show) return null;

    return (
        <>
            <div className="bg-[#1e293b] border border-red-500/30 rounded-2xl p-6 shadow-xl">

                {/* Header */}
                <div className="flex justify-between items-start mb-6">
                    <div>
                        <h2 className="text-lg font-bold text-white">Create Lottery Draw</h2>
                        <p className="text-sm text-slate-400 mt-1">
                            Schedule a new draw for a lottery game.
                        </p>
                    </div>

                    <button onClick={onClose} className="text-slate-400 hover:text-white p-1">
                        <FiX size={20} />
                    </button>
                </div>

                {/* Form */}
                <form onSubmit={onSubmit} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">

                    {/* Game */}
                    <div>
                        <label className="label">Game</label>
                        <select
                            value={selectedGameId}
                            onChange={(e) => setSelectedGameId(e.target.value)}
                            className="input"
                        >
                            <option value="">Select a game...</option>
                            {games.map(g => (
                                <option key={g.id} value={g.id}>{g.name}</option>
                            ))}
                        </select>
                    </div>

                    {/* Date */}
                    <div>
                        <label className="label">Draw Date</label>
                        <input
                            type="date"
                            value={drawDate}
                            onChange={(e) => setDrawDate(e.target.value)}
                            className="input"
                        />
                    </div>

                    {/* Time */}
                    <div>
                        <label className="label">Time Slot</label>
                        <select
                            value={drawHour}
                            onChange={(e) => setDrawHour(e.target.value)}
                            className="input"
                        >
                            <option value="">Select time...</option>
                            {TIME_SLOTS.map(s => (
                                <option key={s.value} value={s.value}>{s.label}</option>
                            ))}
                        </select>
                    </div>

                    {/* Price */}
                    <div>
                        <label className="label">Ticket Price (₹)</label>
                        <input
                            type="number"
                            value={ticketPrice}
                            onChange={(e) => setTicketPrice(e.target.value)}
                            placeholder="e.g. 100"
                            min="1"
                            step="0.01"
                            className="input"
                        />
                    </div>

                    {/* Banner */}
                    <div className="md:col-span-4 flex flex-col gap-4">

                        <div>
                            <label className="label">Draw Banner Image (1920×1080)</label>

                            {bannerPreview ? (
                                <div className="relative rounded-xl overflow-hidden border border-slate-700 group" style={{ maxHeight: 180 }}>

                                    <img src={bannerPreview} className="w-full object-cover" />

                                    <button
                                        type="button"
                                        onClick={() => {
                                            setBannerBlob(null);
                                            setBannerPreview(null);
                                        }}
                                        className="absolute top-2 right-2 p-1.5 bg-black/70 hover:bg-red-600 text-white rounded-lg opacity-0 group-hover:opacity-100"
                                    >
                                        <FiTrash2 size={14} />
                                    </button>
                                </div>
                            ) : (
                                <button
                                    type="button"
                                    onClick={() => setShowCropper(true)}
                                    className="w-full h-24 rounded-xl border-2 border-dashed border-slate-600 hover:border-red-500 flex items-center justify-center gap-2 text-slate-500 hover:text-red-400 transition-colors"
                                >
                                    <FiImage size={20} />
                                    <span class="text-sm font-medium">
                                        Upload Banner (optional)
                                    </span>
                                </button>
                            )}

                            {bannerPreview && (
                                <button
                                    type="button"
                                    onClick={() => setShowCropper(true)}
                                    className="text-xs text-slate-400 hover:text-white mt-1.5"
                                >
                                    ↑ Change image
                                </button>
                            )}
                        </div>

                        {/* Submit */}
                        <div className="flex justify-end">
                            <button
                                type="submit"
                                disabled={loading || uploading}
                                className="bg-red-600 hover:bg-red-500 text-white px-6 py-2.5 rounded-xl font-semibold disabled:opacity-60"
                            >
                                {loading ? 'Creating Draw...' : 'Create Draw'}
                            </button>
                        </div>

                    </div>

                </form>
            </div>
        </>
    );
}
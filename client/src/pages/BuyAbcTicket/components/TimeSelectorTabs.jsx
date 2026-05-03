export default function TimeSelectorTabs({ times = [], activeIndex = 0, onChange }) {
    return (
        <div className="flex bg-white px-4 pt-3 pb-1 gap-3">
            {times.map((t, i) => (
                <button
                    key={t}
                    onClick={() => onChange(i)}
                    className="px-5 py-2 rounded-lg text-sm font-black active:scale-95 transition-all"
                    style={
                        i === activeIndex
                            ? {
                                border: "2px solid #2e7d32",
                                color: "#2e7d32",
                                background: "#f0fdf4",
                            }
                            : {
                                border: "1px solid #597b5a82",
                                background: "transparent",
                                color: "#9ca3af",
                            }
                    }
                >
                    {t}
                </button>
            ))}
        </div>
    );
}
export default function Tabs({
    activeTab,
    onChange,
    tabs = [
        { key: "buying", label: "Buying" },
        { key: "history", label: "Result History" },
    ],
}) {
    return (
        <div className="mx-4 mt-4 flex border-b-2 border-gray-200">
            {tabs.map((tab) => (
                <button
                    key={tab.key}
                    onClick={() => onChange(tab.key)}
                    className="flex-1 pb-2.5 text-sm font-black transition-all active:scale-95 relative"
                    style={{ color: activeTab === tab.key ? "#dc2626" : "#9ca3af" }}
                >
                    {tab.label}
                    {activeTab === tab.key && (
                        <div
                            className="absolute bottom-0 left-0 right-0 h-[3px] rounded-full"
                            style={{ background: "linear-gradient(90deg, #dc2626, #ef4444)" }}
                        />
                    )}

                </button>
            ))}
        </div>
    );
}
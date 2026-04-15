import React from "react";

export default function Tabs({ tabs = [], activeTab, onChange }) {
    return (
        <div className="flex bg-white mx-3 mt-3 rounded-xl overflow-hidden border border-gray-100">
            {tabs.map((tab) => (
                <button
                    key={tab.key}
                    onClick={() => onChange(tab.key)}
                    className="flex-1 py-2.5 text-sm font-black transition-all relative"
                    style={{
                        color: activeTab === tab.key ? "#1b5e20" : "#9ca3af",
                        background: "transparent",
                        borderBottom:
                            activeTab === tab.key
                                ? "3px solid #2e7d32"
                                : "3px solid transparent",
                    }}
                >
                    {tab.label}
                </button>
            ))}
        </div>
    );
}
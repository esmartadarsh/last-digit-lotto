import img1 from "@/assets/imgs/results/2024-04-04_01-00-PM.webp";
import img2 from "@/assets/imgs/results/2026-04-03_06-00-PM.webp";
import img3 from "@/assets/imgs/results/2026-04-03_08-00-PM.webp";
import { useState } from "react";

const formatDateTime = (dateStr, timeStr) => {
    const date = new Date(`${dateStr}T${timeStr}`);

    const day = date.getDate();
    const suffix =
        day % 10 === 1 && day !== 11 ? "st" :
            day % 10 === 2 && day !== 12 ? "nd" :
                day % 10 === 3 && day !== 13 ? "rd" : "th";

    const formattedDate = `${day}${suffix} ${date.toLocaleString("en-IN", { month: "long" })}`;

    const formattedTime = date.toLocaleString("en-IN", {
        hour: "numeric",
        minute: "2-digit",
        hour12: true
    });

    return `${formattedDate} • ${formattedTime} Draw`;
};

const resultsData = [
    {
        date: "2026-04-03",
        results: [
            {
                time: "18:00",
                balls: ["3", "1", "B", "7", "4", "9", "2", "5"],
                prize: "₹1,00,000",
                image: img2
            },
            {
                time: "20:00",
                balls: ["9", "2", "A", "4", "1", "8", "3", "6"],
                prize: "₹50,000",
                image: img3
            }
        ]
    },
    {
        date: "2024-04-04",
        results: [
            {
                time: "13:00",
                balls: ["5", "7", "K", "3", "2", "1", "8", "0"],
                prize: "₹25,000",
                image: img1
            }
        ]
    }
];

export default function ResultsSection() {
    const [selectedImage, setSelectedImage] = useState(null);

    return (
        <div className="px-4 mt-6 pb-36 flex flex-col gap-4">

            {resultsData.map((day, i) => (
                <div key={i} className="flex flex-col gap-3">

                    {/* Day Heading */}
                    <h2 className="text-sm font-bold text-gray-500">
                        {new Date(day.date).toLocaleDateString("en-IN", {
                            weekday: "long",
                            day: "numeric",
                            month: "long",
                            year: "numeric"
                        })}
                    </h2>

                    {day.results.map((result, j) => (
                        <div
                            key={j}
                            onClick={() => setSelectedImage(result.image)}
                            className="w-full rounded-2xl overflow-hidden cursor-pointer transition active:scale-[0.98]"
                            style={{
                                background: "#fff",
                                boxShadow: "0 6px 18px rgba(0,0,0,0.06)",
                                border: "1px solid #f1f5f9"
                            }}
                        >
                            <div className="px-4 py-3 flex justify-between items-center">

                                {/* Left */}
                                <div className="flex flex-col">
                                    <p className="text-[13px] font-semibold text-gray-800">
                                        {formatDateTime(day.date, result.time)}
                                    </p>
                                    <span className="text-[11px] text-gray-400">
                                        Tap to view result
                                    </span>
                                </div>

                                {/* Right */}
                                <div className="text-right">
                                    <p className="text-[12px] font-bold text-purple-700">
                                        🏆 {result.prize}
                                    </p>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            ))}

            {/* Image Modal */}
            {selectedImage && (
                <div
                    onClick={() => setSelectedImage(null)}
                    className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50"
                >
                    <img
                        src={selectedImage}
                        alt="Result"
                        className="max-w-[92%] max-h-[92%] rounded-xl shadow-2xl"
                    />
                </div>
            )}
        </div>
    );
}
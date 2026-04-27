import { useState, useMemo } from "react";
import imgFallback from "@/assets/imgs/results/2026-04-03_06-00-PM.webp"; // Using one as default fallback if URL missing

const formatDateTime = (dateStr, timeStr) => {
    // Note: since the API provides a full datetime, we may just format that directly
    const date = new Date(`${dateStr}T${timeStr}`);
    if (isNaN(date)) {
        // Fallback for full ISO string handling
        const isoDate = new Date(dateStr);
        if(!isNaN(isoDate)){
            return formatDateTimeFromISO(isoDate);
        }
    }

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

const formatDateTimeFromISO = (date) => {
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

export default function ResultsSection({ data = [] }) {
    const [selectedImage, setSelectedImage] = useState(null);

    // Group the results by date
    const groupedData = useMemo(() => {
        const groups = {};
        data.forEach(r => {
            const fullDate = r.draw?.scheduled_at ? new Date(r.draw.scheduled_at) : new Date(r.announced_at);
            const dateStr = fullDate.toISOString().split("T")[0];
            
            if (!groups[dateStr]) {
                groups[dateStr] = { date: dateStr, results: [] };
            }
            
            groups[dateStr].results.push({
                time: fullDate, // Using full date object for time
                balls: r.winning_number ? r.winning_number.split("") : [], // Split 8 chars into balls
                prize: r.draw?.game?.name || "1st Prize", // Assuming game name or fallback
                image: r.result_image_url || imgFallback
            });
        });
        
        // Convert to array and sort by date descending
        return Object.values(groups).sort((a, b) => new Date(b.date) - new Date(a.date));
    }, [data]);

    return (
        <div className="px-4 mt-6 pb-36 flex flex-col gap-4">

            {groupedData.map((day, i) => (
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
                                        {formatDateTimeFromISO(result.time)}
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
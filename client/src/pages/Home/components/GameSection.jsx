import formatTime from "../../../utils/formatTime"

export default function GameSection({ title, data, timers }) {
    <div className="px-4 mt-6">
        <h3 className="text-[17px] font-black text-gray-900 mb-3">{title}</h3>

        <div className="grid grid-cols-2 gap-3">
            {data.map((item, i) => (
                <div key={i} className="relative rounded-2xl overflow-hidden">
                    <img src={item.img} className="w-full h-full object-cover" />
                    <div className="absolute bottom-2 left-2 bg-black/60 px-2 py-1 text-white text-xs rounded">
                        ⏱ {formatTime(timers[i])}
                    </div>
                </div>
            ))}
        </div>
    </div>
};
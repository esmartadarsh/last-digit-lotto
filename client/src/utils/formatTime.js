export default function formatTime(seconds) {
    const hrs = String(Math.floor(seconds / 3600)).padStart(2, "0");
    const mins = String(Math.floor((seconds % 3600) / 60)).padStart(2, "0");
    const secs = String(seconds % 60).padStart(2, "0");
    // return `${hrs}\u00A0\u00A0\u00A0${mins}\u00A0\u00A0\u00A0${secs}`;
    return `${hrs} : ${mins} : ${secs}`;
}
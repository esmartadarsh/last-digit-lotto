export default function formatDate12Hour(dateString) {
    if (!dateString) return "N/A";
    const date = new Date(dateString);
    return date.toLocaleString('en-IN', {
        day: '2-digit', month: '2-digit', year: 'numeric',
        hour: 'numeric', minute: '2-digit', hour12: true
    });
}

export function formatTime12Hour(timeSlot) {
    if (!timeSlot) return "";
    const parts = timeSlot.split(':');
    if (parts.length < 2) return timeSlot;
    const h = parts[0];
    const m = parts[1];
    let hours = parseInt(h, 10);
    const ampm = hours >= 12 ? 'PM' : 'AM';
    hours = hours % 12;
    hours = hours ? hours : 12; // the hour '0' should be '12'
    return `${hours}:${m} ${ampm}`;
}

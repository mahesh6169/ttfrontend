'use client';

const DAYS = [
  { value: '', label: 'All Days' },
  { value: 'today', label: "Today's Deals" },
  { value: 'weekend', label: 'Weekend Deals' },
  { value: 'monday', label: 'Monday' },
  { value: 'tuesday', label: 'Tuesday' },
  { value: 'wednesday', label: 'Wednesday' },
  { value: 'thursday', label: 'Thursday' },
  { value: 'friday', label: 'Friday' },
  { value: 'saturday', label: 'Saturday' },
  { value: 'sunday', label: 'Sunday' }
];

const DayFilter = ({ selectedDay, onDayChange }) => {
  const handleChange = (value) => {
    // Convert 'today' to actual day name
    if (value === 'today') {
      const dayNames = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
      value = dayNames[new Date().getDay()];
    }
    // Note: 'weekend' would need special handling on the backend
    // For now, we'll just pass it as-is
    onDayChange(value);
  };

  return (
    <div>
      <label className="block text-sm font-medium text-slate-700 mb-2">
        Day Filter
      </label>
      <div className="flex flex-wrap gap-2">
        {DAYS.slice(0, 3).map((day) => (
          <button
            key={day.value}
            onClick={() => handleChange(day.value)}
            className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
              selectedDay === day.value ||
              (day.value === '' && !selectedDay) ||
              (day.value === 'today' && selectedDay === getTodayName())
                ? 'bg-teal-600 text-white'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
          >
            {day.label}
          </button>
        ))}
      </div>
      <div className="flex flex-wrap gap-2 mt-2">
        {DAYS.slice(3).map((day) => (
          <button
            key={day.value}
            onClick={() => handleChange(day.value)}
            className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
              selectedDay === day.value
                ? 'bg-teal-600 text-white'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            {day.label}
          </button>
        ))}
      </div>
    </div>
  );
};

const getTodayName = () => {
  const dayNames = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
  return dayNames[new Date().getDay()];
};

export default DayFilter;

import { LineChart, Line, XAxis, YAxis, ResponsiveContainer } from 'recharts';

const attendanceData = [
  { week: 'W1', attendance: 82 },
  { week: 'W2', attendance: 85 },
  { week: 'W3', attendance: 78 },
  { week: 'W4', attendance: 88 },
  { week: 'W5', attendance: 91 },
  { week: 'W6', attendance: 88 },
];

export function AttendanceChart() {
  return (
    <div className="h-32">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={attendanceData}>
          <XAxis 
            dataKey="week" 
            axisLine={false}
            tickLine={false}
            tick={{ fontSize: 12, fill: '#6b7280' }}
          />
          <YAxis hide />
          <Line 
            type="monotone" 
            dataKey="attendance" 
            stroke="#10b981" 
            strokeWidth={2}
            dot={false}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
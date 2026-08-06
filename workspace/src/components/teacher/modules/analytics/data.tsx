// Teacher analytics module: shared mock datasets used across the analytics
// tab charts. No JSX render components live here.

export const classTrend = [
  { name: 'Jul', math: 78, sci: 80 },
  { name: 'Aug', math: 82, sci: 81 },
  { name: 'Sep', math: 79, sci: 83 },
  { name: 'Oct', math: 85, sci: 84 },
  { name: 'Nov', math: 88, sci: 86 },
]

export const subjectAverages = [
  { subject: 'Mathematics', avg: 88, color: 'oklch(0.6 0.18 300)' },
  { subject: 'English', avg: 82, color: 'oklch(0.55 0.14 162)' },
  { subject: 'Science', avg: 84, color: 'oklch(0.65 0.16 75)' },
  { subject: 'Hindi', avg: 85, color: 'oklch(0.62 0.2 25)' },
  { subject: 'Social Studies', avg: 80, color: 'oklch(0.7 0.15 200)' },
  { subject: 'Computer Science', avg: 89, color: 'oklch(0.55 0.16 250)' },
]

export const attendanceTrend = [
  { name: 'W1', v: 94.2 },
  { name: 'W2', v: 95.6 },
  { name: 'W3', v: 93.8 },
  { name: 'W4', v: 96.1 },
  { name: 'W5', v: 95.4 },
  { name: 'W6', v: 94.8 },
]

export const completionDonut = [
  { name: 'Submitted', value: 14, color: 'oklch(0.55 0.14 162)' },
  { name: 'Late', value: 2, color: 'oklch(0.65 0.16 75)' },
  { name: 'Missing', value: 2, color: 'oklch(0.62 0.2 25)' },
]

export const studentGrowth = [
  { name: 'Aarav S.', current: 88, previous: 82, trend: 'up' },
  { name: 'Diya P.', current: 92, previous: 90, trend: 'up' },
  { name: 'Vivaan R.', current: 76, previous: 84, trend: 'down' },
  { name: 'Ananya S.', current: 94, previous: 91, trend: 'up' },
  { name: 'Myra I.', current: 96, previous: 95, trend: 'up' },
  { name: 'Reyansh K.', current: 72, previous: 78, trend: 'down' },
]

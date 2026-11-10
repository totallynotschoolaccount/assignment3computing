// chartSetup.js
// Chart.js only draws the parts we register (Week 11 workshop).
import { BarElement, CategoryScale, Chart as ChartJS, Legend, LinearScale, Title, Tooltip } from 'chart.js';

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

// text and grid colours that are easy to read on our black background
ChartJS.defaults.color = '#a1a1aa';
ChartJS.defaults.borderColor = 'rgba(255, 255, 255, 0.08)';
ChartJS.defaults.font.family = "'Inter', Arial, sans-serif";
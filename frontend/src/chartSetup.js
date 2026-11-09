// chartSetup.js
// Chart.js only draws the parts we register (Week 11 workshop).
import { BarElement, CategoryScale, Chart as ChartJS, Legend, LinearScale, Title, Tooltip } from 'chart.js';

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

// text and grid colours that are easy to read on our dark background
ChartJS.defaults.color = '#c4d2e3';
ChartJS.defaults.borderColor = 'rgba(153,174,203,.15)';
ChartJS.defaults.font.family = "'DM Sans', sans-serif";
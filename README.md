# PhishFight Front-end (React + Vite)
# Use the ZIP File as that has all the modulus

A front-end-only prototype for the PhishFight URL risk detection project. The layout is aimed at non-technical users and includes URL input validation, a risk score/result presentation, plain-language warning signs, responsive CSS, and clear limitations.

Run locally

Requirements: Node.js 18+.

Run these commands one by one
```
npm install
npm run dev
```

Open the local URL printed by Vite. To check the production build:

```
npm run build
npm run preview
```

## Design / usability decisions

- Clear primary task and one prominent call to action.
- Responsive layout for mobile and desktop.
- Explicit labels, keyboard focus states, semantic sections, and live result announcements.
- Plain-language warning signs and a visible caveat that low risk is not a guarantee.
- Results are visually separated from the input and include a risk level plus a 0–100 score.
- Reduced-motion preference is respected.

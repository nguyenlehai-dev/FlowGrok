# React + TypeScript + Vite

This template provides a minimal setup to get React working in Vite with HMR and some ESLint rules.

## Local Grok Smoke

To test Grok locally with a real `storage_state.json`:

1. Start backend:

```bash
cd /home/vpsroot/projects/backend/-FlowGrok-BE
cp .env.example .env
docker compose --profile postgres up -d
```

2. Run the local smoke helper:

```bash
cd /home/vpsroot/projects/frontend/FlowGrok
FILE_PATH="/abs/path/to/storage_state.json" ./scripts/local-grok-smoke.sh
```

3. Start frontend UI:

```bash
npm install
npm run dev
```

Then:
- login with the smoke account printed by the script
- create an API key
- open `System Auth` in the header
- verify that key for the current browser session
- test `Profiles`, `API Docs`, and real Grok jobs locally

## Local Grok With Your Real Chrome Session

If Grok keeps blocking the container/browser session, you can point the local worker at your already-open Chrome session.

1. Open Chrome with remote debugging enabled:

```bash
google-chrome --remote-debugging-port=9222 --user-data-dir="$HOME/.flowgrok-chrome"
```

2. In that Chrome window:
- open `https://grok.com`
- complete any human verification manually
- confirm you can reach the real Grok UI

3. Start backend with:

```bash
cd /home/vpsroot/projects/backend/-FlowGrok-BE
PLAYWRIGHT_CDP_URL="http://127.0.0.1:9222" uvicorn main:app --reload --host 0.0.0.0 --port 8080
```

This makes the Grok/Flow worker attach to your real Chrome session instead of launching a fresh Chromium instance.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Oxc](https://oxc.rs)
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/)

## React Compiler

The React Compiler is not enabled on this template because of its impact on dev & build performances. To add it, see [this documentation](https://react.dev/learn/react-compiler/installation).

## Expanding the ESLint configuration

If you are developing a production application, we recommend updating the configuration to enable type-aware lint rules:

```js
export default defineConfig([
  globalIgnores(['dist']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      // Other configs...

      // Remove tseslint.configs.recommended and replace with this
      tseslint.configs.recommendedTypeChecked,
      // Alternatively, use this for stricter rules
      tseslint.configs.strictTypeChecked,
      // Optionally, add this for stylistic rules
      tseslint.configs.stylisticTypeChecked,

      // Other configs...
    ],
    languageOptions: {
      parserOptions: {
        project: ['./tsconfig.node.json', './tsconfig.app.json'],
        tsconfigRootDir: import.meta.dirname,
      },
      // other options...
    },
  },
])
```

You can also install [eslint-plugin-react-x](https://github.com/Rel1cx/eslint-react/tree/main/packages/plugins/eslint-plugin-react-x) and [eslint-plugin-react-dom](https://github.com/Rel1cx/eslint-react/tree/main/packages/plugins/eslint-plugin-react-dom) for React-specific lint rules:

```js
// eslint.config.js
import reactX from 'eslint-plugin-react-x'
import reactDom from 'eslint-plugin-react-dom'

export default defineConfig([
  globalIgnores(['dist']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      // Other configs...
      // Enable lint rules for React
      reactX.configs['recommended-typescript'],
      // Enable lint rules for React DOM
      reactDom.configs.recommended,
    ],
    languageOptions: {
      parserOptions: {
        project: ['./tsconfig.node.json', './tsconfig.app.json'],
        tsconfigRootDir: import.meta.dirname,
      },
      // other options...
    },
  },
])
```

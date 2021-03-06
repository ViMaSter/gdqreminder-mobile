# GDQ Reminder Mobile

This template should help get you started developing with Vue 3 in Vite.

## Local Development

1. [VSCode](https://code.visualstudio.com/)
2. Recommended extensions
3. [`nvm-windows 1.1.9`](https://github.com/coreybutler/nvm-windows) for npm + node.js version management
4. `nvm install latest` (node.js >=18.3.0, npm >= 8.12.1)
5. `nvm use latest` (>= 18.3.0)
6. `npm run dev`
7. Open `http://localhost:4437`

## Device Development

1. Instll [Android Studio](https://developer.android.com/studio) (it is not required to select anything custom here)
2. Run `npx run android`
3. Select `File` -> `Sync Project with Gradle Files`
4. (Optional) Pair your device with Android Studio
5. Click "Run"

## Type Support for `.vue` Imports in TS

TypeScript cannot handle type information for `.vue` imports by default, so we replace the `tsc` CLI with `vue-tsc` for type checking. In editors, we need [TypeScript Vue Plugin (Volar)](https://marketplace.visualstudio.com/items?itemName=johnsoncodehk.vscode-typescript-vue-plugin) to make the TypeScript language service aware of `.vue` types.

If the standalone TypeScript plugin doesn't feel fast enough to you, Volar has also implemented a [Take Over Mode](https://github.com/johnsoncodehk/volar/discussions/471#discussioncomment-1361669) that is more performant. You can enable it by the following steps:

1. Disable the built-in TypeScript Extension
    1) Run `Extensions: Show Built-in Extensions` from VSCode's command palette
    2) Find `TypeScript and JavaScript Language Features`, right click and select `Disable (Workspace)`
2. Reload the VSCode window by running `Developer: Reload Window` from the command palette.

## Customize configuration

See [Vite Configuration Reference](https://vitejs.dev/config/).

## Project Setup

```sh
npm install
```

### Compile and Hot-Reload for Development

```sh
npm run dev
```

### Type-Check, Compile and Minify for Production

```sh
npm run build
```

### Run Unit Tests with [Vitest](https://vitest.dev/)

```sh
npm run test:unit
```

### Lint with [ESLint](https://eslint.org/)

```sh
npm run lint
```

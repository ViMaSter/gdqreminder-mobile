# GDQ Reminder Mobile App

## Local Development

<img align="right" width="300" src="https://github.com/ViMaSter/gdqreminder-mobile/assets/1689033/bba6de50-4149-443e-9184-05c65dbfb636)">

1. Install [Visual Studio Code](https://code.visualstudio.com/)
2. 
    - For Windows: Install [`nvm-windows` 1.1.9 or later](https://github.com/coreybutler/nvm-windows) 
    - For other operating systems: Install [`nvm` 0.39.2 or later](https://github.com/nvm-sh/nvm#installing-and-updating)
3. Clone this repository
4. Open your clone inside Visual Studio Code and install the recommended extensions
5. Inside your clone of this repository run:  
   `nvm install && nvm use && npm install && npm run dev`
> [!Tip]  
> If `npm install` causes your terminal to freeze, kill your terminal process, open a new terminal instance, run `npm install -g npm` and try step 5 again
6. Open a browser with CORS disabled. Example for Chrome:
    > `--disable-web-security --user-data-dir="/tmp/google"`
7. Visit `http://localhost:4437`

> [!IMPORTANT]  
> The mobile app uses [native HTTP requests](https://capacitorjs.com/docs/apis/http) which allows accessing CORS-protected content without any restrictions. The only way to mimic this behavior in a browser is to disable CORS.

## On-Device Development

1. Install [Android Studio](https://developer.android.com/studio) using default settings
2. Pair your device with Android Studio
3. Complete all steps for [Local Development](#local-development)
4. Run `npm run launch`

<br clear="both"/>

## Type Support for `.vue` Imports in TS

TypeScript cannot handle type information for `.vue` imports by default, so we replace the `tsc` CLI with `vue-tsc` for type checking. In editors, we need [TypeScript Vue Plugin (Volar)](https://marketplace.visualstudio.com/items?itemName=johnsoncodehk.vscode-typescript-vue-plugin) to make the TypeScript language service aware of `.vue` types.

If the standalone TypeScript plugin doesn't feel fast enough to you, Volar has also implemented a [Take Over Mode](https://github.com/johnsoncodehk/volar/discussions/471#discussioncomment-1361669) that is more performant. You can enable it by the following steps:

1. Disable the built-in TypeScript Extension
    1) Run `Extensions: Show Built-in Extensions` from VSCode's command palette
    2) Find `TypeScript and JavaScript Language Features`, right click and select `Disable (Workspace)`
2. Reload the VSCode window by running `Developer: Reload Window` from the command palette.

## Faking a running marathon

Appending `#date=` followed by a string compatible for the `new Date()` constructor can be used to fake a current point in time. Per real 1 second, 20 minutes will pass in the app.
> Example: `#date=2024-01-18%2000:00:00` would result in the middle of AGDQ2024.

## Project Setup

```sh
npm install
```

### Compile and Hot-Reload for Development

```sh
npm run dev
```

### Run Unit Tests with [Vitest](https://vitest.dev/)
```sh
npm run test:unit
```

### Run End-to-End Tests with [Playwright](https://playwright.dev/)
```sh
# run once:
npx playwright install

# run to execute tests
npm run test:e2e
```

### Lint with [ESLint](https://eslint.org/)
```sh
npm run lint
```

This project is tested with Browserstack.

#!/usr/bin/env bash

set -uo pipefail

MAX_TEST_RETRIES=3

run_tests() {
    CI=1 npx playwright test -c playwright-ct.config.ts --reporter=line --workers=4
}

# Get direct dependencies only
deps=$(node -e '
const pkg=require("./package.json");
console.log(Object.keys(pkg.dependencies || {}).join("\n"));
')

for dep in $deps; do
    echo
    echo "=================================================="
    echo "Testing upgrade of $dep"
    echo "=================================================="

    current=$(node -p "require('./package.json').dependencies['$dep']")
    latest=$(npm view "$dep" version 2>/dev/null)

    if [ -z "$latest" ]; then
        echo "Could not determine latest version for $dep"
        continue
    fi

    echo "Current: $current"
    echo "Latest : $latest"

    if [[ "$current" == *"$latest"* ]]; then
        echo "Already at latest"
        continue
    fi

    cp package.json package.json.bak

    echo "Upgrading $dep -> ^$latest"
    npm pkg set "dependencies.$dep=^$latest"

    rm -rf node_modules package-lock.json

    if ! npm install; then
        echo "Install failed, restoring"
        mv package.json.bak package.json
        rm -rf node_modules package-lock.json
        npm install
        continue
    fi

    pass=false
    for attempt in $(seq 1 "$MAX_TEST_RETRIES"); do
        echo "Test attempt $attempt/$MAX_TEST_RETRIES"
        if run_tests; then
            pass=true
            break
        fi

        if [ "$attempt" -lt "$MAX_TEST_RETRIES" ]; then
            echo "Tests failed, retrying..."
        fi
    done

    if [ "$pass" = true ]; then
        echo "✅ PASS: keeping $dep@$latest"
        rm -f package.json.bak
    else
        echo "❌ FAIL: reverting $dep"

        mv package.json.bak package.json

        rm -rf node_modules package-lock.json
        npm install
    fi
done

echo
echo "Finished."
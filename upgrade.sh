#!/usr/bin/env bash

set -uo pipefail

MAX_TEST_RETRIES=3
MAX_INSTALL_RETRIES=3

run_tests() {
    CI=1 npx playwright test -c playwright-ct.config.ts --reporter=line --workers=4
}

has_dep_in_section() {
    local dep=$1
    local section=$2

    node - "$dep" "$section" <<'NODE'
const [dep, section] = process.argv.slice(2);
const pkg = require("./package.json");
const hasDep = pkg[section] && Object.prototype.hasOwnProperty.call(pkg[section], dep);
process.exit(hasDep ? 0 : 1);
NODE
}

parse_peer_requirements() {
    local log_file=$1

    node - "$log_file" <<'NODE'
const fs = require("fs");

const logPath = process.argv[2];
const lines = fs.readFileSync(logPath, "utf8").split(/\r?\n/);
const requirements = new Map();

for (const line of lines) {
    const conflicting = line.match(/Conflicting peer dependency:\s+(.+)$/);
    if (conflicting) {
        const depWithVersion = conflicting[1].trim();
        const splitAt = depWithVersion.lastIndexOf("@");
        if (splitAt > 0) {
            const name = depWithVersion.slice(0, splitAt);
            const version = depWithVersion.slice(splitAt + 1);
            if (name && version) {
                requirements.set(name, version);
            }
        }
        continue;
    }

    const peer = line.match(/(?:peer|peerOptional)\s+((?:@[^@\s"/]+\/)?[^@\s"]+)@"([^"]+)"/);
    if (!peer) {
        continue;
    }

    const [, name, range] = peer;
    if (!requirements.has(name)) {
        requirements.set(name, range);
    }
}

for (const [name, spec] of requirements.entries()) {
    console.log(`${name}\t${spec}`);
}
NODE
}

apply_peer_bumps_from_log() {
    local log_file=$1
    local bumped=0

    while IFS=$'\t' read -r peer_dep peer_spec; do
        [ -z "$peer_dep" ] && continue

        local resolved_version
        resolved_version=$(npm view "$peer_dep@$peer_spec" version 2>/dev/null || true)

        if [ -z "$resolved_version" ]; then
            resolved_version=$(npm view "$peer_dep" version 2>/dev/null || true)
        fi

        if [ -z "$resolved_version" ]; then
            echo "Could not resolve a version for peer dependency $peer_dep ($peer_spec)"
            continue
        fi

        local current_version
        current_version=$(node -p "const pkg=require('./package.json'); (pkg.dependencies?.['$peer_dep'] || pkg.devDependencies?.['$peer_dep'] || '')")

        if [[ "$current_version" == *"$resolved_version"* ]]; then
            continue
        fi

        if has_dep_in_section "$peer_dep" dependencies; then
            echo "Bumping dependency $peer_dep -> ^$resolved_version to satisfy peer requirement $peer_spec"
            npm pkg set "dependencies.$peer_dep=^$resolved_version"
        elif has_dep_in_section "$peer_dep" devDependencies; then
            echo "Bumping devDependency $peer_dep -> ^$resolved_version to satisfy peer requirement $peer_spec"
            npm pkg set "devDependencies.$peer_dep=^$resolved_version"
        else
            echo "Adding dependency $peer_dep -> ^$resolved_version to satisfy peer requirement $peer_spec"
            npm pkg set "dependencies.$peer_dep=^$resolved_version"
        fi

        bumped=1
    done < <(parse_peer_requirements "$log_file")

    [ "$bumped" -eq 1 ]
}

install_with_peer_retries() {
    local log_file
    log_file=$(mktemp)

    for attempt in $(seq 1 "$MAX_INSTALL_RETRIES"); do
        echo "Install attempt $attempt/$MAX_INSTALL_RETRIES"

        if npm install 2>&1 | tee "$log_file"; then
            rm -f "$log_file"
            return 0
        fi

        if ! grep -q "ERESOLVE could not resolve" "$log_file"; then
            rm -f "$log_file"
            return 1
        fi

        if [ "$attempt" -eq "$MAX_INSTALL_RETRIES" ]; then
            break
        fi

        if ! apply_peer_bumps_from_log "$log_file"; then
            echo "Detected ERESOLVE but found no peer dependencies to bump automatically"
            break
        fi

        rm -rf node_modules package-lock.json
    done

    rm -f "$log_file"
    return 1
}

# Get direct dependencies and devDependencies
targets=$(node -e '
const pkg=require("./package.json");
for (const section of ["dependencies", "devDependencies"]) {
    for (const dep of Object.keys(pkg[section] || {})) {
        console.log(`${section}\t${dep}`);
    }
}
')

while IFS=$'\t' read -r dep_section dep; do
    [ -z "$dep" ] && continue

    echo
    echo "=================================================="
    echo "Testing upgrade of $dep ($dep_section)"
    echo "=================================================="

    current=$(node -p "require('./package.json')['$dep_section']['$dep']")
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
    npm pkg set "$dep_section.$dep=^$latest"

    rm -rf node_modules package-lock.json

    if ! install_with_peer_retries; then
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
        echo "✅ PASS: keeping $dep@$latest ($dep_section)"
        rm -f package.json.bak
    else
        echo "❌ FAIL: reverting $dep ($dep_section)"

        mv package.json.bak package.json

        rm -rf node_modules package-lock.json
        npm install
    fi
done <<< "$targets"

echo
echo "Finished."
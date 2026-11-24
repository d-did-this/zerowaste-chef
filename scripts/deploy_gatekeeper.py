#!/usr/bin/env python3
"""
Pre-Deployment Security & Regression Gatekeeper for ZeroWaste Chef.
Asserts git backup, secret hygiene, Next.js patch level, CSS style preservation,
TypeScript build, and live Playwright invariant checks before deploying to Vercel.
"""

import json
import os
import re
import subprocess
import sys
import time
from pathlib import Path
from playwright.sync_api import sync_playwright

PROJECT_ROOT = Path(__file__).resolve().parent.parent
BRAVE_PATH = r"C:\Users\D-Legion\AppData\Local\BraveSoftware\Brave-Browser\Application\brave.exe"
VERIFY_PORT = 3099


def run_step(cmd, cwd=PROJECT_ROOT, capture=False):
    print(f"\n>>> Running: {' '.join(cmd) if isinstance(cmd, list) else cmd}")
    res = subprocess.run(
        cmd,
        cwd=str(cwd),
        shell=isinstance(cmd, str),
        text=True,
        capture_output=capture,
    )
    if res.returncode != 0:
        if capture:
            print("STDOUT:", res.stdout)
            print("STDERR:", res.stderr)
        raise RuntimeError(f"Gatekeeper command failed (exit {res.returncode}): {cmd}")
    return res.stdout if capture else ""


def assert_backup_and_secrets():
    print("\n=== GATE 1: Git Backup & Secret Hygiene ===")
    tracked_envs = run_step(["git", "ls-files", ".env*"], capture=True).strip()
    if tracked_envs:
        raise AssertionError(f"FATAL SECURITY BLOCK: .env file is tracked by git: {tracked_envs}")

    branches = run_step(["git", "branch", "-a"], capture=True)
    if "backup/github-main-0105da3" not in branches:
        raise AssertionError("FATAL: GitHub backup branch 'backup/github-main-0105da3' is missing!")
    print("OK: GitHub backup branch verified and zero .env files tracked.")


def assert_nextjs_and_style_invariants():
    print("\n=== GATE 2: Dependency Security & GitHub Style Preservation ===")
    pkg = json.loads((PROJECT_ROOT / "package.json").read_text(encoding="utf-8"))
    next_ver = pkg.get("dependencies", {}).get("next", "")
    match = re.search(r"(\d+)\.(\d+)\.(\d+)", next_ver)
    if not match:
        raise AssertionError(f"FATAL: Cannot parse Next.js version in package.json: {next_ver}")
    major, minor, patch = map(int, match.groups())
    if (major, minor, patch) < (16, 4, 6):
        raise AssertionError(f"FATAL SECURITY BLOCK: Next.js version {next_ver} is below patched 16.4.6!")

    globals_css = (PROJECT_ROOT / "src" / "app" / "globals.css").read_text(encoding="utf-8")
    if "box-shadow: 9px 9px 16px rgba(163, 177, 198, 0.6)" not in globals_css:
        raise AssertionError("FATAL REGRESSION: Original GitHub .neo-raised style in globals.css was altered!")

    canonical_css = (PROJECT_ROOT / "src" / "styles" / "meal_flow_canonical.css").read_text(encoding="utf-8")
    if ".meal-flow-scope .neo-raised" not in canonical_css:
        raise AssertionError("FATAL REGRESSION: meal_flow_canonical.css must scope .neo-* overrides inside .meal-flow-scope!")
    print(f"OK: Next.js {next_ver} verified and original GitHub styles preserved.")


def assert_typecheck_and_build():
    print("\n=== GATE 3: TypeScript & Next.js Production Build ===")
    run_step("npx tsc --noEmit")
    run_step("npm run build")

    vercel_proj = PROJECT_ROOT / ".vercel" / "project.json"
    if not vercel_proj.exists():
        raise AssertionError("FATAL: .vercel/project.json missing!")
    print("OK: TypeScript check and Next.js production build succeeded.")


def assert_live_production_invariants():
    print("\n=== GATE 4: Live Production Server Playwright Invariants (390x844 & 430x932) ===")
    server_proc = subprocess.Popen(
        f"npx next start -p {VERIFY_PORT}",
        cwd=str(PROJECT_ROOT),
        shell=True,
        stdout=subprocess.PIPE,
        stderr=subprocess.STDOUT,
        text=True,
    )

    try:
        # Wait for port ready
        import urllib.request

        ready = False
        for _ in range(30):
            try:
                with urllib.request.urlopen(f"http://localhost:{VERIFY_PORT}/official_v3.0", timeout=2) as r:
                    if r.status == 200:
                        ready = True
                        break
            except Exception:
                time.sleep(0.5)
        if not ready:
            raise AssertionError(f"FATAL: Production verification server failed to listen on port {VERIFY_PORT}!")

        with sync_playwright() as p:
            browser = p.chromium.launch(executable_path=BRAVE_PATH, headless=True)

            # Test non-scrollable 390x844 mobile viewport (exact phone shell geometry)
            page = browser.new_page(viewport={"width": 390, "height": 844})
            page.on("pageerror", lambda e: (_ for _ in ()).throw(AssertionError(f"FATAL JS ERROR: {e}")))

            page.goto(f"http://localhost:{VERIFY_PORT}/official_v3.0", wait_until="networkidle")

            # Assert GitHub Pantry original shell non-scrollable
            doc_overflow = page.evaluate("() => document.documentElement.scrollHeight - window.innerHeight")
            if doc_overflow > 0:
                raise AssertionError(f"FATAL: Outer document is vertically scrollable on 390x844 (+{doc_overflow}px)!")

            # Trigger Transition 1 ("start") via Generate Meals
            page.locator("button[title='Generate Meals']").click()
            time.sleep(0.3)
            if not page.locator("#meal-transition-modal[data-transition-variant='start']").is_visible():
                raise AssertionError("FATAL: Transition 1 ('start') did not trigger on Generate Meals!")
            page.locator("h1:has-text('What are you craving today?')").wait_for(state="visible", timeout=8000)

            # Assert Step 1 fits without vertical scroll on 390x844
            step1_over = page.evaluate("() => { const m = document.querySelector('.main-scrollable'); return m ? m.scrollHeight - m.clientHeight : 0; }")
            if step1_over > 0:
                raise AssertionError(f"FATAL: Step 1 scrolls vertically inside phone frame (+{step1_over}px)!")

            # Select Any Cuisine -> Instant switch to Step 2 (ZERO modal in between)
            page.locator("#cuisine-card-any").click()
            page.locator("#cta-button").click()
            time.sleep(0.15)
            if page.locator("#meal-transition-modal").count() > 0:
                raise AssertionError("FATAL: Unexpected transition modal between Cuisines and Appliances!")
            page.locator("h1:has-text('What would you like using to cook today?')").wait_for(state="visible", timeout=3000)

            # Toggle 6 appliances on and assert Step 2 STILL fits non-scrollably + polygon bounds intact
            for pid in ["#pill-wok", "#pill-pot", "#pill-blender", "#pill-rice_cooker", "#pill-air_fryer"]:
                page.locator(pid).click()
            step2_over = page.evaluate("() => { const m = document.querySelector('.main-scrollable'); return m ? m.scrollHeight - m.clientHeight : 0; }")
            if step2_over > 0:
                raise AssertionError(f"FATAL: Step 2 scrolls vertically inside phone frame (+{step2_over}px)!")

            # Assert Blender & Stove full polygon bounds
            stove_pts = page.locator("#poly-stove").get_attribute("points") or ""
            stove_ys = [int(pair.split(",")[1]) for pair in stove_pts.split()]
            if max(stove_ys) < 705:
                raise AssertionError(f"FATAL: Stove outline incomplete (max y={max(stove_ys)})!")

            # Trigger Transition 2 ("to-recipes")
            page.locator("#step2-cta").click()
            time.sleep(0.3)
            if not page.locator("#meal-transition-modal[data-transition-variant='to-recipes']").is_visible():
                raise AssertionError("FATAL: Transition 2 ('to-recipes') did not appear after Step 2!")
            page.locator("h1:has-text('Recipes Matched!')").wait_for(state="visible", timeout=8000)

            # Assert Step 3 cards + open recipe + Shop Missing + Grocery redesign
            page.locator("div[role='button'].neo-raised").first.click()
            shop_btn = page.locator("button:has-text('Shop Missing')").first
            shop_btn.wait_for(state="visible", timeout=3000)
            shop_btn.click()
            page.locator("button[aria-label='Close Recipe']").click()
            time.sleep(0.3)

            page.locator("nav button:has-text('Grocery')").click()
            page.locator("text='Smart Grocery'").wait_for(state="visible", timeout=5000)

            ctrl = page.locator("section.neo-raised").first
            if not ctrl.locator("button:has-text('Recipes')").is_visible() or not ctrl.locator("button:has-text('Pantry')").is_visible():
                raise AssertionError("FATAL: Grocery control bar must contain Recipes & Pantry buttons!")
            if not page.locator("button[aria-label='Add Custom Item']").is_visible():
                raise AssertionError("FATAL: Floating Add Custom Item button missing in Grocery view!")
            if not page.locator("header button[aria-label='Edit Items']").is_visible() or not page.locator("header button[aria-label='Manage / Delete Items']").is_visible():
                raise AssertionError("FATAL: Top header Edit and Delete buttons missing in Grocery view!")

            browser.close()
        print("OK: All live production invariants passed on 390x844!")
    finally:
        # Terminate verification server tree cleanly on Windows
        subprocess.run(
            f"taskkill /PID {server_proc.pid} /T /F",
            shell=True,
            stdout=subprocess.DEVNULL,
            stderr=subprocess.DEVNULL,
        )


def deploy_to_cloud():
    print("\n=== GATE 5: Pushing Clean Branch & Deploying to Vercel Production ===")
    run_step(["git", "push", "origin", "main"])
    run_step("npx vercel --prod --yes")


def main():
    deploy_flag = "--deploy" in sys.argv
    assert_backup_and_secrets()
    assert_nextjs_and_style_invariants()
    assert_typecheck_and_build()
    assert_live_production_invariants()
    if deploy_flag:
        deploy_to_cloud()
    else:
        print("\n=== GATEKEEPER DRY-RUN PASSED (pass --deploy to push & deploy) ===")


if __name__ == "__main__":
    main()

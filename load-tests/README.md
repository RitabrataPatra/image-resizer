# Local ExactSpec load tests

This directory contains a k6 test for the locally built static site. It does not
change application code or add application dependencies.

## What the script requests

The test selects among the homepage, the all-sizes directory, and the three
preset URLs currently published in `src/data/presets.ts` and present in `dist`:

- `/`
- `/all-sizes/`
- `/photo-50-kb/`
- `/passport-size-photo-35x45-mm/`
- `/signature-10-kb/`

The image resizer is embedded on the homepage and preset pages; it has no
separate route. Each virtual user cycles through the routes and requests
same-origin JS, CSS, and media assets found in each page. k6 keeps cookies in a
separate jar for each virtual user. Assets that succeeded are treated as
cached for that virtual user. External URLs are ignored, and redirects are not
followed.

## Prerequisites and setup (Windows PowerShell)

Install k6 with winget if it is not already installed:

```powershell
winget install --id Grafana.k6 --source winget
k6 version
```

Build the production site from the project directory:

```powershell
Set-Location E:\new\image-resizer
npm run build
```

In **Terminal 1**, start Astro's production preview, bound to loopback:

```powershell
Set-Location E:\new\image-resizer
npm run preview -- --host 127.0.0.1
```

Astro serves the generated `dist` output on port `4321`. Leave this terminal
running. In **Terminal 2**, check it locally:

```powershell
Set-Location E:\new\image-resizer
Invoke-WebRequest -Uri http://localhost:4321/ -UseBasicParsing
```

The script defaults to `http://localhost:4321`; `BASE_URL` accepts only
`http://localhost` or `http://127.0.0.1` with an optional port and refuses
public hostnames. Its URLs are never followed through redirects.

## Run the stages

Run one command at a time in Terminal 2, with Terminal 1 still serving the
site. `DURATION` is the steady-state hold time after four 30-second ramp-up
steps. Every test also ramps down for 30 seconds. The default hold time is
five minutes.

```powershell
k6 run .\load-tests\exactspec.js -e VUS=10 -e DURATION=5m
k6 run .\load-tests\exactspec.js -e VUS=50 -e DURATION=5m
k6 run .\load-tests\exactspec.js -e VUS=100 -e DURATION=5m
k6 run .\load-tests\exactspec.js -e VUS=250 -e DURATION=5m
k6 run .\load-tests\exactspec.js -e VUS=500 -e DURATION=5m
```

The 1,000-VU stage is opt-in and is not run automatically. Run it only when
you explicitly intend to test that load:

```powershell
k6 run .\load-tests\exactspec.js -e VUS=1000 -e DURATION=5m -e ALLOW_1000=YES
```

For a shorter run, replace `5m` with a duration such as `1m`. The script accepts
only the listed VU stages; a 1,000-VU run requires `ALLOW_1000=YES`.

## Criteria and reading results

The local test uses these thresholds:

- Fewer than 1% of HTTP requests fail.
- More than 99% of status checks pass.
- HTTP request p95 duration stays below 1,000 ms.

These are test criteria for this machine and configuration, not guarantees of
production or Vercel capacity. The k6 summary reports `http_reqs` throughput
(requests per second), request-duration percentiles including p95, and the
`request_failures` counter. A threshold failure means the run did not meet the
chosen local criteria; inspect response failures and machine CPU, memory, and
network use before drawing conclusions.

Stop the local preview with **Ctrl+C** in Terminal 1 after the tests finish.

## What this test does and does not establish

- It measures how this local Astro production preview serves selected static
  HTML pages and their same-origin built assets under concurrent HTTP requests.
- It does not run a real browser. In particular, k6 does not upload, decode,
  crop, resize, or encode images, so it does not measure the React image
  processing workload or browser rendering.
- It does not measure Vercel's CDN, edge network, deployment configuration, or
  public production capacity. Local results cannot prove that Vercel can handle
  the same load.
- The machine running k6 and the preview server can itself become the bottleneck;
  results describe this local test setup only.

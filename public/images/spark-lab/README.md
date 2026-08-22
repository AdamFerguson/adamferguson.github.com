# Screenshots for the "DGX Spark LLM lab" post

| File | Shown as | Status |
|---|---|---|
| `grafana-sglang.png` | The SGLang dashboard (throughput, latency, cache) | captured 2026-08-21, 2x, light theme, full dashboard |
| `grafana-host.png` | The host-overview dashboard (CPU, memory, GPU) | captured 2026-08-21, 2x, light theme |

Captured headlessly from the Spark's Grafana over Tailscale
(`100.71.216.115:3000`, admin login, theme forced to light).

`grafana-host.png` is cropped to the populated **System** and
**GPU (utilization + memory)** rows. The dashboard's lower rows —
GPU temp/power/throttle/SM clock, Thermal, Storage, Network,
Containers + Logs — render empty on the GB10 because those metrics
aren't exposed by the current exporter set, so they were cut out of
the blog image rather than ship a wall of blank panels. If those
exporters get data later, re-capture full-page.

No hostnames, IPs, or keys are visible in either image (the only
identifying string is the mesh label `adam-spark`, which the post
itself uses).

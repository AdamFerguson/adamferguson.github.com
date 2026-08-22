---
title: "A little LLM lab on the DGX Spark"
description: "How I set up a self-hosted, OpenAI-compatible LLM on an NVIDIA DGX Spark — SGLang, a LiteLLM gateway, and Grafana dashboards — all driven by one config file and one command."
date: 2026-08-20
tags:
  - llm
  - infrastructure
  - self-hosting
  - gpu
category: Infrastructure
---

For a while I wanted to run a serious model at home — one I could actually point my
tools at, watch it work, and not think about. Not a cloud endpoint I pay per token,
and not a laptop that chokes. Just: a model, a clean way to talk to it, and a
dashboard I could trust.

That's what ended up living on my DGX Spark. A single desktop box, quiet enough to
sit on a desk, now runs a 27B-class model and serves it the way my tools expect — and
the whole thing is described in one config file.

Everything in this post — the CLI, the model recipes, the dashboards, the docs —
lives in the [spark-lab](https://github.com/AdamFerguson/spark-lab) repo.

## The stack, in plain terms

<svg viewBox="0 0 780 320" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Architecture: a DGX Spark serves a model via SGLang, fronted by a LiteLLM gateway, observed by Prometheus and Grafana, and reached over Tailscale or an optional Cloudflare Tunnel." style="width:100%;height:auto;font-family:inherit;max-width:720px">
  <style>
    .arch-label { fill: var(--text); }
    .arch-sub { fill: var(--text-muted); }
    .arch-box { fill: var(--surface); stroke: var(--accent); }
    .arch-box--muted { stroke: var(--text-muted); }
    .arch-box--alt { fill: var(--surface-alt); }
    .arch-line { stroke: var(--text-muted); }
    .arch-line--accent { stroke: var(--accent); }
    .arch-bound { fill: none; stroke: var(--border); }
    .arch-mark { fill: var(--text-muted); }
  </style>
  <defs>
    <marker id="arch-ar" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
      <path d="M0,0 L10,5 L0,10 z" class="arch-mark"/>
    </marker>
  </defs>
  <text x="40" y="30" class="arch-sub" font-size="13">NVIDIA DGX Spark (GB10, unified memory)</text>
  <rect x="20" y="42" width="740" height="150" rx="14" class="arch-bound" stroke-width="1.5" stroke-dasharray="4 4"/>
  <rect x="60" y="82" width="170" height="70" rx="10" class="arch-box" stroke-width="1.5"/>
  <text x="145" y="112" text-anchor="middle" class="arch-label" font-size="15" font-weight="600">SGLang</text>
  <text x="145" y="132" text-anchor="middle" class="arch-sub" font-size="12">:30000 · /metrics</text>
  <rect x="305" y="82" width="184" height="70" rx="10" class="arch-box" stroke-width="1.5"/>
  <text x="397" y="107" text-anchor="middle" class="arch-label" font-size="15" font-weight="600">LiteLLM gateway</text>
  <text x="397" y="127" text-anchor="middle" class="arch-sub" font-size="12">:4000 · keys + spend</text>
  <text x="397" y="143" text-anchor="middle" class="arch-sub" font-size="11">Postgres · Redis</text>
  <rect x="560" y="55" width="160" height="52" rx="10" class="arch-box arch-box--muted" stroke-width="1.3"/>
  <text x="640" y="76" text-anchor="middle" class="arch-label" font-size="14" font-weight="600">Prometheus</text>
  <text x="640" y="94" text-anchor="middle" class="arch-sub" font-size="11.5">:9090</text>
  <rect x="560" y="120" width="160" height="52" rx="10" class="arch-box arch-box--muted" stroke-width="1.3"/>
  <text x="640" y="141" text-anchor="middle" class="arch-label" font-size="14" font-weight="600">Grafana</text>
  <text x="640" y="159" text-anchor="middle" class="arch-sub" font-size="11.5">:3000</text>
  <line x1="230" y1="117" x2="300" y2="117" class="arch-line" stroke-width="1.5" marker-end="url(#arch-ar)"/>
  <line x1="489" y1="104" x2="555" y2="81" class="arch-line" stroke-width="1.3" marker-end="url(#arch-ar)"/>
  <line x1="640" y1="107" x2="640" y2="118" class="arch-line" stroke-width="1.3" marker-end="url(#arch-ar)"/>
  <rect x="60" y="232" width="200" height="54" rx="10" class="arch-box arch-box--alt" stroke-width="1.3"/>
  <text x="160" y="255" text-anchor="middle" class="arch-label" font-size="13.5" font-weight="600">Tailscale</text>
  <text x="160" y="273" text-anchor="middle" class="arch-sub" font-size="11.5">private mesh</text>
  <rect x="330" y="232" width="210" height="54" rx="10" class="arch-box arch-box--alt arch-box--muted" stroke-width="1.3"/>
  <text x="435" y="255" text-anchor="middle" class="arch-label" font-size="13.5" font-weight="600">Cloudflare Tunnel</text>
  <text x="435" y="273" text-anchor="middle" class="arch-sub" font-size="11.5">optional · public</text>
  <text x="640" y="258" text-anchor="middle" class="arch-label" font-size="13.5" font-weight="600">your client</text>
  <text x="640" y="276" text-anchor="middle" class="arch-sub" font-size="11.5">OpenAI SDK</text>
  <line x1="175" y1="232" x2="360" y2="158" class="arch-line--accent" stroke-width="1.3" stroke-dasharray="5 4" marker-end="url(#arch-ar)"/>
  <line x1="435" y1="232" x2="420" y2="158" class="arch-line" stroke-width="1.3" stroke-dasharray="5 4" marker-end="url(#arch-ar)"/>
</svg>

The short version: **SGLang** runs the model and speaks an OpenAI-compatible API.
**LiteLLM** sits in front of it as the thing I actually talk to — it hands out API
keys, tracks spend, and gives the model a stable name that survives me swapping
models underneath. **Prometheus** scrapes metrics from the model, the GPU, and the
host, and **Grafana** turns that into dashboards I can actually read. **Tailscale**
lets me reach the gateway from any of my machines over a private mesh; a
**Cloudflare Tunnel** is there if I ever want to share it with a friend.

Nothing here is exotic. The interesting part is how little I have to manage.

## One config, one command

Instead of a pile of copy-pasted scripts, everything is generated from a single
`config.yaml`. Pick the model, the ports, which dashboards you want, whether you
want the tunnel on. Then:

```
$ spark-lab init
$ spark-lab apply
```

`apply` is the part I like. It's declarative: it renders the whole stack from your
config, works out what actually changed since the last time you ran it, and only
touches that. Change the model, add a dashboard, bump a port — run `apply` again and
the node converges to the new state. No more "which of the three files did I edit,
and which service do I need to restart?"

Here it is actually running — SGLang up, and the gateway plus its supporting
services healthy:

```
$ sparkrun status
Job: recipes/qwen38-27b-dspark-nvfp4.yaml  [62cafcefd78a4fcf]  (1 container)
  solo       127.0.0.1                                 Up 27 hours   lmsysorg/sglang:qwen38-27b
  logs: sparkrun logs 62cafcefd78a4fcf
  stop: sparkrun stop 62cafcefd78a4fcf

Total: 1 container(s) across 1 host(s)

$ docker compose ps
NAME                     SERVICE          STATUS
litellm-litellm-1        litellm          Up 7 hours        0.0.0.0:4000->4000/tcp
litellm-db-1             db               Up 43 hours (healthy)
litellm-redis-1          redis            Up 43 hours (healthy)  0.0.0.0:6379->6379/tcp
litellm-prometheus-1     prometheus       Up 42 hours       0.0.0.0:9090->9090/tcp
litellm-grafana-1        grafana          Up 43 hours       0.0.0.0:3000->3000/tcp
litellm-node_exporter-1  node_exporter    Up 31 hours       0.0.0.0:9100->9100/tcp
litellm-dcgm_exporter-1  dcgm_exporter    Up 42 hours       0.0.0.0:9835->9835/tcp
```

And the GPU is doing work — two processes, the model and its scheduler:

```
$ nvidia-smi
|   0  NVIDIA GB10                    On  |  0000000F:01:00.0 Off |       N/A |
| N/A   66C    P0             43W /  N/A  |  Not Supported        |    96%    |
+-----------------------------------------------------------------------------------------+
| Processes:                                                                              |
|    0   N/A  N/A         925214      C   /usr/bin/python3                        6316MiB |
|    0   N/A  N/A         926002      C   sglang::scheduler                       10223MiB |
```

(That `Not Supported` for memory is the GB10 being honest with you: the GPU shares
unified memory with the host, so it doesn't report a fixed VRAM number the way a
discrete card would. The monitoring stack accounts for that.)

## What you get

A Grafana you can actually read is the payoff. There's an SGLang dashboard —
request latency, time-to-first-token, throughput, queue depth, cache-hit rate —
and a host-overview one tuned for the GB10.

<figure>
  <img src="/images/spark-lab/grafana-sglang.png" alt="Grafana SGLang dashboard" width="1200" loading="lazy" />
  <figcaption>The SGLang dashboard: live throughput, latency, and cache metrics.</figcaption>
</figure>

<figure>
  <img src="/images/spark-lab/grafana-host.png" alt="Grafana host overview dashboard" width="1200" loading="lazy" />
  <figcaption>The host overview: CPU, memory, and the GPU, in one place.</figcaption>
</figure>

Reaching the model is just "point any OpenAI-compatible client at the gateway with
your key":

```
curl http://<your-spark>:4000/v1/models -H "Authorization: Bearer $LITELLM_MASTER_KEY"
```

Over Tailscale it's even simpler — the Spark shows up on the mesh like any other
device, so any of my laptops can use the model without a single open port:

```
$ tailscale status
100.71.216.115   my-spark     linux
100.86.52.50     pop-os       linux    active; direct
100.77.2.33      startos      linux
```

If I did want to share it publicly, the Cloudflare Tunnel is the escape hatch —
front the gateway with a token and hand out a LiteLLM key. I keep that off by
default, because "I can share a model with a friend" and "the model is public" are
very different sentences.

## Run it on your own

If you've got a DGX Spark — or a rack of them, because it scales across nodes the
same way — clone the repo, `spark-lab init`, point `config.yaml` at your model, and
`spark-lab apply`.

It's MIT-licensed, and it's just me tidying up a setup I actually use — so expect it
to read more like a well-organized toolbox than a product. The docs cover the
architecture, day-2 operations, model recipes, and networking.

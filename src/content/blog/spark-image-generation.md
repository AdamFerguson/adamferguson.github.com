---
title: "Painting in the Spark's spare memory"
description: "Adding local image generation to the LLM lab — why ComfyUI lives outside the converge pass, why SDXL and not Flux on 121 GiB of unified memory, and what I learned about Grace-Blackwell's quirks along the way."
date: 2026-09-06
tags:
  - llm
  - infrastructure
  - self-hosting
  - gpu
  - image-generation
category: Infrastructure
---

The LLM lab has been humming for a few weeks now — one config file, one command,
a model that answers when my tools call. But there's a second GPU workload that's
been bugging me: image generation. Not for anything grand. I wanted a new profile
picture, and I wanted the machine that already thinks to also try its hand at
drawing.

Turns out that's mostly a memory-etiquette problem, not a software problem.

## The co-tenancy problem

The Spark is a Grace-Blackwell box: 121 GiB of *unified* memory. The CPU and the
GPU don't have separate pools — one allocation budget, both spenders. My LLM
runtime spends most of it: weights resident, KV cache filling what's left, and a
carefully-tuned reserve keeping the host from swapping.

So ComfyUI isn't installing into this house; it's moving into a room I have to
vacate every time it wants to paint. That reframing drove every decision:

- **The model choice is a budget choice.** Flux looks stunning on a Spark demo,
  but at ~23 GB of weights plus a big text encoder, it only fits while nothing
  else is loaded. SDXL base is ~7 GB — enough to generate a portrait in the
  gaps between model work without evicting the LLM's KV pool. The fetch script
  in the repo downloads exactly one file and says why in its header comment.
- **The service lives outside the convergence loop.** Everything else in the lab
  is declarative: describe the state, `apply` makes it so. Image generation is
  opt-in and explicit — `spark-lab comfyui up`, `down`, `status`, `logs` —
  because `apply` re-converging a model host should never surprise a half-done
  render, and a render I forgot about should never OOM a benchmark. The
  scheduler and the diffusion model are adults; they get their own command.

## Grace-Blackwell bites

Two platform quirks worth writing down before I forget them:

**Dynamic VRAM misreads unified memory.** ComfyUI's dynamic model-loading mode
asks CUDA how much VRAM is free and behaves like a normal discrete GPU box. On
unified memory, that answer reflects what CUDA thinks the process may use, not
what the machine has — and the resident LLM looks like "no room," so ComfyUI
offloads aggressively and doubles its own generation time for nothing. The
community fix is `--disable-dynamic-vram` plus a small `--reserve-vram`: tell
it the models stay resident and stop second-guessing. The default render ships
those flags.

**The installer is a trust decision, not a convenience one.** Several Spark
ComfyUI images exist. I picked the one maintained by a ComfyUI org maintainer
(CUDA 13.1, sm_121, SageAttention, non-root), because the interesting Spark
setups are build-your-own — which is fine for a hobby afternoon and less fine
as infrastructure I want `status` to tell the truth about. It's overridable
through the same `images:` map everything else in the lab uses, so if I change
my mind it's a config edit.

## The portrait, or: prompts are palettes

The workflow files committed with this feature generate stylized portraits from
a source photo via img2img — `VAEEncode` the face in, denoise around 0.6, and
structure survives while style floods in. No custom nodes, no face-ID adapters
that break on the next ComfyUI release: core nodes only, so the graph keeps
loading in two years.

Two styles, both derived from this site's own palette, which I extracted from
computed styles rather than eyeballing: espresso ink `#15140F`-ish, cream
`#ECE6DC`, taupe `#A39A8C`, and one ember accent `#F0824A`. First is a two-tone
woodcut relief — carved strokes, flat planes, one burnt-orange ball as the nod
to the header. Second is a flat-vector headshot in four colors, the kind of
thing that survives being cropped to a 40-pixel circle next to a reply.

The woodcut wins, if it behaves; we'll see what the actual renders look like
before this becomes a profile picture. The nice thing is the whole loop —
photo in, prompt tuned to a palette I already trust, output on disk in
`basedir/output/` — now runs on the same box that writes these posts' code.

All of it is in the [spark-lab repo](https://github.com/AdamFerguson/spark-lab),
MIT as ever: the comfyui command, the compose template, the model-fetch script,
and both workflow JSONs under `workflows/`.

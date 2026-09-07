---
title: "ComfyUI on the lab, mostly over chat"
description: "Adding local image generation to the LLM lab, and what it was like to steer three parallel work streams from a phone: the memory budget decisions, the Grace-Blackwell quirks, and the parts the agent got wrong."
date: 2026-09-06
tags:
  - llm
  - infrastructure
  - self-hosting
  - gpu
  - image-generation
category: Infrastructure
---

The lab has run for a few weeks now: one config file, one command, a model that
answers when my tools call. The next workload to fit was image generation. Not
for anything grand. I wanted a new profile picture and I wanted the machine
that already thinks to try drawing one.

Most of what I learned along the way was about memory, not software.

## One pool, two spenders

The Spark is a Grace-Blackwell box with 121 GiB of unified memory. CPU and GPU
share it. My LLM runtime spends most of it: weights resident, KV cache filling
what's left, a tuned reserve keeping the host off the swap. A diffusion model
moving in doesn't install, it moves into a room I have to vacate while it paints.

Three consequences:

The model choice is a budget choice. Flux demos beautifully on a Spark, but at
about 23 GB of weights plus its text encoder it only fits while nothing else is
loaded. SDXL base is about 7 GB, enough to generate beside a loaded LLM. The
fetch script in the repo downloads one file and its header says why.

The service lives outside the convergence loop. Everything else in the lab is
declarative: describe the state, `apply` makes it so. Image generation didn't
want that. A gateway restart should never surprise a half-finished render, and a
render I forgot about should never OOM a benchmark. So `apply` never touches
ComfyUI. It gets its own command: `spark-lab comfyui up|down|status|logs`.

The installer is a trust decision. Spark ComfyUI images exist at several levels
of homemade. I went with one maintained by a ComfyUI org maintainer (CUDA 13.1,
sm_121, SageAttention, non-root), overridable through the same `images:` map
everything else uses, so a change of heart is a config edit.

## Two Grace-Blackwell bites

ComfyUI's dynamic VRAM mode asks CUDA how much memory is free and behaves like
the box has a discrete GPU. On unified memory the answer reflects what CUDA
thinks the process may use, not what the machine has, so the resident LLM reads
as "no room" and ComfyUI offloads aggressively. Twice the generation time for
nothing. The community fix: `--disable-dynamic-vram --reserve-vram 4`. The
default render ships those flags.

Worth naming the other thing I learned the hard way: agents will confidently
tell you wrong stuff. I asked my setup whether Matrix encryption was feasible
and it described a stack that wasn't what it runs. Right answer required reading
the actual adapter, which showed E2EE is supported today and only needs a
dependency that no longer compiles on modern macOS. When the agent says "X is
impossible," check what it actually read.

## The collaboration part, which was the surprise

This whole feature arrived over chat. Matrix, my phone, while I did other
things: I'd ask for something, the agent would work, I'd course-correct when a
stream went wrong. It wasn't one conversation. It was three streams at once:
staging a model recipe on the second machine, the ComfyUI integration as a
repo PR, and this post as another. Each had its own files and its own mistakes
to catch.

The checkpoints that mattered were decisions, not keystrokes. Approving or
refusing a risky install step. Killing an experiment I hadn't consented to.
Telling the agent my schedule ("free the box tonight") and having it queue work
against that instead of fighting for memory now. Deciding that SDXL over Flux
was the right call for a machine that has a day job. Reviewing the PR text and
saying the blog draft reads too much like a blog written by a robot.

What I didn't do: babysit. The work happened in parallel, persisted across
sessions, and showed up in reviewable units (a branch, a PR, a post). What the
agent got wrong it also, eventually, flagged itself: the workflows here ship
with core nodes only and a test plan that admits the first render hasn't
happened yet. I'd rather review honest scaffolding than confident fiction.

## The portrait

Two workflows committed with the feature, both derived from this site's palette
extracted from computed styles: espresso ink, cream, taupe, one ember accent
`#F0824A`. A two-tone woodcut relief with a burnt-orange ball, and a flat-vector
headshot in four colors that survives being cropped to a 40-pixel circle. The
woodcut is the plan. Identity carries through img2img at denoise 0.6, so no
custom nodes and nothing to rot on the next ComfyUI release.

The woodcut wins if the renders behave. We'll see.

Everything is in the [spark-lab repo](https://github.com/AdamFerguson/spark-lab),
MIT as ever: the comfyui command, the compose template, the model-fetch script,
and both workflows under `workflows/`.

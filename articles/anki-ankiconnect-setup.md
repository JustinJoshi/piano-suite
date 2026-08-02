---
title: "How to Set Up Anki + AnkiConnect for Piano Suite"
description: "3 steps: install Anki, install AnkiConnect, and import the bundled deck so Piano Suite can drive your chord drills."
slug: "anki-ankiconnect-setup"
publishedAt: "2026-08-02"
readingTime: "5 min"
---

# How to Set Up Anki + AnkiConnect for Piano Suite

Piano Suite's drills read the chord you're scheduled to review next and send your timing and accuracy back into the same spaced-repetition loop. That handshake happens through AnkiConnect, a small add-on that exposes your local Anki collection over HTTP. This guide walks through the setup in three steps.

## 1. Install Anki desktop

Anki needs to be running on the same computer as your browser and MIDI keyboard.

- Download Anki for Windows, macOS, or Linux from the official site: **[apps.ankiweb.net](https://apps.ankiweb.net)**.
- Run the installer and open Anki.
- On first launch, create a profile. You can optionally sign in to AnkiWeb to sync cards across devices; the drills themselves only talk to the local Anki instance.

## 2. Install AnkiConnect

AnkiConnect is the bridge between Anki and Piano Suite.

- Open Anki and go to **Tools → Add-ons → Get Add-ons…**.
- Paste this add-on code: **`2055492159`**.
- Click **OK**, then restart Anki when prompted.

You can verify the add-on on its AnkiWeb page: **[AnkiConnect on AnkiWeb](https://ankiweb.net/shared/info/2055492159)**. The source code and API documentation live at **[anki-connect on sourcehut](https://git.sr.ht/~foosoft/anki-connect)**.

There is no one-click browser install for Anki add-ons — Anki's add-on system requires pasting the code inside the desktop app — but the page above confirms the code and shows the latest supported Anki versions.

## 3. Import the bundled deck

Piano Suite ships with two tab-separated Anki exports in the `public/` folder of the repository:

- `chord-symbols-CGDAE.txt` — root-position 7ths and diminished 7ths across C, G, D, A, and E.
- `chord-symbols-CGDAEno11.txt` — the same set without the 11th extension, if you prefer a leaner deck.

To import either deck:

- In Anki, go to **File → Import**.
- Select the `.txt` file you downloaded.
- Set the **notetype** to **Basic** and map the front/back fields.
- Click **Import**.

The cards are plain text, so they work with the Chord Drill out of the box once AnkiConnect is active.

## 4. Connect Piano Suite

With Anki still running, open any drill in Piano Suite — for example, **Tools → Chord Drill**. The app polls AnkiConnect on `http://127.0.0.1:8765` by default. If a review is due, the drill reads the front of the card, waits for you to play the matching chord on your MIDI keyboard, and grades the result back into Anki.

If the drill says Anki is not connected:

- Make sure Anki is open and AnkiConnect is installed.
- Check that no other app is blocking port `8765`.
- Confirm your browser can reach `http://127.0.0.1:8765` (AnkiConnect only listens on IPv4, so use `127.0.0.1`, not `localhost`, if you're testing manually).

That's it. You can now practice with Anki scheduling the what and Piano Suite scheduling the how.

#!/bin/bash
# Restart wrapper for gamemode rotation.
# When the server exits (after rotating gamemodes), this script restarts it
# automatically so the next gamemode slot is loaded from rotation-state.json.

echo "[WRAPPER] Game server starting..."
while true; do
    node game-server/server.js
    EXIT_CODE=$?
    echo "[WRAPPER] Server exited with code $EXIT_CODE. Restarting in 3 seconds..."
    sleep 3
done

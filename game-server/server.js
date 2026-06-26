// Log startup messages
console.log("Starting up...");
console.log("Importing modules...\n");

const path = require("path");
const fs = require("fs");
const http = require("http");
const url = require("url");
const pjson = { version: '2.0.11.6' }

const { Worker } = require("worker_threads");

// Increase the stack trace limit for better debugging
Error.stackTraceLimit = Infinity;

// Load environment variables from .env using a custom dotenv loader
const dotenv = require("./lib/dotenv.js");
const envContent = fs.readFileSync(path.join(__dirname, "./.env")).toString();
const environment = dotenv(envContent);

// Set each environment variable in process.env
for (const key in environment) {
    process.env[key] = environment[key];
}

// Load all necessary modules and files via the loader
const GLOBAL = require("./loaders/loader.js");

// ── Gamemode Rotation ──────────────────────────────────────────────────────
// Each entry is one "slot" in the rotation. They cycle in order, each lasting
// a random 1–24 hours. The process exits cleanly when it's time to rotate;
// start.sh restarts it and the new gamemode is picked up automatically.
const GAMEMODE_ROTATION = [
    { gamemodes: ['ffa'],                                       label: 'FFA'                   },
    { gamemodes: ['ffa', 'growth'],                             label: 'Growth FFA'            },
    { gamemodes: ['ffa', 'arms_race'],                          label: 'Arms Race'             },
    { gamemodes: ['ffa', 'supergrowth', 'arms_race'],           label: 'Super Growth Arms Race'},
    { gamemodes: ['ffa', 'retrograde'],                         label: 'Retrograde FFA'        },
    { gamemodes: ['ffa', 'maze'],                               label: 'Maze FFA'              },
    { gamemodes: ['ffa', 'domination'],                         label: 'Domination'            },
    { gamemodes: ['ffa', 'growth', 'arms_race'],                label: 'Growth Arms Race'      },
    { gamemodes: ['ffa', 'blackout'],                           label: 'Blackout FFA'          },
    { gamemodes: ['ffa', 'outbreak'],                           label: 'Outbreak FFA'          },
    // New gamemodes
    { gamemodes: ['ffa', 'blitz'],                              label: 'Blitz FFA'             },
    { gamemodes: ['ffa', 'blitz', 'arms_race'],                 label: 'Blitz Arms Race'       },
    { gamemodes: ['ffa', 'ultra_arms_race'],                    label: 'Ultra Arms Race'       },
    { gamemodes: ['ffa', 'supergrowth', 'ultra_arms_race'],     label: 'Mega Growth Ultra AR'  },
    { gamemodes: ['ffa', 'maze', 'arms_race'],                  label: 'Maze Arms Race'        },
];

const STATE_FILE = path.join(__dirname, '../rotation-state.json');

function randomDuration() {
    // Random duration between 1 and 24 hours in milliseconds
    return (1 + Math.floor(Math.random() * 23)) * 60 * 60 * 1000;
}

// Read persisted rotation state or initialize fresh
let rotationState = { index: 0, nextSwitch: Date.now() + randomDuration() };
try {
    const raw = fs.readFileSync(STATE_FILE, 'utf8');
    rotationState = JSON.parse(raw);
} catch { /* first run – use defaults */ }

const currentSlot = GAMEMODE_ROTATION[rotationState.index % GAMEMODE_ROTATION.length];
console.log(`[ROTATION] Current gamemode: ${currentSlot.label}`);
console.log(`[ROTATION] Next switch at: ${new Date(rotationState.nextSwitch).toISOString()}`);

// Override the first server's gamemode with the rotation's current slot
if (Config.servers && Config.servers[0]) {
    Config.servers[0].gamemode = currentSlot.gamemodes;
}
// ──────────────────────────────────────────────────────────────────────────

// Load definitions and tile definitions
new definitionCombiner(
    {
        groups: path.join(__dirname, './lib/definitions/groups'),
        addonsFolder: path.join(__dirname, './lib/definitions/entityAddons')
    }
).loadDefinitions();
GLOBAL.loadRooms(true);

// Optionally load all mockups if enabled in configuration
if (Config.load_all_mockups) global.loadAllMockups();

// Log loader information including creation date and time
console.log(`Successfully loaded all files.`);
console.log(`Created on date ${GLOBAL.creationDate} at timestamp ${GLOBAL.creationTime}`);

// Define the public directory for static files
const publicRoot = path.join(__dirname, "../public/"),
mimeSet = {
    js: "application/javascript",
    json: "application/json",
    css: "text/css",
    html: "text/html",
    md: "text/markdown",
    png: "image/png",
    svg: "image/svg+xml",
};

let wsServer; // WebSocket server instance
let server; // HTTP server instance

// Attempt to create a WebSocket server instance using the 'ws' package
try {
    const WebSocketServer = require("ws").WebSocketServer;
    wsServer = new WebSocketServer({ noServer: true });
} catch (err) {
    throw new Error(
        "Package 'ws' is not installed! To install it, run 'npm install ws' in the terminal."
    );
}

// Log a warning if Access-Control-Allow-Origin is enabled
if (Config.allow_ACAO && Config.startup_logs) {
    util.warn("Access-Control-Allow-Origin is enabled, which allows any server/client to access data from the WebServer.");
}

// Create an HTTP server to handle both API and static file requests
server = http.createServer((req, res) => {
    let query = {};
    let pathname = req.url.split("?")[0];
    if (req.url.includes("?")) req.url.split("?")[1].split("&").map(i => {
        let key = i.split("=")[0];
        let value = i.split("=")[1];
        query[key] = value;
    });
    let readString = ""; // Response content for API endpoints
    let ok = true; // Flag to indicate whether we use default API response
    let serversIP = [];
    let clientHeaders = ["/ext/custom-shape"];
    let selectedHeader = null;

    // Set CORS headers if enabled in the configuration or allow only the children servers.
    for (let server of global.servers) if (server.ip !== Config.host && server.ip) {
        let http = server.ip.startsWith("localhost") ? `http://${server.ip}` : `https://${server.ip}`;
        serversIP.push(http);
    };
    if (Config.allow_ACAO || serversIP.includes(req.headers.origin)) {
        res.setHeader("Access-Control-Allow-Origin", "*");
        res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");
        res.setHeader("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
    }
    for (let i = 0; i < clientHeaders.length; i++) {
        if (clientHeaders[i] == req.url) {
            selectedHeader = clientHeaders[i];
        }
    }
    // Handle specific API endpoints based on the request URL
    switch (pathname) {
        case "/getServers.json": {
            // Serve a list of active servers (excluding hidden ones)
            readString = JSON.stringify(servers.filter((s) => s && !s.hidden).map((server) => ({
                ip: server.ip,
                players: server.players,
                maxPlayers: server.maxPlayers,
                id: server.id,
                featured: server.featured,
                region: server.region,
                gameMode: server.gameMode,
            })));
        } break;
        case "/getTotalPlayers": {
            let countPlayers = 0;
            servers.forEach((s) => {
                countPlayers += s.players;
            });
            readString = JSON.stringify(countPlayers);
        } break;
        case "/version": {
            readString = JSON.stringify({ver: 'v' + pjson.version, devBuild: Config.devBuild});
        } break;
        
        case "/api/getAddonAuthors": {
            if (!query.token || query.token !== process.env.DEVELOPER) {
                res.writeHead(403);
                res.end("Forbidden");
                return;
            }
            readString = JSON.stringify(global.addonAuthorInfos);
        } break;

        case "/api/sendPlayer": {
            ok = false;
            let body = "";
            req.on("data", c => body += c);
            req.on("end", () => {
                let json = null;
                try {
                    json = JSON.parse(body);
              } catch { }
                  if (json) {
                      if (json.key === process.env.API_KEY) {
                            let { id, name, definition, score, level, skillcap, skill, points, killCount } = json;
                            global.travellingPlayers.push({ id, name, definition, score, level, skillcap, skill, points, killCount });
                            res.writeHead(200);
                            res.end("OK");
                        } else {
                            res.writeHead(403);
                            res.end("Access Denied");
                        }
                    } else {
                        res.writeHead(400);
                        res.end("Invalid JSON body");
                    }
            });
        } break;
        case "/portalPermission": {
            ok = false;
            let sserver = [];
            if (Config.allow_server_travel && global.launchedOnMainServer) {
                for (let i = 0; i < global.servers.length; i++) {
                    let server = global.servers[i];
                    if (server.gameManager) sserver.push(server);
                }
                res.writeHead(200);
                res.end(JSON.stringify(sserver.map((server) => ({
                    ip: server.ip,
                    players: server.players,
                    gameMode: server.gameMode,
                }))));
            } else {
                res.writeHead(404);
                res.end("Denied.");
            }
        } break;
        case "/isOnline": {
            readString = "true";
        } break;
        case selectedHeader: {
            // For all other routes, serve static files from the public directory
            ok = false;
            let fileToGet = path.join(publicRoot, req.url);

            // If the requested file doesn't exist or isn't a file, default to the INDEX_HTML file
            if (!fs.existsSync(fileToGet) || !fs.lstatSync(fileToGet).isFile()) {
                fileToGet = path.join(publicRoot, `${selectedHeader}/index.html`);
            }

            // Determine the file's MIME type based on its extension and serve the file stream
            const extension = fileToGet.split(".").pop();
            res.writeHead(200, { "Content-Type": mimeSet[extension] || "text/html" });
            fs.createReadStream(fileToGet).pipe(res);
        } break;

        default: {
            // For all other routes, serve static files from the public directory
            ok = false;
            let fileToGet = path.join(publicRoot, pathname);

            // If the requested file doesn't exist or isn't a file, default to the main_menu file
            if (!fs.existsSync(fileToGet) || !fs.lstatSync(fileToGet).isFile()) {
                fileToGet = path.join(publicRoot, Config.main_menu);
            }

            // Determine the file's MIME type based on its extension and serve the file stream
            const extension = fileToGet.split(".").pop();
            res.writeHead(200, { "Content-Type": mimeSet[extension] || "text/html" });
            fs.createReadStream(fileToGet).pipe(res);
        } break;
    }

    // If an API endpoint was handled, send the JSON response
    if (ok) {
        res.writeHead(200);
        res.end(readString);
    }
});

// Loads a game server
function loadGameServer(loadViaMain = false, host, port, gamemode, region, webProperties, properties, isFeatured) {
    // Determine the new server index and initialize an empty object in the global servers array
    if (!loadViaMain) {
        let index = global.servers.length;
        global.servers.push({});

        // Create a new worker thread to load the game server asynchronously
        let worker = new Worker(path.join(__dirname, "./serverLoader.js"), {
            workerData: {
                host,
                port: port, // Increment port for each server
                gamemode,
                region,
                webProperties,
                properties,
                isFeatured,
                index,
            }
        });

        // Listen for messages from the worker to update the server's status
        worker.on("message", message => {
            const flag = message.shift();
            switch (flag) {
                case false:
                    // Initial load: store server details
                    global.servers[index] = message.shift();
                    break;
                case true:
                    // Update: change the server's player count
                    global.servers[index].players = message.shift();
                    break;
                case "doneLoading":
                    // Once loading is complete, trigger the server loaded callback
                    onServerLoaded();
                    break;
            }
        });
    } else {
        global.servers.push({ loadedViaMainServer: true });
        setTimeout(() => { // Space it a little out.
            if (global.launchedOnMainServer) {
                console.warn("Only one server can be loaded via through the main server!\nProcess terminated.");
                process.exit(1);
            }
            global.launchedOnMainServer = true;
            new (require("./game.js").gameServer)(Config.host, Config.port, gamemode, region, webProperties, properties, isFeatured, false);
        }, 10)
    }
}

// Server Loaded Callback
let loadedServers = 0;
global.onServerLoaded = () => {
    loadedServers++;
    // Once all servers are loaded, log the status and routing table
    if (loadedServers >= global.servers.length) {
        util.saveToLog("Servers up", "All servers booted up.", 0x37F554);
        if (Config.startup_logs) {
            util.log("Dumping endpoint -> gamemode routing table");
            for (const game of global.servers) {
                console.log("> " + `${Config.host}/#${game.id}`.padEnd(40, " ") + " -> " + game.gameMode);
            }
            console.log("\n");
        }
        let serverStartEndTime = performance.now();
        console.log("Server loaded in " + util.rounder(serverStartEndTime, 4) + " milliseconds.");
        console.log("[WEB SERVER]: Server listening on port", Config.port);
    }
};

// Start the HTTP Server & Load Game Servers
server.listen(Config.port, () => {
    Config.servers.forEach(server => {
        // Load all of the servers.
        loadGameServer(
            server.share_client_server,
            server.host,
            server.port,
            server.gamemode,
            server.region,
            { id: server.id, maxPlayers: server.player_cap },
            server.properties,
            server.featured
        );
    })
});

// Upgrade HTTP connections to WebSocket connections
// Fixed for Render: connect to the first live gameManager regardless of launchedOnMainServer
server.on("upgrade", (req, socket, head) => {
    wsServer.handleUpgrade(req, socket, head, (ws) => {
        let connected = false;
        for (let i = 0; i < global.servers.length; i++) {
            let srv = global.servers[i];
            if (srv && srv.gameManager) {
                srv.gameManager.socketManager.connect(ws, req);
                connected = true;
                break;
            }
        }
        if (!connected) ws.close();
    });
});

// ── Gamemode Rotation Timer ────────────────────────────────────────────────
// Schedule a clean rotation when the persisted nextSwitch time arrives.
const timeUntilSwitch = Math.max(rotationState.nextSwitch - Date.now(), 0);
console.log(`[ROTATION] Switching in ${Math.round(timeUntilSwitch / 1000 / 60)} minutes.`);

setTimeout(() => {
    const nextIndex = (rotationState.index + 1) % GAMEMODE_ROTATION.length;
    const nextSlot  = GAMEMODE_ROTATION[nextIndex];
    const nextSwitch = Date.now() + randomDuration();

    // Persist the next state so the restarted process picks up the right mode
    fs.writeFileSync(STATE_FILE, JSON.stringify({ index: nextIndex, nextSwitch }));

    console.log(`[ROTATION] Rotating to: ${nextSlot.label}`);

    // Announce to all connected players
    if (global.gameManager && global.gameManager.socketManager) {
        global.gameManager.socketManager.broadcast(
            `⚡ Gamemode rotating! Next mode: ${nextSlot.label} — arena closing in 30 seconds!`
        );
    }

    // Close the arena cleanly (spawns arena closers, waits for all players to die)
    // then exits so start.sh can restart with the new gamemode
    setTimeout(() => {
        if (global.gameManager && !global.gameManager.arenaClosed) {
            global.gameManager.closeArena();
        }
        // Force-exit after 90 s even if arena close stalls
        setTimeout(() => process.exit(0), 90_000);
    }, 30_000);
}, timeUntilSwitch);
// ──────────────────────────────────────────────────────────────────────────

// Set up a loop to periodically call Bun's garbage collector if available
let bunLoop = setInterval(() => {
    try {
        Bun.gc(true);
    } catch (e) {
        // If Bun.gc fails, clear the interval
        clearInterval(bunLoop);
    }
}, 1000);

// Log that the web server has been initialized if logging is enabled
if (Config.startup_logs) console.log("Web Server initialized.");

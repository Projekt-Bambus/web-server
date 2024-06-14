const LOCK_STATE_ID = "lock-state";
const LOCK_SWITCH_ID = "lock-switch";
const LOCK_IMG_ID = "lock-img";

// URL constants
const ROOT_URL = location.protocol + '//' + location.host;
const LOGOUT_URL = ROOT_URL + "/logout";
const SOCKET_INIT_URL = ROOT_URL + "/socket-init";
// ID constants
const SOCKET_TOKEN_STORAGE_ID = "socketToken";

const state = {
    lock: 1,
    song: 1,
}

let socket;

function getCookieValue(name) {
    let cookieList = document.cookie.split(";");
    for (let i = 0; i < cookieList.length; i++) {
        let cookiePair = cookieList[i].split("=");
        if (name == cookiePair[0].trim()) {
            return decodeURIComponent(cookiePair[1]);
        }
    }
    return null;
}

function enableAllInput() {
    document.querySelectorAll('#config-songs .option').forEach(element => element.disabled = false);
    document.querySelectorAll('*[id^=config]').forEach(element => element.disabled = false);
}

async function initialize() {
    // Set username display
    document.getElementById("username-display").innerText = getCookieValue("username");
    // Get socket token
    await fetch(SOCKET_INIT_URL, {
        method: "POST",
        headers: {
            'Accept': 'application/json',
        }
    })
    .then(res => res.json())
    .then((res) => {
        window.sessionStorage.setItem(SOCKET_TOKEN_STORAGE_ID,res.token);
    });
    // Connect to the socket
    socket = io({
        auth: {
            token: window.sessionStorage.getItem(SOCKET_TOKEN_STORAGE_ID)
        }
    });
    // Prepare socket events
    socket.on('serverLog', (data) => {
        console.log('ON: serverLog');
        new Date().to
        const message = `[${data.timestamp?.toLocaleString()}] ${data.entry}`;
        const logElement = document.getElementById('log');
        logElement.innerHTML = `<p>${message}</p>${logElement.innerHTML}`;
    });
    socket.on('serverConfig', (data) => {
        updateConfig(data);
        console.log('ON: serverConfig'); 
        console.log(data);
    });
    // Synchronise client-server
    socket.on('serverSync', (data) => {
        console.log(data);
        for (key in data.config) {
            updateConfig({key,value: data.config[key]});
        }
        enableAllInput();
        initializeLights();

        // ### Log
        const logElement = document.getElementById('log');
        for (const logEntry of data.log) {
            const message = `[${logEntry.timestamp?.toLocaleString()}] ${logEntry.entry}`;
            logElement.innerHTML = `<p>${message}</p>${logElement.innerHTML}`;
        }
    })
    socket.emit('clientSync', { config: true, logHistory: 5 });
}

initialize();

function updateConfig(data) {
    switch (data.key) {
        case 'lock':
            state.lock = data.value;
            updateLockDisplay();
            break;
        case 'song':
            state.song = data.value;
            updateSongDisplay();
            break;
        case 'magnet':
            document.getElementById('config-magnet').checked = (data.value == 1)
            break;
        case 'volume':
            console.log(data.value);
            document.getElementById('config-volume').value = `${data.value}`;
            break;
        case 'light1':
        case 'light2':
        case 'light3':
            const lightNumber = data.key.at(-1);
            const baseId = `config-light${lightNumber}`;
            if (data.value > 0) {
                document.getElementById(baseId).checked = true;
                document.getElementById(`${baseId}-mode`).value = `${data.value}`;
            } else { 
                document.getElementById(baseId).checked = false;
            }
            updateLightModeSelector(baseId);
            updateLight(LIGHT_SET[lightNumber]);
            break;
    }
}


//# Volume
document.getElementById('config-volume').addEventListener('change', (e) => {
    socket.emit("clientConfig",{key: "volume", value: parseInt(e.target.value)});
});

//# Play
document.getElementById('config-play').addEventListener('click', (e) => {
    socket.emit("clientConfig",{key: "play", value: 1});
});

//# Magnet toggle
document.getElementById('config-magnet').addEventListener('input', (e) => {
    console.log(e);
    socket.emit('clientConfig',{key: 'magnet', value: e.target.checked ? 1 : 0});
})

//# Locking

const LOCK_STATES = [
    {
        displayName: "Unlocked",
        assetUrl: "assets/icons/lock-open.svg"
    },
    {
        displayName: "Locked",
        assetUrl: "assets/icons/lock-locked.svg"
    },
];

function switchLock() {
    state.lock = state.lock ? 0 : 1;
    socket.emit('clientConfig',{key:"lock",value: state.lock});
    updateLockDisplay();
}

function updateLockDisplay() {
    console.log(state.lock)
    const lockStateElement = document.getElementById(LOCK_STATE_ID);
    const lockImgElement = document.getElementById(LOCK_IMG_ID);
    lockStateElement.innerText = LOCK_STATES[state.lock].displayName;
    lockImgElement.setAttribute("src", LOCK_STATES[state.lock].assetUrl);
}

//# Song switching
const SONG_NAMES = [
    null,
    "Song 1",
    "Song 2",
    "Song 3",
    "Song 4",
    "Song 5",
    "Song 6",
    "Song 7",
    "Song 8",
    "Song 9",
    "Song 10",
    "Song 11",
    "Song 12",
]

function switchSong(songId) {
    state.song = songId;
    socket.emit('clientConfig',{key:"song",value: state.song});
    updateSongDisplay();
}

function updateSongDisplay() {
    const songDisplay = document.getElementById("songDisplay");
    const songName = SONG_NAMES[state.song];
    if (songName) songDisplay.innerText = songName;
    else songDisplay.innerText = "No info available.";
}

//# Light settings

function initializeLights() {
    for (let i = 1; i <= 3;i++) {
        document.getElementById(`config-light${i}`).addEventListener('input', (e) => {
            const baseId = e.target.id;
            const selectedLightMode = document.getElementById(`${baseId}-mode`).value;
            if (e.target.checked) {
                socket.emit('clientConfig',{key:`light${i}`, value: parseInt(selectedLightMode)});
            } else {
                socket.emit('clientConfig',{key:`light${i}`, value: 0});
            }
            updateLightModeSelector(baseId);
            updateLight(LIGHT_SET[i]);
        });
        document.getElementById(`config-light${i}-mode`).addEventListener('change', (e) => {
            const selectedLightMode = e.target.value;
            socket.emit('clientConfig',{key:`light${i}`, value: parseInt(selectedLightMode)});
            updateLight(LIGHT_SET[i]);
            console.log(e.target.value);
        });
        updateLightModeSelector(`config-light${i}`);
        updateLight(LIGHT_SET[i]);
    }
}

function updateLightModeSelector(baseId) {
    const lightModeSlectorElement = document.getElementById(`${baseId}-mode`);
    const disabled = !document.getElementById(baseId).checked;
    lightModeSlectorElement.disabled = disabled;
}


//# Module display
const MODULE_NAMES = {
    "lights-module": "Settings - Lights",
    "sound-module": "Settings - Sound",
    "magnet-module": "Settings - Magnet"
}

function displayInfo(option) {
    const elementsInside = [...document.querySelectorAll('#infoDisplay .module')];
    elementsInside.forEach((element) => { // Hides all elements except for the selected option
        element.classList.add('hidden');
        if (element.id === option) element.classList.remove('hidden');
    });

    window.localStorage.setItem("recentModule",option); //Remember selected module
    document.getElementById("module-text").innerText = MODULE_NAMES[option]; //Update name
}

displayInfo(window.localStorage.getItem("recentModule") ?? "lights-module");

//# Popups

const popup = document.getElementById("settingsPopup");

document.getElementById("settingsButton").onclick = function() {
    popup.style.display = "flex";
}

document.getElementById("closePopup").onclick = function() {
    popup.style.display = "none";
}

const popup2 = document.getElementById("aboutPopup");

document.getElementById("aboutButton").onclick = function() {
    popup2.style.display = "flex";
}

document.getElementById("closePopup2").onclick = function() {
    popup2.style.display = "none";
}

window.onclick = function(event) {
    if (event.target == popup) {
        popup.style.display = "none";
    }
    if (event.target == popup2) {
        popup2.style.display = "none";
    }
}

//
const LIGHT_SET = [
    null,
    { selectId: 'config-light1-mode', checkboxId: 'config-light1', imageId: 'light1' },
    { selectId: 'config-light2-mode', checkboxId: 'config-light2', imageId: 'light2' },
    { selectId: 'config-light3-mode', checkboxId: 'config-light3', imageId: 'light3' },
];

const submitButton = document.getElementById('lightSubmitButton');
const blinkIntervals = {};

function updateLight(lightSet) {
    const selectElement = document.getElementById(lightSet.selectId);
    const checkboxElement = document.getElementById(lightSet.checkboxId);
    const lightImage = document.getElementById(lightSet.imageId);

    if (blinkIntervals[lightSet.imageId]) {
        clearInterval(blinkIntervals[lightSet.imageId]);
    }

    if (!checkboxElement.checked) {
        console.log(`Turning off the light ${lightSet.imageId}`);
        lightImage.style.display = 'none';
        return;
    }

    const selectedOption = selectElement.value;
    console.log(`Selected Option for ${lightSet.selectId}:`, selectedOption);

    switch (selectedOption) {
        case '1':
            console.log(`Setting light ${lightSet.imageId} to solid`);
            lightImage.style.display = 'block';
            break;
        case '2':
            console.log(`Setting light ${lightSet.imageId} to blink every 2 seconds`);
            blinkImage(2000,lightSet.imageId);
            break;
        case '3':
            console.log(`Setting light ${lightSet.imageId} to blink every 5 seconds`);
            blinkImage(5000,lightSet.imageId);
            break;
        case '4':
            console.log(`Setting light ${lightSet.imageId} to blink every 10 seconds`);
            blinkImage(10000,lightSet.imageId);
            break;
        default:
            console.log('Unknown option selected');
            break;
    }
}

function blinkImage(interval, lightImageId) {
    const lightImage = document.getElementById(lightImageId);
    lightImage.style.display = 'block';
    let visible = true;
    blinkIntervals[lightImageId] = setInterval(function () {
        lightImage.style.display = visible ? 'none' : 'block';
        visible = !visible;
    }, interval);
}
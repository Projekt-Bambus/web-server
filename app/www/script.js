const LOCK_STATE_ID = "lock-state";
const LOCK_SWITCH_ID = "lock-switch";
const LOCK_IMG_ID = "lock-img";
const VOLUME_IMG_ID = "volume-img";
const VOLUME_SLIDER_ID = "volume-slider";
const VOLUME_SWITCH_ID = "volume-switch";

// URL constants
const ROOT_URL = location.protocol + '//' + location.host;
const LOGOUT_URL = ROOT_URL + "/logout";
const SOCKET_INIT_URL = ROOT_URL + "/socket-init";
// ID constants
const SOCKET_TOKEN_STORAGE_ID = "socketToken";

let initialSync = false;
const state = {
    lock: 1,
    magnet: 0, //!!

    play: 1, //??
    volume: 50,
    song: 1,

    light1: 0,
    light2: 2,
    light3: 1,
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
        console.log(data);
    });
    socket.on('serverConfig', (data) => {
        state[data.key] = data.value;
        updateLockDisplay();
        updateSongDisplay();
        console.log('ON: serverConfig'); 
        console.log(data);
    });
    // Synchronise client-server
    socket.on('serverSync', (data) => {
        initialSync = true;
        console.log(data);
        for (key in data.config) {
            state[key] = data.config[key];
        }
        enableAllInput();
        updateLockDisplay();
        updateSongDisplay();
    })
    socket.emit('clientSync', { config: true, logHistory: 5 });
}

initialize();
//Volume
/*
let volume = 0;
let muted = false;
function switchVolume() {
    muted = !muted;
    updateVolumeDisplay();
}
document.getElementById(VOLUME_SLIDER_ID).addEventListener("input", (event) => {
    console.log(event.target.value)
    updateVolumeDisplay();
})

function getVolumeIcon() {
    const volume = document.getElementById(VOLUME_SLIDER_ID).value;
    if (muted) return "assets/icons/volume-off.svg";
    if (volume < 50) return "assets/icons/volume-down.svg"
    return "assets/icons/volume-up.svg"
}

function updateVolumeDisplay() {
    const volumeImageElement = document.getElementById(VOLUME_IMG_ID);
    volumeImageElement.setAttribute("src", getVolumeIcon());
}


updateVolumeDisplay();
*/

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
document.getElementById('config-light1').addEventListener('input', (e) => {
    const baseId = e.target.id;
    const selectedLightMode = document.getElementById(`${baseId}-mode`).value;
    if (e.target.checked) {
        socket.emit('clientConfig',{key:`light${baseId.at(-1)}`, value: parseInt(selectedLightMode)});
    } else {
        socket.emit('clientConfig',{key:`light${baseId.at(-1)}`, value: 0});
    }
    updateLightModeSelector(baseId);
});

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

//

    var popup = document.getElementById("settingsPopup");
    var btn = document.getElementById("settingsButton");
    var span = document.getElementById("closePopup");

    btn.onclick = function() {
        popup.style.display = "flex";
    }

    span.onclick = function() {
        popup.style.display = "none";
    }

    window.onclick = function(event) {
        if (event.target == popup) {
            popup.style.display = "none";
        }
    }


    var popup2 = document.getElementById("aboutPopup");
    var btn2 = document.getElementById("aboutButton");
    var span2 = document.getElementById("closePopup2");

    btn2.onclick = function() {
        popup2.style.display = "flex";
    }

    span2.onclick = function() {
        popup2.style.display = "none";
    }

    window.onclick = function(event) {
        if (event.target == popup2) {
            popup2.style.display = "none";
        }
    }


var slider = document.getElementById("myRange");
var output = document.getElementById("demo");

document.addEventListener('DOMContentLoaded', function () {
    const sets = [
        { selectId: 'options1', checkboxId: 'checkbox1', imageId: 'light1' },
        { selectId: 'options2', checkboxId: 'checkbox2', imageId: 'light2' },
        { selectId: 'options3', checkboxId: 'checkbox3', imageId: 'light3' }
    ];

    const submitButton = document.getElementById('lightSubmitButton');
    const blinkIntervals = {};

    if (!submitButton) {
        console.error('Submit button not found');
        return;
    }

    submitButton.addEventListener('click', function () {
        sets.forEach(set => {
            const selectElement = document.getElementById(set.selectId);
            const checkboxElement = document.getElementById(set.checkboxId);
            const lightImage = document.getElementById(set.imageId);

            if (!selectElement || !checkboxElement || !lightImage) {
                console.error(`Elements for set ${set.selectId} not found`);
                return;
            }

            function updateLight() {
                if (blinkIntervals[set.imageId]) {
                    clearInterval(blinkIntervals[set.imageId]);
                }

                if (!checkboxElement.checked) {
                    console.log(`Turning off the light ${set.imageId}`);
                    lightImage.style.display = 'none';
                    return;
                }

                const selectedOption = selectElement.value;
                console.log(`Selected Option for ${set.selectId}:`, selectedOption);

                switch (selectedOption) {
                    case 'Solid':
                        console.log(`Setting light ${set.imageId} to solid`);
                        lightImage.style.display = 'block';
                        break;
                    case 'Blink2s':
                        console.log(`Setting light ${set.imageId} to blink every 2 seconds`);
                        blinkImage(2000);
                        break;
                    case 'Blink5s':
                        console.log(`Setting light ${set.imageId} to blink every 5 seconds`);
                        blinkImage(5000);
                        break;
                    case 'Blink10s':
                        console.log(`Setting light ${set.imageId} to blink every 10 seconds`);
                        blinkImage(10000);
                        break;
                    default:
                        console.log('Unknown option selected');
                        break;
                }
            }

            function blinkImage(interval) {
                lightImage.style.display = 'block';
                let visible = true;
                blinkIntervals[set.imageId] = setInterval(function () {
                    lightImage.style.display = visible ? 'none' : 'block';
                    visible = !visible;
                }, interval);
            }

            updateLight();
        });
    });
});

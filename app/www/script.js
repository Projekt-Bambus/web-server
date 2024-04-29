const LOCK_STATE_ID = "lock-state";
const LOCK_SWITCH_ID = "lock-switch";
const LOCK_IMG_ID = "lock-img";
const VOLUME_IMG_ID = "volume-img";
const VOLUME_SLIDER_ID = "volume-slider";
const VOLUME_SWITCH_ID = "volume-switch";

function getlockState() {
    document.getElementById(LOCK_STATE_ID).innerHTML;
}

const lockStates = {
    locked: {
        displayName: "ZAMKNUTO",
        class: "locked",
        assetUrl: "assets/icons/lock-locked.svg"
    },
    unlocked: {
        displayName: "ODEMKNUTO",
        class: "unlocked",
        assetUrl: "assets/icons/lock-open.svg"
    }
}

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

let lockState = "locked";
function switchLock() {
    if (lockState == "locked") lockState = "unlocked";
    else lockState = "locked";
    updateLockDisplay();
}

function updateLockDisplay() { 
    const lockSwitchElement = document.getElementById(LOCK_SWITCH_ID);
    const lockStateElement = document.getElementById(LOCK_STATE_ID);
    const lockImgElement = document.getElementById(LOCK_IMG_ID);
    lockStateElement.innerHTML = lockStates[lockState].displayName;
    lockSwitchElement.classList.remove(...lockSwitchElement.classList);
    lockSwitchElement.classList.add(lockStates[lockState].class);
    lockImgElement.setAttribute("src", lockStates[lockState].assetUrl);
}

updateLockDisplay();
updateVolumeDisplay();
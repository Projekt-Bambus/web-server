const USERNAME_VALUE_ID = "username-input";
const PASSWORD_VALUE_ID = "password-input";

// Constant URLs
const ROOT_URL = location.protocol + '//' + location.host;
const LOGIN_URL = ROOT_URL + "/login";

let loginInProgress = false;

//# Login fail feedback
function wrongLoginFeedback() {
	const errorImage = document.getElementById("wrong");
	errorImage.style.display = "block";
	const errorSound = document.getElementById("wrong-sound");
	errorSound.play();
	setTimeout(function() {
		errorImage.style.display = "none";
	}, 1000);
}

//# Login request
async function submitLogin() {
	// Prevent sending multiple requests at once
	if (loginInProgress) {
		return;
	} else {
		loginInProgress = true;
	}
	// Login post request
	await fetch(LOGIN_URL, {
		method: "POST",
		body: JSON.stringify({
			username: document.getElementById(USERNAME_VALUE_ID).value,
			password: document.getElementById(PASSWORD_VALUE_ID).value,
		}),
		headers: {
			"Content-type": "application/json"
		}
	}).then((res) => {
		if (res.status == 200) {
			window.location.replace(ROOT_URL);
		} else if (res.status == 401) {
			wrongLoginFeedback();
		} else {
			alert(`[${res.status}] - ${res.body}`);
		}
	});
	// Allow potential new request
	loginInProgress = false;
}

//# Login on Enter
document.addEventListener('keyup', (e) => {
  if (e.key == "Enter") {
    submitLogin();
  }
})
const USERNAME_VALUE_ID = "username-input";
const PASSWORD_VALUE_ID = "password-input";

const URL = location.protocol + '//' + location.host + location.pathname;

function submitLogin() {
    fetch(URL, {
        method: "POST",
        body: JSON.stringify({
          username: document.getElementById(USERNAME_VALUE_ID).value,
          password: document.getElementById(PASSWORD_VALUE_ID).value,
        }),
        headers: {
          "Content-type": "application/json; charset=UTF-8"
        }
    });
}
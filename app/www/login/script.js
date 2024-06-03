const USERNAME_VALUE_ID = "username-input";
const PASSWORD_VALUE_ID = "password-input";

const ROOT_URL = location.protocol + '//' + location.host;
const LOGIN_URL = ROOT_URL + "/login";

function submitLogin() {
    fetch(LOGIN_URL, {
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
        alert("Invalid username or password!");
      } else {
        alert(`[${res.status}] - ${res.body}`);
      }
    })
}
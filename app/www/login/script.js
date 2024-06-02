const USERNAME_VALUE_ID = "username-input";
const PASSWORD_VALUE_ID = "password-input";

const URL = location.protocol + '//' + location.host + location.pathname;

function submitLogin() {
  

  // Get the username and password from the input fields
  var username = document.getElementById("username-input").value;
  var password = document.getElementById("password-input").value;

  if (username !== "admin" || password !== "mojeheslo") {
      var errorImage = document.getElementById("wrong");
      errorImage.style.display = "block";


      var errorSound = document.getElementById("wrong-sound");
      errorSound.play();


      setTimeout(function() {
          errorImage.style.display = "none";
      }, 1000);
  } else {
  window.location.href = "../index.html"
  }
}

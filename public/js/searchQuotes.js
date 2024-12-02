document
  .getElementById("keywordForm")
  .addEventListener("submit", function (event) {
    const keywordInput = document.getElementById("keyword_input").value.trim();
    const errorMessage = document.getElementById("error-message");
    if (keywordInput.length < 3) {
      errorMessage.style.display = "block";
      event.preventDefault();
    } else {
      errorMessage.style.display = "none";
    }
  });

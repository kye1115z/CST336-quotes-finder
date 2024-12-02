// side bar
const currentUrl = window.location.pathname;

const links = document.querySelectorAll(".sidebar a");

links.forEach((link) => link.classList.remove("active"));

if (currentUrl === "/home") {
  document.getElementById("home").classList.add("active");
} else if (currentUrl === "/allAuthors" || currentUrl === "/editAuthor") {
  document.getElementById("allAuthors").classList.add("active");
} else if (currentUrl === "/addAuthor") {
  document.getElementById("addAuthor").classList.add("active");
} else if (currentUrl === "/searchQuotes" || currentUrl.includes("searchBy")) {
  document.getElementById("searchQuotes").classList.add("active");
} else if (currentUrl === "/allQuotes" || currentUrl === "/editQuote") {
  document.getElementById("allQuotes").classList.add("active");
} else if (currentUrl === "/addQuote") {
  document.getElementById("addQuote").classList.add("active");
}

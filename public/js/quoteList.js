let authorLinks = document.querySelectorAll(".authorLink");

authorLinks.forEach((i) => {
  i.addEventListener("click", displayAuthorInfo);
});

async function displayAuthorInfo() {
  let authorId = this.getAttribute("authorId");
  let url = `/api/author/${authorId}`;
  let data = await fetch(url).then((res) => res.json());

  let dobFormatted = new Date(data[0].dob);
  let dodFormatted = new Date(data[0].dod);

  document.querySelector(
    "#authorName"
  ).innerText = `${data[0].firstName} ${data[0].lastName}`;
  document.querySelector("#authorImage").src = data[0].portrait;
  document.querySelector(
    "#dob"
  ).innerHTML = `<span class="authorInfo_span">Date of birth: </span>${
    dobFormatted.getMonth() + 1
  }/${dobFormatted.getDate()}/${dobFormatted.getFullYear()}`;
  document.querySelector(
    "#dod"
  ).innerHTML = `<span class="authorInfo_span">Date of death: </span>${
    dodFormatted.getMonth() + 1
  }/${dodFormatted.getDate()}/${dodFormatted.getFullYear()}`;
  document.querySelector(
    "#profession"
  ).innerHTML = `<span class="authorInfo_span">Profession: </span>${data[0].profession}`;
  document.querySelector(
    "#country"
  ).innerHTML = `<span class="authorInfo_span">Country: </span>${data[0].country}`;
  document.querySelector(
    "#biography"
  ).innerHTML = `<span class="authorInfo_span">Biography: </span>${data[0].biography}`;

  const myModal = new bootstrap.Modal("#authorModal");
  myModal.show();
}

async function deleteQuote(quoteId) {
  const confirmed = confirm("Are you sure you want to delete this quote?");
  if (!confirmed) return;

  const response = await fetch("/deleteQuote", {
    method: "DELETE",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ quoteId }),
  });

  if (response.ok) {
    alert("Quote deleted successfully");
    location.reload();
  } else {
    const error = await response.text();
    alert(`Error: ${error}`);
  }
}

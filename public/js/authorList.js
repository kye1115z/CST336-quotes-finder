async function deleteAuthor(authorId) {
  const confirmed = confirm("Are you sure you want to delete this author?");
  if (!confirmed) return;

  const response = await fetch(`/deleteAuthor`, {
    method: "DELETE",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ authorId }),
  });

  if (response.ok) {
    alert("Author deleted successfully");
    location.reload();
  } else {
    const error = await response.text();
    alert(`Error: ${error}`);
  }
}

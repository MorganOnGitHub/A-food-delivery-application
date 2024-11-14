// public/js/search.js
document.getElementById('cuisineInput').addEventListener('input', async (event) => {
  const query = event.target.value;
  if (query.length < 2) {
    document.getElementById('suggestions').innerHTML = '';
    return;
  }

  const response = await fetch(`/api/cuisine-suggestions?query=${query}`);
  const cuisines = await response.json();
  const suggestionsBox = document.getElementById('suggestions');
  suggestionsBox.innerHTML = cuisines.map(cuisine => `<div class="suggestion-item">${cuisine}</div>`).join('');

  // Add click event listener to each suggestion
  document.querySelectorAll('.suggestion-item').forEach(item => {
    item.addEventListener('click', () => {
      document.getElementById('cuisineInput').value = item.textContent;
      suggestionsBox.innerHTML = '';
    });
  });
});

  
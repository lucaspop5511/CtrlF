const searchInput = document.getElementById('searchInput');
const pasteButton = document.getElementById('pasteButton');
const subjectDropdown = document.getElementById('subjectDropdown');
const resultsContainer = document.getElementById('resultsContainer');
const pageTitle = document.querySelector('h1');

let currentFile = subjectDropdown.value.split('|')[0]; // Extract initial file
let currentSubject = subjectDropdown.value.split('|')[1]; // Extract initial subject name

// Update the page title based on the subject
function updateTitle(subjectName) {
  pageTitle.innerHTML = `Bafta! - <span class="subject-title">${subjectName}</span>`;
}


// Function to fetch and parse the file
function fetchFile(filePath) {
  fetch(filePath)
    .then(response => {
      if (!response.ok) {
        throw new Error(`Failed to load ${filePath}`);
      }
      return response.text();
    })
    .then(data => {
      const questionsData = parseData(data);
      setupSearch(questionsData);
    })
    .catch(error => console.error(error));
}

// Parse the text file content into question-answer pairs
function parseData(rawData) {
  const questions = [];
  const lines = rawData.trim().split('\n');

  lines.forEach(line => {
    const splitIndex = line.indexOf(' : ');
    if (splitIndex !== -1) {
      const question = line.slice(0, splitIndex).trim();
      const answers = line.slice(splitIndex + 3).split('||').map(answer => answer.trim());
      questions.push({ question, answers });
    }
  });

  return questions;
}

// Set up the search functionality
function setupSearch(questionsData) {
  // Render search results
  function renderResults(filteredQuestions) {
    resultsContainer.innerHTML = '';
    if (filteredQuestions.length === 0) {
        resultsContainer.innerHTML = '<p class="no-results">No results found.</p>';
        return;
    }

    filteredQuestions.forEach((item, index) => {
        const resultDiv = document.createElement('div');
        resultDiv.className = 'result';

        // Generate the HTML for multiple answers
        const answersHTML = item.answers
            .map(answer => `<li>${answer}</li>`)
            .join('');

        resultDiv.innerHTML = `
            <div class="question">${item.question}</div>
            <ul class="answer" id="answer-${index}">${answersHTML}</ul>
        `;

        resultDiv.addEventListener('click', () => {
            const answerDiv = resultDiv.querySelector('.answer');
            answerDiv.classList.toggle('visible');
        });

        resultsContainer.appendChild(resultDiv);
    });
}

  // Handle input change
  searchInput.addEventListener('input', (event) => {
    const searchTerm = event.target.value.toLowerCase();
    const filteredQuestions = questionsData.filter(item =>
      item.question.toLowerCase().includes(searchTerm)
    );
    renderResults(filteredQuestions);
  });

  // Initial render (empty)
  renderResults(questionsData);
}

// Add functionality to toggle between Paste and Clear states
pasteButton.addEventListener('click', async () => {
  if (pasteButton.textContent === 'Paste') {
    try {
      const text = await navigator.clipboard.readText();
      searchInput.value = text;
      searchInput.dispatchEvent(new Event('input')); // Trigger input event to update results
      pasteButton.textContent = 'Clear';
      pasteButton.classList.add('clear'); // Add the 'clear' class
    } catch (err) {
      console.error('Failed to paste text: ', err);
      alert('Unable to paste text. Please allow clipboard permissions.');
    }
  } else {
    searchInput.value = ''; // Clear the input field
    searchInput.dispatchEvent(new Event('input')); // Trigger input event to update results
    pasteButton.textContent = 'Paste';
    pasteButton.classList.remove('clear'); // Remove the 'clear' class
  }
});

// Handle subject change
subjectDropdown.addEventListener('change', (event) => {
  const [filePath, subjectName] = event.target.value.split('|'); // Extract file and subject name
  currentFile = filePath;
  currentSubject = subjectName;

  updateTitle(currentSubject); // Update the page title
  fetchFile(currentFile); // Fetch and load new data
});

// Initial setup
updateTitle(currentSubject);
fetchFile(currentFile);

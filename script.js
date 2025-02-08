const searchInput = document.getElementById('searchInput');
const pasteButton = document.getElementById('pasteButton');
const subjectDropdown = document.getElementById('subjectDropdown');
const resultsContainer = document.getElementById('resultsContainer');
const pageTitle = document.querySelector('h1');

let currentFile = subjectDropdown.value.split('|')[0]; // Extract initial file
let currentSubject = subjectDropdown.value.split('|')[1]; // Extract initial subject name;

const darkModeToggle = document.getElementById('darkModeToggle');

// Check if user has dark mode enabled in local storage
if (localStorage.getItem('darkMode') === 'enabled') {
    document.body.classList.add('dark-mode');
    darkModeToggle.classList.add('dark-mode');
}

// Function to toggle dark mode
darkModeToggle.addEventListener('click', () => {
    document.body.classList.toggle('dark-mode');
    darkModeToggle.classList.toggle('dark-mode');

    // Save preference in local storage
    if (document.body.classList.contains('dark-mode')) {
        localStorage.setItem('darkMode', 'enabled');
    } else {
        localStorage.setItem('darkMode', 'disabled');
    }
});

// Update the page title based on the subject
function updateTitle(subjectName) {
  pageTitle.innerHTML = `Bafta! <span class="subject-title">${subjectName}</span>`;
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

  for (let i = 0; i < lines.length; i++) {
    let line = lines[i].trim();
    if (line === "") continue; // Ignorăm liniile goale

    const splitIndex = line.indexOf(' : ');
    if (splitIndex === -1) continue; // Linie invalidă, trecem la următoarea

    const question = line.slice(0, splitIndex).trim();
    let answerRaw = line.slice(splitIndex + 3); // Păstrăm spațiile și indentarea originală

    // Verificăm dacă răspunsul este un bloc de cod (începe și se termină cu paranteze)
    let isCodeBlock = answerRaw.startsWith('(');
    let collectedLines = isCodeBlock ? [answerRaw] : [];

    if (isCodeBlock) {
      let openParens = 1; // Numărăm parantezele deschise
      while (i + 1 < lines.length && openParens > 0) {
        let nextLine = lines[++i];
        collectedLines.push(nextLine);

        // Actualizăm numărul de paranteze deschise și închise
        openParens += (nextLine.match(/\(/g) || []).length;
        openParens -= (nextLine.match(/\)/g) || []).length;
      }
      answerRaw = collectedLines.join('\n');

      if (answerRaw.startsWith('(') && answerRaw.endsWith(')')) {
        answerRaw = answerRaw.slice(1, -1).trim();
      }

      // Afișăm blocul de cod cu indentarea intactă
      questions.push({ 
        question, 
        answers: [`<pre><code>${answerRaw.replace(/</g, "&lt;").replace(/>/g, "&gt;")}</code></pre>`] 
      });
      continue;
    }

    // Dacă NU este bloc de cod, tratăm răspunsurile multiple separate prin `||`
    const answerParts = answerRaw.split('||').map(part => `<li>${part.trim()}</li>`);

    questions.push({ question, answers: answerParts });
  }

  return questions;
}

// Set up the search functionality
function setupSearch(questionsData) {
  function renderResults(filteredQuestions) {
    resultsContainer.innerHTML = '';
    if (filteredQuestions.length === 0) {
        resultsContainer.innerHTML = '<p class="no-results">No results found.</p>';
        return;
    }

    // Actualizează numărul de rezultate
    resultsCount.textContent = `Results found: ${filteredQuestions.length}`;

    filteredQuestions.forEach((item, index) => {
      const resultDiv = document.createElement('div');
      resultDiv.className = 'result';

      const answersHTML = item.answers.join(''); // Deoarece răspunsurile sunt deja formatate

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
  
  function removeDiacritics(str) {
    return str.normalize("NFD").replace(/[\u0300-\u036f]/g, ""); // Elimină diacriticele
  }

  // Handle input change
  searchInput.addEventListener('input', (event) => {
    const searchTerm = removeDiacritics(event.target.value.toLowerCase());
    const filteredQuestions = questionsData.filter(item =>
      removeDiacritics(item.question.toLowerCase()).includes(searchTerm)
    );
    renderResults(filteredQuestions);

    // Show the "Clear" button if input has text
    if (searchInput.value.trim() !== "") {
      pasteButton.textContent = 'Clear';
      pasteButton.classList.add('clear');
    } else {
      pasteButton.textContent = 'Paste';
      pasteButton.classList.remove('clear');
    }
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
    } catch (err) {
      console.error('Failed to paste text: ', err);
      alert('Unable to paste text. Please allow clipboard permissions.');
    }
  } else {
    searchInput.value = ''; // Clear the input field
    searchInput.dispatchEvent(new Event('input')); // Trigger input event to update results
    searchInput.focus(); // Autofocus pe search input after clear
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

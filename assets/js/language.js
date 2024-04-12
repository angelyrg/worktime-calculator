
document.addEventListener('DOMContentLoaded', () => {
    const preferredLanguage = localStorage.getItem('preferredLanguage') || navigator.language.split('-')[0];
    const flagItems = document.querySelectorAll('.flag-item');

    changeLanguage(preferredLanguage);

    flagItems.forEach(item => {
        item.addEventListener('click', function(e) {
            e.preventDefault();
            const selectedLanguage = this.getAttribute('data-language');
            changeLanguage(selectedLanguage);
        });
    });
});


const changeLanguage = async language => {
  localStorage.setItem("preferredLanguage", language);
  const requestJson = await fetch(`./lang/${language}.json`);
  const texts = await requestJson.json();
  const textsToChange = document.querySelectorAll("[data-section][data-value]");
  for (const textToChange of textsToChange) {
    const section = textToChange.getAttribute("data-section");
    const value = textToChange.getAttribute("data-value");
    textToChange.innerHTML = texts[section][value];
  }

  updateDropdownButton(language);

  try {
    translates = await cargarTraducciones();
  } catch (error) {
    console.error(error.message);
  }
};

function updateDropdownButton(language) {
    const dropdownButton = document.getElementById('dropdownMenuButton');
    const selectedFlagItem = document.querySelector(`.flag-item[data-language="${language}"]`);
    if (selectedFlagItem) {
        dropdownButton.innerHTML = selectedFlagItem.innerHTML + ' <span class="caret"></span>';
    }
}

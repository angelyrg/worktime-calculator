
document.addEventListener('DOMContentLoaded', () => {
    const preferredLanguage = localStorage.getItem('preferredLanguage') || navigator.language.split('-')[0];
    const flagItems = document.querySelectorAll('.flag-item');

    changeLanguage(preferredLanguage);

    // Añadir manejadores de evento para cada item del dropdown
    flagItems.forEach(item => {
        item.addEventListener('click', function(e) {
            e.preventDefault(); // Prevenir la navegación
            const selectedLanguage = this.getAttribute('data-language');
            changeLanguage(selectedLanguage);
        });
    });
});


const changeLanguage = async language => {
  localStorage.setItem("preferredLanguage", language);

  // Carga el archivo JSON del idioma seleccionado
  const requestJson = await fetch(`./../../lang/${language}.json`);
  const texts = await requestJson.json();

  // Busca todos los elementos que necesitan ser actualizados
  const textsToChange = document.querySelectorAll("[data-section][data-value]");

  // Itera sobre los elementos y actualiza su contenido
  for (const textToChange of textsToChange) {
    const section = textToChange.getAttribute("data-section");
    const value = textToChange.getAttribute("data-value");
    textToChange.innerHTML = texts[section][value];
  }

  // Actualizar el botón del dropdown para reflejar el idioma seleccionado
  updateDropdownButton(language);

  //Actualiza la variable global translates
  try {
    translates = await cargarTraducciones();
  } catch (error) {
    console.error(error.message);
  }
};

// Función adicional para actualizar el botón del dropdown con la bandera e idioma actual
function updateDropdownButton(language) {
    const dropdownButton = document.getElementById('dropdownMenuButton');
    const selectedFlagItem = document.querySelector(`.flag-item[data-language="${language}"]`);
    if (selectedFlagItem) {
        dropdownButton.innerHTML = selectedFlagItem.innerHTML + ' <span class="caret"></span>';
    }
}

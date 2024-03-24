

// const flagsElement = document.getElementById("flags");
const textsToChange = document.querySelectorAll("[data-section]");

// flagsElement.addEventListener('click', (e)=>{
//     let language = e.target.dataset.language || e.target.parentElement.dataset.language;
//     if (language) {
//         changeLanguage(language);
//     }
// })


const changeLanguage = async language => {
    localStorage.setItem('preferredLanguage', language);

    const reqestJson = await fetch(`./lang/${language}.json`)
    const texts = await reqestJson.json();

    for (const textToChange of textsToChange) {
        const section = textToChange.dataset.section;
        const value = textToChange.dataset.value;
        textToChange.innerHTML = texts[section][value];   
    }

}


// document.addEventListener('DOMContentLoaded', () => {
//     const savedLanguage = localStorage.getItem('preferredLanguage');
//     const defaultLanguage = savedLanguage || navigator.language.split('-')[0];

//     changeLanguage(defaultLanguage);
// });




document.addEventListener('DOMContentLoaded', () => {
    const dropdownMenu = document.querySelector('#languageDropdown .dropdown-menu');

   

    dropdownMenu.addEventListener('click', (e) => {
        // Previene la navegación si se hace clic en el enlace
        e.preventDefault();

        // Encuentra el elemento <a> más cercano en la jerarquía para obtener el idioma
        const item = e.target.closest('.dropdown-item');
        const language = item ? item.dataset.language : undefined;

        if (language) {
            changeLanguage(language);

            // Actualiza el botón del dropdown para mostrar el idioma seleccionado
            const dropdownButton = document.querySelector('#languageDropdown > button');
            dropdownButton.innerHTML = item.innerHTML + ' <span class="caret"></span>';
        }
    });

    // Carga el idioma guardado o el idioma del navegador
    const savedLanguage = localStorage.getItem('preferredLanguage') || navigator.language.split('-')[0];
    changeLanguage(savedLanguage);
});

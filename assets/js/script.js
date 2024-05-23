document.addEventListener('DOMContentLoaded', function() {
    var checkbox = document.getElementById('menu_checkbox');
    var sidebar = document.querySelector('.sidebar_menu');

    checkbox.addEventListener('change', function() {
        if (checkbox.checked) {
            sidebar.style.display = 'flex';
            // sidebar.style.transform = 'translateX(0%)';
        } else {
            sidebar.style.display = "none";
            // sidebar.style.transform = 'translateX(-100%)';
        }
    });

    const tooltipTriggerList = document.querySelectorAll('[data-bs-toggle="tooltip"]');
    const tooltipList = [...tooltipTriggerList].map((tooltipTriggerEl) => new bootstrap.Tooltip(tooltipTriggerEl));
    
});


document.addEventListener("DOMContentLoaded", function () {
  const checkbox = document.getElementById("menu_checkbox");
  const label = document.querySelector('label[for="menu_checkbox"]');

  checkbox.addEventListener("change", function () {
    if (checkbox.checked) {
      label.innerHTML = `
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="icon icon-tabler icons-tabler-outline icon-tabler-x">
                    <path stroke="none" d="M0 0h24v24H0z" fill="none"/>
                    <path d="M18 6L6 18" />
                    <path d="M6 6l12 12" />
                </svg>
            `;
    } else {
      label.innerHTML = `
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="icon icon-tabler icons-tabler-outline icon-tabler-menu-2">
                    <path stroke="none" d="M0 0h24v24H0z" fill="none"/>
                    <path d="M4 6l16 0" />
                    <path d="M4 12l16 0" />
                    <path d="M4 18l16 0" />
                </svg>
            `;
    }
  });
});


// Sent Contact Form
const contactFormSelector = "#contact_form";

$(contactFormSelector).on("submit", (e) => {
  e.preventDefault();

  $.ajax({
    type: "POST",
    url: "saveForm.php",
    data: $(contactFormSelector).serialize(),
    beforeSend: function (){
        $("#sendContactBtn").text("Sending...");
    },
    success: function (data) {
        console.log(data);
    },
    complete: function(){
        $("#sendContactBtn").text("Send");        
    }
  });
});


async function simulateSendingEmail() {
  await sleep(1000);  
  $(contactFormSelector)[0].reset();
  console.log("Simulation finished");
}

// End Sent Contact Form



// Utils
function sleep(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
}
// End Utils
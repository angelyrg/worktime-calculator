document.addEventListener('DOMContentLoaded', function() {
    var checkbox = document.getElementById('menu_checkbox');
    var sidebar = document.querySelector('.sidebar_menu');

    checkbox.addEventListener('change', function() {
        if (checkbox.checked) {
            sidebar.style.transform = 'translateX(0%)';
        } else {
            sidebar.style.transform = 'translateX(-100%)';
        }
    });
});
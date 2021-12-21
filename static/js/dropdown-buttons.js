// Open the dropdown menu specific to switching language 
var inputElement = document.getElementById("languageDropdownMenuButton");
inputElement.addEventListener('click', function () {
    var dropdownMenu = document.getElementById("languageDropdownMenu")
    dropdownMenu.classList.toggle('currently-showing');
});

// Open the dropdown menu specific to switching language on mobile
var inputElement = document.getElementById("languageDropdownMenuButton-mobile");
inputElement.addEventListener('click', function () {
    var dropdownMenu = document.getElementById("languageDropdownMenu-mobile")
    dropdownMenu.classList.toggle('currently-showing');
});

// Open the dropdown menu specific to switching section, when user is on mobile 
var inputElement = document.getElementById("sectionDropdownMenuButton");
inputElement.addEventListener('click', function () {
    var dropdownMenu = document.getElementById("sectionDropdownMenu")
    dropdownMenu.classList.toggle('currently-showing');
});

// Close dropdown menus if the user clicks anywhere outside of one
window.onclick = function(event) {
  if (!event.target.matches('.dropdown-menu-button')) {
      var dropdowns = document.getElementsByClassName("dropdown-content");
      Array.from(dropdowns).forEach(element => {
          if (element.classList.contains('currently-showing')) {
              element.classList.remove('currently-showing')
          }
      });
  }
} 
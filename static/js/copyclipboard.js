// The button that will be used to copy to clipboard
// and the Icon that indicates the button's function
let copyButton = document.createElement('button');
copyButton.classList.add("copyclipboardbtn");

let copyIcon = document.createElement('i');
copyIcon.classList.add("far", "fa-clipboard");
copyButton.appendChild(copyIcon);

// Once the button is clicked, it is replaced by another
// (unclickable) indicating the clicked is done.
let copyButtonClicked = document.createElement('button');
copyButtonClicked.classList.add("copyclipboardOkbtn");
copyButtonClicked.disabled = true; 

let copyOkIcon = document.createElement('i');
copyOkIcon.classList.add("fas", "fa-check");
copyButtonClicked.appendChild(copyOkIcon);

// Will be incremented for each code highlight
let copyTargetId = 0

// Iterate over all <div class=".highligh"> which contain the code snippets
document.querySelectorAll('.highlight').forEach((hl) => {
    // We set a lot of IDs in here, and it's not required. 
    // Maybe it will come in handy in the future!

    // Add the buttons to the div (positioning and style is in clement.scss)
    let btn = copyButton.cloneNode([true]);
    let btnClicked = copyButtonClicked.cloneNode([true]);

    // Add the same copyTargetId to both, so they're linked together
    btn.setAttribute("copy-clipboard-target-id", copyTargetId);
    btnClicked.setAttribute("copy-clipboard-target-id", copyTargetId);

    // Set the ids of both buttons + div to something memorable
    btn.setAttribute('id', "codeHighlightButton-" + copyTargetId.toString());
    btnClicked.setAttribute('id', "codeHighlightButtonClicked-" + copyTargetId.toString());
    hl.setAttribute("id", 'codeHighlight-' + copyTargetId.toString());

    // add a click handler that triggers the copy function
    btn.addEventListener('click', (event) => {

        let targetId = btn.getAttribute("copy-clipboard-target-id");
        
        // Swap btn and btnClicked and then swap back in 2 seconds
        // This gives cool feedback to the user
        btnClicked.classList.toggle('clicked');
        setTimeout(function () {
            btnClicked.classList.toggle('clicked');
        }, 2000);

        let currentCodeDiv = document.getElementById('codeHighlight-' + targetId);
        currentCodeDiv = currentCodeDiv.getElementsByTagName('pre')[0];
        currentCodeDiv = currentCodeDiv.getElementsByTagName('code')[0].cloneNode([true]);

        // remove line numbers if there are any
        let elementsToRemove = currentCodeDiv.getElementsByClassName('ln');
        while(elementsToRemove.length > 0){
            elementsToRemove[0].parentNode.removeChild(elementsToRemove[0]);
        }
        
        // For more info regarding clipboard action, see:
        // https://developer.mozilla.org/en-US/docs/Web/API/Clipboard/writeText
        navigator.clipboard.writeText(currentCodeDiv.innerText).then(function () {
            // Do nothing when successfull
        }, function () {
            alert("Couldn't copy to clip board unfortunatly. Let me know by email or on GitHub!");
        });

    })

    // Append buttons to the code div and increment copyTargetId 
    hl.appendChild(btn);
    hl.appendChild(btnClicked);

    copyTargetId = copyTargetId + 1;

})

document.querySelectorAll('.collapsable').forEach((collapsableItem) => {

    // Goes through <div class="collapsable"> and add a collapse event to its collapse-btn
    // Event simply toggles the "Active" class of a targeted div.
    
    explainButton = collapsableItem.querySelector('.collapse-btn')

    let dataCollapseId = explainButton.getAttribute("data-collapseId");
    if (dataCollapseId != 'undefined') {

        let targetExplanationParagraph = document.getElementById('collapseId-' + dataCollapseId)

        explainButton.addEventListener("click", function (event) { 
            targetExplanationParagraph.classList.toggle('active');
        });
    }
});

// WIP
toggleAllButton = document.getElementById('toggle-all')
document.querySelectorAll('.approx-sign-btn').forEach((explainButton) => {

    let dataExplanationId = explainButton.getAttribute("data-explanation");
    if (dataExplanationId != 'undefined') {

        let targetExplanationParagraph = document.getElementById('approx-explain-' + dataExplanationId)

        explainButton.addEventListener("click", function (event) { 
            targetExplanationParagraph.classList.toggle('active');
        });
    }

});

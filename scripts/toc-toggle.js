document.addEventListener("DOMContentLoaded", () => {
    const tocTitle = document.querySelector("#quarto-margin-sidebar #toc-title");
    const tocLists = document.querySelectorAll("#quarto-margin-sidebar ul.collapse");

    if (!tocTitle) return;

    // Create the toggle triangle
    const toggleIcon = document.createElement("span");
    toggleIcon.innerHTML = "▶";
    toggleIcon.id = "toc-toggle-icon";
    toggleIcon.classList.add("toc-toggle-icon");
    toggleIcon.style.cursor = "pointer";
    toggleIcon.style.marginRight = "0.4rem";
    toggleIcon.style.userSelect = "none";
    toggleIcon.style.display = "inline-block";
    toggleIcon.style.transition = "transform 0.3s ease";

    tocTitle.prepend(toggleIcon);

    // Toggle logic
    let expanded = false;
    toggleIcon.addEventListener("click", () => {
        expanded = !expanded;

        // Always reset first
        tocLists.forEach(ul => ul.classList.remove("show"));

        // Then apply if expanding
        if (expanded) {
            tocLists.forEach(ul => ul.classList.add("show"));
        }

        // Rotate icon
        toggleIcon.classList.toggle("rotated", expanded);
    });
});

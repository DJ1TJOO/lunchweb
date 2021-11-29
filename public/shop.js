const categories = [...document.getElementsByClassName("categorie")];
const categoriePanes = [...document.getElementsByClassName("categorie-pane")];

categories[0].classList.toggle("active");
categoriePanes.find((x) => x.id === "categorie-pane-" + categories[0].id.split("-")[1]).classList.toggle("active");

for (let i = 0; i < categories.length; i++) {
	const categorie = categories[i];
	categorie.addEventListener("click", (e) => {
		for (let j = 0; j < categoriePanes.length; j++) {
			categoriePanes[j].classList.remove("active");
		}
		for (let j = 0; j < categories.length; j++) {
			categories[j].classList.remove("active");
		}
		categorie.classList.toggle("active");
		categoriePanes.find((x) => x.id === "categorie-pane-" + categorie.id.split("-")[1]).classList.toggle("active");
	});
}

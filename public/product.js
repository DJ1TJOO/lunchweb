const product = JSON.parse(document.getElementById("product-script").getAttribute("data-product"));
const productTypes = JSON.parse(document.getElementById("product-script").getAttribute("data-types"));

const createErrorMessage = (error) => {
	const container = document.getElementById("dashboard-message-container");

	const messageContainer = document.createElement("div");
	messageContainer.id = "message-" + Math.floor(Math.random() * 100) + 1;
	messageContainer.classList.add("message-container");

	const message = document.createElement("div");
	message.classList.add("message", "message-error");

	const close = document.createElement("div");
	close.classList.add("close");
	close.innerHTML = "&#10006;";
	close.setAttribute("onclick", `document.getElementById('${messageContainer.id}').remove()`);

	message.appendChild(close);
	message.innerHTML += error;

	messageContainer.appendChild(message);
	container.appendChild(messageContainer);
};

const createConfirgMessage = (confirm, cbConfirm, cbReject) => {
	const container = document.getElementById("dashboard-message-container");

	const messageContainer = document.createElement("div");
	messageContainer.id = "message-" + Math.floor(Math.random() * 100) + 1;
	messageContainer.classList.add("message-container");

	const message = document.createElement("div");
	message.classList.add("message");

	const close = document.createElement("div");
	close.classList.add("close");
	close.innerHTML = "&#10006;";
	close.setAttribute("onclick", `document.getElementById('${messageContainer.id}').remove(); `);

	message.appendChild(close);
	message.innerHTML += confirm;

	const conf = document.createElement("div");
	conf.classList.add("message-btn");
	conf.innerHTML = "Ja";
	conf.addEventListener("click", () => {
		messageContainer.remove();
		cbConfirm();
	});
	message.appendChild(conf);

	const reject = document.createElement("div");
	reject.classList.add("message-btn", "message-btn-error");
	reject.innerHTML = "Annuleer";
	reject.addEventListener("click", () => {
		messageContainer.remove();
		cbReject();
	});
	message.appendChild(reject);

	messageContainer.appendChild(message);
	container.appendChild(messageContainer);
};

const deleteProduct = (product) => {
	createConfirgMessage(
		"Weet u zeker dat u het product wilt verwijderen?",
		() =>
			fetch("/api/products/" + product.id, {
				method: "DELETE",
			})
				.then((response) => response.json())
				.then((res) => {
					if (res.success) {
						window.location.href = "/dashboard";
					} else {
						createErrorMessage("Er was een fout tijdens het verwijderen. <br>Probeer het opnieuw.");
					}
				})
				.catch(() => createErrorMessage("Er was een fout tijdens het verwijderen. <br>Probeer het opnieuw.")),
		() => {}
	);
};

let tempId = 0;

let productType = productTypes.find((x) => x.id === product.typeId);

const addOption = document.getElementById("add-option");
addOption.addEventListener("click", () => {
	if (!productType) {
		productType =
			productTypes[
				productTypes.push({
					id: "temp-id-" + tempId++,
					name: "",
					options: [],
				}) - 1
			];
	}

	const optionData =
		productType.options[
			productType.options.push({
				id: "temp-id-" + tempId++,
				name: "",
				type: 0,
			}) - 1
		];

	const row = document.createElement("div");
	row.classList.add("row");

	const columnOption = document.createElement("div");
	columnOption.classList.add("column");
	row.appendChild(columnOption);

	const option = document.createElement("input");
	option.type = "text";
	option.placeholder = "Optie";
	option.addEventListener("change", function () {
		if (this.value === "") {
			productType.options.splice(
				productType.options.findIndex((x) => x.id === optionData.id),
				1
			);
			row.remove();
		} else {
			optionData.name = this.value;
		}
	});
	columnOption.appendChild(option);

	const columnChoice = document.createElement("div");
	columnChoice.classList.add("column");
	row.appendChild(columnChoice);

	const optionAdd = document.createElement("div");
	optionAdd.classList.add("add");
	optionAdd.setAttribute("data-add-choice", "true");
	optionAdd.addEventListener("click", () => {
		if (!optionData.choices) {
			optionData.choices = [];
			optionData.type = 1;
		}

		const choiceData =
			optionData.choices[
				optionData.choices.push({
					id: "temp-id-" + tempId++,
					name: "",
				}) - 1
			];

		const choice = document.createElement("input");
		choice.type = "text";
		choice.placeholder = "keuze";
		choice.addEventListener("change", function () {
			if (this.value === "") {
				optionData.choices.splice(
					optionData.choices.findIndex((x) => x.id === choiceData.id),
					1
				);

				if (optionData.choices.length === 0) {
					optionData.type = 0;
					delete optionData.choices;
				}

				choice.remove();
			} else {
				choiceData.name = this.value;
			}
		});
		optionAdd.before(choice);
	});
	optionAdd.innerHTML = "+";
	columnChoice.appendChild(optionAdd);

	addOption.parentElement.parentElement.before(row);
});

if (productType) {
	for (let i = 0; i < productType.options.length; i++) {
		const optionData = productType.options[i];

		const row = document.createElement("div");
		row.classList.add("row");

		const columnOption = document.createElement("div");
		columnOption.classList.add("column");
		row.appendChild(columnOption);

		const option = document.createElement("input");
		option.type = "text";
		option.placeholder = "Optie";
		option.value = optionData.name;
		option.addEventListener("change", function () {
			if (this.value === "") {
				productType.options.splice(
					productType.options.findIndex((x) => x.id === optionData.id),
					1
				);
				row.remove();
			} else {
				optionData.name = this.value;
			}
		});
		columnOption.appendChild(option);

		const columnChoice = document.createElement("div");
		columnChoice.classList.add("column");
		row.appendChild(columnChoice);

		const optionAdd = document.createElement("div");
		optionAdd.classList.add("add");
		optionAdd.setAttribute("data-add-choice", "true");
		optionAdd.addEventListener("click", () => {
			if (!optionData.choices) {
				optionData.choices = [];
				optionData.type = 1;
			}

			const choiceData =
				optionData.choices[
					optionData.choices.push({
						id: "temp-id-" + tempId++,
						name: "",
					}) - 1
				];

			const choice = document.createElement("input");
			choice.type = "text";
			choice.placeholder = "keuze";
			choice.addEventListener("change", function () {
				if (this.value === "") {
					optionData.choices.splice(
						optionData.choices.findIndex((x) => x.id === choiceData.id),
						1
					);

					if (optionData.choices.length === 0) {
						optionData.type = 0;
						delete optionData.choices;
					}

					choice.remove();
				} else {
					choiceData.name = this.value;
				}
			});
			optionAdd.before(choice);
		});
		optionAdd.innerHTML = "+";
		columnChoice.appendChild(optionAdd);

		if (optionData.choices) {
			for (let i = 0; i < optionData.choices.length; i++) {
				const choiceData = optionData.choices[i];
				const choice = document.createElement("input");
				choice.type = "text";
				choice.placeholder = "keuze";
				choice.value = choiceData.name;
				choice.addEventListener("change", function () {
					if (this.value === "") {
						optionData.choices.splice(
							optionData.choices.findIndex((x) => x.id === choiceData.id),
							1
						);

						if (optionData.choices.length === 0) {
							optionData.type = 0;
							delete optionData.choices;
						}

						choice.remove();
					} else {
						choiceData.name = this.value;
					}
				});
				optionAdd.before(choice);
			}
		}

		addOption.parentElement.parentElement.before(row);
	}
}

const typeName = document.getElementById("type");
typeName.addEventListener("change", function () {
	if (this.value !== "" && this.value.length > 2) {
		if (!productType) {
			productType =
				productTypes[
					productTypes.push({
						id: "temp-id-" + tempId++,
						name: this.value,
						options: [],
					}) - 1
				];
		} else {
			productType.name = this.value;
		}
	} else {
		createErrorMessage(this.value + " is niet een geldige naam");
	}
});

const productName = document.getElementById("name");
productName.addEventListener("change", function () {
	if (this.value !== "" && this.value.length > 2) {
		product.title = this.value;
	} else {
		createErrorMessage(this.value + " is niet een geldige naam");
	}
});

const productPrice = document.getElementById("price");
productPrice.addEventListener("change", function () {
	try {
		const value = this.value.replace(",", ".");
		if (isNaN(value)) {
			createErrorMessage(this.value + " is niet een getal");
		} else {
			const price = Number(value);

			if (price < 0) {
				createErrorMessage(this.value + " is niet een getal");
			} else {
				product.price = price;
			}
		}
	} catch (error) {
		createErrorMessage(this.value + " is niet een getal");
	}
});

const productSummary = document.getElementById("summary");
productSummary.addEventListener("change", function () {
	product.summary = this.value;
});

const save = document.getElementById("save");
save.addEventListener("click", async () => {
	// Check product values
	if (product.title === "" || product.title.length < 3) {
		createErrorMessage(product.title + " is niet een geldige naam");
		return;
	}

	try {
		if (isNaN(product.price)) {
			createErrorMessage(product.price + " is niet een getal");
			return;
		} else {
			const price = Number(product.price);

			if (price < 0) {
				createErrorMessage(product.price + " is niet een getal");
				return;
			}
		}
	} catch (error) {
		createErrorMessage(product.price + " is niet een getal");
		return;
	}

	// Check type values
	if (!productType) {
		createErrorMessage("Vul een categorie naam in");
		return;
	}

	if (productType.name === "" || productType.name.length < 3) {
		createErrorMessage(productType.name + " is niet een geldige naam");
		return;
	}

	for (let i = 0; i < productType.options.length; i++) {
		const option = productType.options[i];

		if (option.name === "" || option.name.length < 3) {
			createErrorMessage(option.name + " is niet een geldige naam");
			return;
		}

		if (option.choices) {
			for (let i = 0; i < option.choices.length; i++) {
				const choice = option.choices[i];

				if (choice.name === "" || choice.name.length < 3) {
					createErrorMessage(choice.name + " is niet een geldige naam");
					return;
				}
			}
		}
	}

	if (product.typeId && product.typeId !== productType.id) {
		// Delete old
		try {
			const res = await fetch("/api/product-types/" + product.typeId, {
				method: "DELETE",
			});
			const jsonRes = await res.json();
			if (!jsonRes.success) {
				console.log(jsonRes);
				createErrorMessage("Kon oude categorie niet verwijderen. Probeer opnieuw");
				return;
			}
		} catch (error) {
			createErrorMessage("Kon oude categorie niet verwijderen. Probeer opnieuw");
			return;
		}
	}

	if (typeof productType.id !== "number" && productType.id.includes("temp")) {
		// Post new
		try {
			const res = await fetch("/api/product-types/", {
				method: "POST",

				headers: {
					Accept: "application/json",
					"Content-Type": "application/json",
				},
				body: JSON.stringify(productType),
			});
			const jsonRes = await res.json();
			if (!jsonRes.success) {
				console.log(jsonRes);
				createErrorMessage("Kon nieuwe categorie niet aanmaken. Probeer opnieuw");
				return;
			} else {
				product.type = jsonRes.data.name;
				product.typeId = jsonRes.data.id;
			}
		} catch (error) {
			createErrorMessage("Kon nieuwe categorie niet aanmaken. Probeer opnieuw");
			return;
		}
	} else {
		// Update product type
		try {
			const res = await fetch("/api/product-types/" + productType.id, {
				method: "PATCH",

				headers: {
					Accept: "application/json",
					"Content-Type": "application/json",
				},
				body: JSON.stringify(productType),
			});
			const jsonRes = await res.json();
			if (!jsonRes.success) {
				console.log(jsonRes);
				createErrorMessage("Kon categorie niet updaten. Probeer opnieuw");
				return;
			} else {
				product.type = jsonRes.data.name;
				product.typeId = jsonRes.data.id;
			}
		} catch (error) {
			createErrorMessage("Kon categorie niet updaten. Probeer opnieuw");
			return;
		}
	}

	if (!product.id || (typeof product.id !== "number" && product.id.includes("temp"))) {
		// Create product
		try {
			const res = await fetch("/api/products/", {
				method: "POST",

				headers: {
					Accept: "application/json",
					"Content-Type": "application/json",
				},
				body: JSON.stringify({
					...product,
					type: product.typeId,
				}),
			});
			const jsonRes = await res.json();
			if (!jsonRes.success) {
				console.log(jsonRes);
				createErrorMessage("Kon nieuw product niet aanmaken. Probeer opnieuw");
				return;
			} else {
				window.location.href = "/dashboard/edit/" + jsonRes.data.id;
			}
		} catch (error) {
			createErrorMessage("Kon nieuw product niet aanmaken. Probeer opnieuw");
			return;
		}
	} else {
		// Update product
		try {
			const res = await fetch("/api/products/" + product.id, {
				method: "PATCH",

				headers: {
					Accept: "application/json",
					"Content-Type": "application/json",
				},
				body: JSON.stringify({
					...product,
					type: product.typeId,
				}),
			});
			const jsonRes = await res.json();
			if (!jsonRes.success) {
				console.log(jsonRes);
				createErrorMessage("Kon product niet updaten. Probeer opnieuw");
				return;
			} else {
				window.location.href = "/dashboard/edit/" + jsonRes.data.id;
			}
		} catch (error) {
			createErrorMessage("Kon product niet updaten. Probeer opnieuw");
			return;
		}
	}
});

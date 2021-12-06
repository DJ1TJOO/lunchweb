// Do categorie switching
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

// Format price
const formatPrice = (price) =>
	Number(price).toLocaleString("nl-NL", {
		style: "currency",
		currency: "EUR",
	});

const productTypes = JSON.parse(document.getElementById("shop-script").getAttribute("data-product-types"));

// Create observer for cart to update total price
const cart = ObservableSlim.create([], true, (changes) => {
	for (let i = 0; i < changes.length; i++) {
		const change = changes[i];
		if (change.type === "update") {
			if (change.property !== "quantity" && change.property !== "length") continue;
			updateTotal();
		} else if (change.type === "add") {
			updateTotal();
		}
	}
});

// Update total price tag
const updateTotal = () => {
	let total = 0;
	for (let i = 0; i < cart.length; i++) {
		total += cart[i].quantity * cart[i].price;
	}
	const price = document.getElementById("total");
	price.innerText = formatPrice(total);
	return total;
};

const cartItems = document.getElementById("cart-items");

// Generate html for product
const addToCart = (product) => {
	const type = productTypes.find((type) => type.id === product.typeId);

	// Only generate new html if not existing
	for (let i = 0; i < cart.length; i++) {
		const cartItemData = cart[i];
		if (type) {
			let add = true;
			for (let i = 0; i < cartItemData.typeValue.options.length; i++) {
				const option = cartItemData.typeValue.options[i];
				if (option.type === 0) {
					if (option.value !== false) {
						add = false;
					}
				} else if (option.type === 1) {
					if (option.value !== 0) {
						add = false;
					}
				}
			}

			if (add) {
				cartItemData.quantity++;
				const cartItem = cartItems.querySelector(`[data-cart-id="${cartItemData.cartId}"]`);
				const quantity = cartItem.querySelector(".extra .amount .quantity");
				quantity.innerHTML = cartItemData.quantity;
				return;
			}
		} else {
			cartItemData.quantity++;
			const cartItem = cartItems.querySelector(`[data-cart-id="${cartItemData.cartId}"]`);
			const quantity = cartItem.querySelector(".extra .amount .quantity");
			quantity.innerHTML = cartItemData.quantity;
			return;
		}
	}

	// Create data for cart
	const cartItemData = product;
	do {
		cartItemData.cartId = Math.floor(Math.random() * 100) + 1;
	} while (cart.find((x) => x.cartId === cartItemData.cartId));
	cartItemData.quantity = 1;
	cartItemData.note = "";
	if (type) {
		cartItemData.typeValue = JSON.parse(JSON.stringify(type));
	}
	cart.push(cartItemData);

	// Create html elements
	const cartItem = document.createElement("div");
	cartItem.classList.add("cart-item");
	cartItem.setAttribute("data-id", product.id);
	cartItem.setAttribute("data-cart-id", cartItemData.cartId);

	const info = document.createElement("div");
	info.classList.add("info");
	cartItem.appendChild(info);
	const title = document.createElement("div");
	title.classList.add("title");
	title.innerText = product.title;
	info.appendChild(title);
	const price = document.createElement("div");
	price.classList.add("price");
	price.innerText = formatPrice(product.price);
	info.appendChild(price);

	const options = document.createElement("div");
	options.classList.add("options");
	cartItem.appendChild(options);
	if (type) {
		for (let i = 0; i < type.options.length; i++) {
			const option = type.options[i];
			// Extra
			if (option.type === 0) {
				const extra = document.createElement("label");
				extra.classList.add("extra");
				const input = document.createElement("input");
				input.id = cartItemData.cartId + " " + type.id + " " + i;
				input.type = "checkbox";
				input.checked = "unchecked";
				extra.addEventListener("click", () => {
					const value = document.getElementById(cartItemData.cartId + " " + type.id + " " + i).checked;
					cartItemData.typeValue.options[i].value = value;
				});
				cartItemData.typeValue.options[i].value = false;
				extra.appendChild(input);
				extra.innerHTML += option.name;
				options.appendChild(extra);
				// Select
			} else if (option.type === 1) {
				const selectDiv = document.createElement("div");
				selectDiv.classList.add("select");

				const title = document.createElement("div");
				title.classList.add("title");
				title.innerText = option.name;
				selectDiv.appendChild(title);

				const select = document.createElement("select");
				select.id = cartItemData.cartId + " " + type.id + " " + i;
				select.addEventListener("change", () => {
					const value = Number(document.getElementById(cartItemData.cartId + " " + type.id + " " + i).value);
					cartItemData.typeValue.options[i].value = value;
				});
				cartItemData.typeValue.options[i].value = option.choices[0].id;
				selectDiv.appendChild(select);

				for (let i = 0; i < option.choices.length; i++) {
					const choice = option.choices[i];
					const selectOption = document.createElement("option");
					selectOption.value = choice.id;
					selectOption.innerText = choice.name;
					select.appendChild(selectOption);
				}

				options.appendChild(selectDiv);
			}
		}
	}

	const extra = document.createElement("div");
	extra.classList.add("extra");
	cartItem.appendChild(extra);
	const note = document.createElement("input");
	note.classList.add("note");
	note.type = "text";
	note.placeholder = "Opmerking";
	note.addEventListener("change", () => {
		cartItemData.note = note.value;
	});
	extra.appendChild(note);
	const amount = document.createElement("div");
	amount.classList.add("amount");
	const quantity = document.createElement("div");
	quantity.classList.add("quantity");
	quantity.innerText = cartItemData.quantity;
	const remove = document.createElement("div");
	remove.classList.add("remove");
	remove.innerText = "-";
	remove.addEventListener("click", () => {
		cartItemData.quantity--;
		if (cartItemData.quantity <= 0) {
			cart.splice(
				cart.findIndex((x) => x.cartId === cartItemData.cartId),
				1
			);
			cartItem.remove();
		} else {
			updateTotal();
		}

		quantity.innerHTML = cartItemData.quantity;
	});
	amount.appendChild(remove);
	amount.appendChild(quantity);
	const add = document.createElement("div");
	add.classList.add("add");
	add.innerText = "+";
	add.addEventListener("click", () => {
		cartItemData.quantity++;
		updateTotal();
		quantity.innerHTML = cartItemData.quantity;
	});
	amount.appendChild(add);
	extra.appendChild(amount);

	cartItems.appendChild(cartItem);
};

// Set min date for order
const date = document.getElementById("date");
date.setAttribute("min", new Date(new Date().getTime() + 3 * 24 * 60 * 60 * 1000).toISOString().split("T")[0]);

// Check order and submit
const order = document.getElementById("order");
order.addEventListener("click", () => {
	const date = new Date(document.getElementById("date").value);
	// Already gone date
	if (!date || date.getTime() < new Date(new Date().getTime() + 2 * 24 * 60 * 60 * 1000).getTime()) {
		// TODO: error message
		return;
	}

	// No items
	if (cart.length < 1) {
		// TODO: error message
		return;
	}

	// TODO: confirm
	fetch("/api/orders", {
		method: "POST",
		headers: {
			Accept: "application/json",
			"Content-Type": "application/json",
		},
		body: JSON.stringify({
			deliver: date.getTime(),
			products: cart,
		}),
	}).then(async (response) => {
		// TODO: success message
		console.log(response);
		console.log(await response.json());
	});
});

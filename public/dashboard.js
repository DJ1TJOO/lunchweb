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

const completeOrder = (order) => {
	createConfirgMessage(
		"Weet u zeker dat u de bestelling wilt afronden?",
		() =>
			fetch("/api/orders/" + order.id, {
				method: "DELETE",
			})
				.then((response) => response.json())
				.then((res) => {
					if (res.success) {
						window.location.reload();
					} else {
						console.log(res);
						createErrorMessage("Er was een fout tijdens het afronden. <br>Probeer het opnieuw.");
					}
				})
				.catch(() => createErrorMessage("Er was een fout tijdens het afronden. <br>Probeer het opnieuw.")),
		() => {}
	);
};

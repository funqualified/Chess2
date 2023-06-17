class GameplayUI {
  async choiceUI(choices) {
    return new Promise((resolve) => {
      // Create buttons
      const buttonsContainer = document.createElement("div");
      buttonsContainer.classList.add("popup-ui");
      choices.forEach((choice) => {
        const button = document.createElement("button");
        button.innerText = choice.label;
        buttonsContainer.appendChild(button);
      });
      document.body.appendChild(buttonsContainer);

      // Button click handler
      const handleClick = (event) => {
        const clickedButton = event.target;
        const buttonText = clickedButton.innerText;
        const choice = choices.find((choice) => choice.label === buttonText);
        buttonsContainer.remove();
        resolve(choice.response); // Resolve the promise with the selected response
      };

      // Attach click event listeners to the buttons
      buttonsContainer.querySelectorAll("button").forEach((button) => {
        button.addEventListener("click", handleClick);
      });
    });
  }
}

gameplayUIManager = new GameplayUI();

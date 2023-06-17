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

  async QTUI() {
    return new Promise((resolve) => {
      const QTContainer = document.createElement("div");
      QTContainer.classList.add("popup-ui");
      QTContainer.innerHTML = `
    <input type="range" value="1" min="1" max="100" id="qt-slider" disabled>
    <button id="qt-button">PROMOTE!</button>
    `;
      document.body.appendChild(QTContainer);

      const handleClick = (event) => {
        clearInterval(interval);
        resolve(Math.abs(document.getElementById("qt-slider").value - 50));
        QTContainer.remove();
      };

      function increaseRangeValue() {
        if (document.getElementById("qt-slider").value < 100) {
          document.getElementById("qt-slider").value++;
        } else {
          clearInterval(interval);
          QTContainer.remove();
          resolve(100);
        }
      }

      const interval = setInterval(increaseRangeValue, 10);

      document.getElementById("qt-button").addEventListener("click", handleClick);
    });
  }
}

gameplayUIManager = new GameplayUI();

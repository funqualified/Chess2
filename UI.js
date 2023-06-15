function beginSingleplayer() {
  mods = [];
  $("input:checkbox[name=mods]:checked").each(function () {
    mods.push(GameTags[$(this).val()]);
  });
  startGame(mods);
}

function hostMultiplayer() {
  mods = [];
  $("input:checkbox[name=mods]:checked").each(function () {
    mods.push(GameTags[$(this).val()]);
  });

  startGame(mods, true);
  hostGame();
}

function joinMultiplayer() {
  joinGame($('input[name="PeerId"]').val());
}

window.onload = function () {
  const section = document.getElementById("mod-selector");
  section.innerHTML = "";
  Object.keys(GameTags).forEach((mod) => {
    const span = document.createElement("span");
    span.innerHTML = `<label>${convertToCapitalCase(mod)}</label><input type='checkbox' name='mods' value='${mod}' />`;
    span.setAttribute("title", GameTags[mod]);
    section.appendChild(span);
    section.appendChild(document.createElement("br"));
  });
};

function quit() {
  board = null;
  game = null;
  if (multiplayer) {
    peer.disconnect();
  }
  multiplayer = false;
  document.getElementById("game-space").innerHTML = "";
  document.getElementById("menu-space").classList.remove("hide");
}

//Helpers
function convertToCapitalCase(str) {
  // Replace underscores with spaces
  str = str.replace(/_/g, " ");

  // Convert to capital case
  str = str.toLowerCase().replace(/(?:^|\s)\w/g, function (match) {
    return match.toUpperCase();
  });

  return str;
}

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

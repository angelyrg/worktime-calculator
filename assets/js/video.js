let player;

// Tutorial de como usar la calculadora
function onYouTubeIframeAPIReady() {
  player = new YT.Player("player", {
    height: "390",
    width: "640",
    videoId: "AtPlaXdHdDw", //YOUTUBE VIDEO ID
    playerVars: {
      autoplay: 0,
      modestbranding: 1,
    },
  });
}

$("#videoModal").on("shown.bs.modal", function () {
  player.playVideo();
});

$("#videoModal").on("hide.bs.modal", function () {
  player.stopVideo();
});

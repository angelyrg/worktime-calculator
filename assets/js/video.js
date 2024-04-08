let player;

function onYouTubeIframeAPIReady() {
  player = new YT.Player("player", {
    height: "390",
    width: "640",
    videoId: "AtPlaXdHdDw",
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

let video;
let handPose;
let hands = [];
let painting;
let px = 0;
let py = 0;
let targetShape; // 目標形狀
let gameState = "playing"; // 遊戲狀態: "playing" 或 "finished"

function preload() {
  // Initialize HandPose model with flipped video input
  handPose = ml5.handPose({ flipped: true });
}

function mousePressed() {
  console.log(hands);
}

function gotHands(results) {
  hands = results;
}

function setup() {
  createCanvas(640, 480);

  // Create an off-screen graphics buffer for painting
  painting = createGraphics(640, 480);
  painting.clear();

  video = createCapture(VIDEO, { flipped: true });
  video.hide();

  // Start detecting hands
  handPose.detectStart(video, gotHands);

  // 設定目標形狀為圓形
  targetShape = createGraphics(640, 480);
  targetShape.clear();
  targetShape.stroke(0, 255, 0);
  targetShape.strokeWeight(4);
  targetShape.noFill();
  targetShape.ellipse(width / 2, height / 2, 200, 200); // 圓形目標
}

function draw() {
  image(video, 0, 0);

  if (gameState === "playing") {
    // 繪製目標形狀
    image(targetShape, 0, 0);

    // 確保至少檢測到一隻手
    if (hands.length > 0) {
      let hand = hands[0];
      let index = hand.index_finger_tip;
      let thumb = hand.thumb_tip;

      // 計算食指尖與拇指尖的中點
      let x = (index.x + thumb.x) * 0.5;
      let y = (index.y + thumb.y) * 0.5;

      // 當手指靠近時才繪製
      let d = dist(index.x, index.y, thumb.x, thumb.y);
      if (d < 20) {
        painting.stroke(255, 255, 0);
        painting.strokeWeight(8);
        painting.line(px, py, x, y);
      }

      // 更新上一個位置
      px = x;
      py = y;
    }

    // 將繪製的畫布疊加到視訊上
    image(painting, 0, 0);

    // 檢測是否完成目標形狀
    if (checkCompletion()) {
      gameState = "finished";
    }
  } else if (gameState === "finished") {
    fill(0, 255, 0);
    textSize(32);
    textAlign(CENTER, CENTER);
    text("挑戰完成！", width / 2, height / 2);
  }
}

// 檢測玩家是否完成目標形狀
function checkCompletion() {
  let pixels = painting.get();
  let targetPixels = targetShape.get();

  let matchCount = 0;
  let totalCount = 0;

  for (let x = 0; x < width; x++) {
    for (let y = 0; y < height; y++) {
      let paintingColor = pixels.get(x, y);
      let targetColor = targetPixels.get(x, y);

      // 如果目標形狀的像素是綠色，檢測是否匹配
      if (targetColor[1] === 255 && targetColor[0] === 0 && targetColor[2] === 0) {
        totalCount++;
        if (paintingColor[1] === 255 && paintingColor[0] === 255 && paintingColor[2] === 0) {
          matchCount++;
        }
      }
    }
  }

  // 如果匹配的像素比例超過一定閾值，則認為完成挑戰
  return matchCount / totalCount > 0.8;
}

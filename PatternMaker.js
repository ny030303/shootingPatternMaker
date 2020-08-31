let g_ctx = null;
let g_playPoint = null;
let g_playTime = 0;
let g_canvasWidth = 500;
let g_canvasHeight = 800;
let g_points = [
  {x: 250, y: 75, color: "blue"},
  {x: 250, y: 75, color: "red"},
  {x: 250, y: 725, color: "red"},
  {x: 250, y: 725, color: "blue"}
];

function deletePostion(targetId) {
  console.log(targetId);
  g_points.splice(targetId - 1, 2);
  updatePointList();
}

function updatePointList() {
  let elm = $(document.getElementById('pointList'));
  elm.empty();
  for (let i = 1; i < g_points.length; i += 2) {
    let html = `<div class="input-group mb-1">
  <input data-id="x${i}" type="text" class="form-control" placeholder="x" value="${g_points[i].x}">
  <input data-id="y${i}"type="text" class="form-control" placeholder="y" value="${g_points[i].y}">
  <div class="input-group-append btn-outline-dark">
    <button class="btn btn-outline-${i < 4 ? "dark" : "danger"}" type="button" ${i < 4 ? 'disabled' : ''} onClick="deletePostion(${i})">X</button>
  </div>
</div>`
    elm.append(html);
    elm.find('input').on('change keyup paste', e => {
      let value = e.target.value;
      if ($.isNumeric(value)) {
        let idx = e.target.dataset.id.substr(1);
        console.log(idx);
        switch (e.target.dataset.id.charAt(0)) {
          case 'x':
            g_points[Number(idx)].x = Number(value);
            break;
          case 'y':
            g_points[Number(idx)].y = Number(value);
            break;
        }
      }
    });
  }
}

function txtToPatternPoint() {
  let patternTxt = $('#txtPatternPoints').val();
  patternTxt = patternTxt.replace(/ /gm, '');
  patternTxt = patternTxt.replace(/\n/gm, '');
  patternTxt = patternTxt.replace(/x:/gm, '"x":');
  patternTxt = patternTxt.replace(/y:/gm, '"y":');
  patternTxt = patternTxt.replace(/color:/gm, '"color":');
  patternTxt = patternTxt.replace(/,]/gm, ']');
  let patternPts = [];
  try {
    patternPts = JSON.parse(patternTxt);
    console.log(patternPts);
    g_points = patternPts;
    updatePointList();
  } catch (e) {
    alert('JSON 형식에 맞지 않습니다.')
  }
}

function patternView() {
  let patternTxt = '[\n';
  g_points.forEach(pt => patternTxt += `  {x: ${pt.x}, y: ${pt.y}, color: "${pt.color}"},\n`);
  patternTxt += ']\n';
  //$('#txtPatternPoints').text(JSON.stringify(g_points, undefined, 2));
  $('#txtPatternPoints').text(patternTxt);
  $('#patternViewModal').modal('show');
}

function patternPlay(playT) {
  // console.log(playT);
  if (playT === undefined) playT = 0.0;
  if (Math.floor(playT) >= Math.floor(g_points.length / 2 - 1)) {
    g_playTime = 0;
    g_playPoint = null;
    return false;
  }
  const pow2 = (v) => Math.pow(v, 2);
  const pow3 = (v) => Math.pow(v, 3);
  // console.log(playT);
  let lastIdx = (Math.floor(playT) + 1) * 2 + 1;
  let p1 = g_points[lastIdx - 3];
  let p2 = g_points[lastIdx - 2];
  let p3 = g_points[lastIdx - 1];
  let p4 = g_points[lastIdx];

  if (lastIdx > 3) {
    p1 = g_points[lastIdx - 2];
    p2 = {x: (p1.x - g_points[lastIdx - 3].x) + p1.x, y: (p1.y - g_points[lastIdx - 3].y) + p1.y};
  }

  let t = playT - Math.floor(playT);
  // console.log(playT);
  g_playPoint = {
    x: pow3(1 - t) * p1.x + 3 * pow2(1 - t) * t * p2.x + 3 * (1 - t) * pow2(t) * p3.x + pow3(t) * p4.x,
    y: pow3(1 - t) * p1.y + 3 * pow2(1 - t) * t * p2.y + 3 * (1 - t) * pow2(t) * p3.y + pow3(t) * p4.y,
  };
  return true;
}

function render(time) {
  //console.log(time);
  g_ctx.beginPath();
  g_ctx.clearRect(0, 0, g_canvasWidth, g_canvasHeight);
  let stPt = g_points[0];
  let stCurvePt = g_points[1];
  for (let i = 2; i < g_points.length; i += 2) {
    let edCurvePt = g_points[i];
    let edPt = g_points[i + 1];

    let curveLine = new Path2D();
    g_ctx.lineWidth = 3;
    curveLine.moveTo(stPt.x, stPt.y);
    curveLine.bezierCurveTo(stCurvePt.x, stCurvePt.y, edCurvePt.x, edCurvePt.y, edPt.x, edPt.y);
    g_ctx.stroke(curveLine);

    let line = new Path2D();
    g_ctx.lineWidth = 1;
    line.moveTo(stPt.x, stPt.y);
    line.lineTo(stCurvePt.x, stCurvePt.y);
    g_ctx.stroke(line);

    let line2 = new Path2D();
    line2.moveTo(edPt.x, edPt.y);
    line2.lineTo(edCurvePt.x, edCurvePt.y);
    g_ctx.stroke(line2);
    g_ctx.lineWidth = 3;
    stPt = edPt;
    stCurvePt = {x: (edPt.x - edCurvePt.x) + edPt.x, y: (edPt.y - edCurvePt.y) + edPt.y};
  }

  g_points.forEach(pt => {
    g_ctx.fillStyle = pt.color;
    let circle = new Path2D();
    circle.moveTo(pt.x, pt.y);
    circle.arc(pt.x, pt.y, 4, 0, Math.PI * 2, true);
    g_ctx.fill(circle);
  });

  if (g_playPoint !== null && patternPlay(g_playTime))  {
    g_playTime += 0.001;
    g_ctx.fillStyle = "green";
    let circle = new Path2D();
    circle.moveTo(g_playPoint.x, g_playPoint.y);
    circle.arc(g_playPoint.x, g_playPoint.y, 7, 0, Math.PI * 2, true);
    g_ctx.fill(circle);
  }

  g_ctx.closePath();
  // requestAnimationFrame(render);
  setInterval(render, 50);
}

window.onload = () => {
  let canvas = document.getElementById("canvas");
  g_ctx = canvas.getContext("2d");
  g_canvasWidth = canvas.width;
  g_canvasHeight = canvas.height;

  let moveArcNum = null;

  canvas.addEventListener("mousedown", (e) => {
    // console.log(e);
    //offsetX: 499
    // offsetY: 598
    g_points.forEach((pt, i) => {
      if (Math.abs(e.offsetX - pt.x) < 5 && Math.abs(e.offsetY - pt.y) < 5) {
        moveArcNum = i;
      }
    });

    if (moveArcNum === null) {
      g_points.push({x: e.offsetX + 30, y: e.offsetY + 30, color: "red"});
      g_points.push({x: e.offsetX, y: e.offsetY, color: "blue"});
      updatePointList();
    }
  });

  canvas.addEventListener("mousemove", (e) => {
    //console.log(e);
    //offsetX: 499
    // offsetY: 598
    if (moveArcNum !== null) {
      g_points[moveArcNum].x = e.offsetX;
      g_points[moveArcNum].y = e.offsetY;
      updatePointList();
    }
  });

  document.addEventListener("mouseup", (e) => {
    //console.log(e);
    //offsetX: 499
    // offsetY: 598
    moveArcNum = null;
  });

  updatePointList();
  render();
};
import { AnnotatedPrediction } from "@tensorflow-models/face-landmarks-detection/dist/mediapipe-facemesh";
import {
  Coord2D,
  Coords3D,
} from "@tensorflow-models/face-landmarks-detection/dist/mediapipe-facemesh/util";

const drawMask = (
  ctx: CanvasRenderingContext2D,
  keypoints: Coords3D,
  distance: number
) => {
  const points = [
    93,
    132,
    58,
    172,
    136,
    150,
    149,
    176,
    148,
    152,
    377,
    400,
    378,
    379,
    365,
    397,
    288,
    361,
    323,
  ];

  ctx.moveTo(keypoints[195][0], keypoints[195][1]);
  for (let i = 0; i < points.length; i++) {
    if (i < points.length / 2) {
      ctx.lineTo(
        keypoints[points[i]][0] - distance,
        keypoints[points[i]][1] + distance
      );
    } else {
      ctx.lineTo(
        keypoints[points[i]][0] + distance,
        keypoints[points[i]][1] + distance
      );
    }
  }
};

export const draw = (
  predictions: AnnotatedPrediction[],
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number
) => {
  if (predictions.length > 0) {
    predictions.forEach((prediction: AnnotatedPrediction) => {
      const keypoints = prediction.scaledMesh;
      const boundingBox = prediction.boundingBox;
      const bottomRight = boundingBox.bottomRight as Coord2D;
      const topLeft = boundingBox.topLeft as Coord2D;
      // 顔のサイズを参考に、マスクを少しだけ大きくする
      const distance =
        Math.sqrt(
          Math.pow(bottomRight[0] - topLeft[0], 2) +
            Math.pow(topLeft[1] - topLeft[1], 2)
        ) * 0.02;
      ctx.clearRect(0, 0, width, height);
      ctx.fillStyle = "black";
      ctx.save();
      ctx.beginPath();
      drawMask(ctx, keypoints as Coords3D, distance);
      ctx.closePath();
      ctx.fill();
      ctx.restore();
    });
  }
};

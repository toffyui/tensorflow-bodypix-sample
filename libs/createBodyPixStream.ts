import "@tensorflow/tfjs-core";
import "@tensorflow/tfjs-converter";
import "@tensorflow/tfjs-backend-webgl";
import * as bodyPix from "@tensorflow-models/body-pix";
import { ModelConfig } from "@tensorflow-models/body-pix/dist/body_pix_model";
import { useEffect, useState } from "react";

interface CanvasCaptureMediaStreamTrack extends MediaStreamTrack {
  requestFrame(): void;
}
interface CanvasMediaStream extends MediaStream {
  getAudioTracks(): CanvasCaptureMediaStreamTrack[];
  getTrackById(trackId: string): CanvasCaptureMediaStreamTrack | null;
  getTracks(): CanvasCaptureMediaStreamTrack[];
  getVideoTracks(): CanvasCaptureMediaStreamTrack[];
}
export interface CanvasElement extends HTMLCanvasElement {
  captureStream(frameRate?: number): CanvasMediaStream;
}

interface Props {
  width?: number;
  height?: number;
  fps?: number;
  onUpdate: (segment: bodyPix.SemanticPersonSegmentation) => void;
  onVideoUpdate: (video: HTMLVideoElement) => void;
}

const BodyPixParams: ModelConfig = {
  architecture: "MobileNetV1",
  outputStride: 16,
  multiplier: 0.75,
  quantBytes: 2,
};

export const createBodyPixStream = ({
  width,
  height,
  fps,
  onUpdate,
  onVideoUpdate,
}: Props): Promise<MediaStream> => {
  return new Promise((resolve) => {
    navigator.mediaDevices
      .getUserMedia({
        video: {
          width,
          height,
          frameRate: fps,
        },
        audio: false,
      })
      .then((video) => {
        const inputVideo = document.createElement("video");
        inputVideo.autoplay = true;
        const stream = new MediaStream(video.getVideoTracks());
        inputVideo.srcObject = stream;
        inputVideo.onloadedmetadata = async () => {
          const settings = video
            .getVideoTracks()[0]
            .getSettings() as Required<MediaTrackSettings>;
          inputVideo.width = settings.width;
          inputVideo.height = settings.height;
          let bodypixnet: bodyPix.BodyPix | null = await bodyPix.load(
            BodyPixParams
          );
          const handleStop = () => {
            if (bodypixnet) {
              bodypixnet.dispose();
              bodypixnet = null;
            }
          };
          stream.addEventListener("stop", handleStop);

          inputVideo.addEventListener("timeupdate", () => {
            bodypixnet?.segmentPerson(inputVideo).then(onUpdate);
            onVideoUpdate(inputVideo);
          });
          resolve(stream);
        };
      });
  });
};

export const useBodyPix = () => {
  const [stream, setStream] = useState<MediaStream>();
  const [segment, setSegment] = useState<bodyPix.SemanticPersonSegmentation>();
  const [video, setVideo] = useState<HTMLVideoElement>();
  useEffect(() => {
    createBodyPixStream({
      onUpdate: setSegment,
      onVideoUpdate: setVideo,
    }).then(setStream);
  }, []);
  return { stream, segment, video };
};

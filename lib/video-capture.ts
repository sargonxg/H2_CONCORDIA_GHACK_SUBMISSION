'use client';

export class VideoCapture {
  private mediaStream: MediaStream | null = null;
  private captureInterval: number | null = null;

  async startScreenShare(): Promise<MediaStream> {
    this.stop();
    this.mediaStream = await navigator.mediaDevices.getDisplayMedia({
      video: { frameRate: 1 },
      audio: false
    });
    return this.mediaStream;
  }

  async startCamera(): Promise<MediaStream> {
    this.stop();
    this.mediaStream = await navigator.mediaDevices.getUserMedia({
      video: { width: 1280, height: 720, frameRate: 1 },
      audio: false
    });
    return this.mediaStream;
  }

  startFrameCapture(onFrame: (base64: string) => void, fps: number = 1): void {
    if (!this.mediaStream) return;

    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d')!;
    const video = document.createElement('video');
    video.srcObject = this.mediaStream;
    video.play();

    this.captureInterval = window.setInterval(() => {
      if (video.readyState >= video.HAVE_CURRENT_DATA) {
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        ctx.drawImage(video, 0, 0);
        const base64 = canvas.toDataURL('image/jpeg', 0.7).split(',')[1];
        if (base64) onFrame(base64);
      }
    }, 1000 / fps);
  }

  captureSnapshot(): string | null {
    if (!this.mediaStream) return null;
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d')!;
    const video = document.createElement('video');
    video.srcObject = this.mediaStream;
    // Note: snapshot requires video to be playing
    canvas.width = video.videoWidth || 1280;
    canvas.height = video.videoHeight || 720;
    ctx.drawImage(video, 0, 0);
    return canvas.toDataURL('image/jpeg', 0.8);
  }

  getStream(): MediaStream | null {
    return this.mediaStream;
  }

  stop(): void {
    if (this.captureInterval) {
      clearInterval(this.captureInterval);
      this.captureInterval = null;
    }
    if (this.mediaStream) {
      this.mediaStream.getTracks().forEach(track => track.stop());
      this.mediaStream = null;
    }
  }
}

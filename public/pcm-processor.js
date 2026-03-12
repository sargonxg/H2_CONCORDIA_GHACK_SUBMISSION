// AudioWorklet processor — runs in a dedicated audio thread.
// Converts Float32 input to Int16 PCM and posts buffers to the main thread
// for transmission to the Gemini Live API.
class PCMProcessor extends AudioWorkletProcessor {
  process(inputs) {
    const input = inputs[0];
    if (!input || !input[0]) return true;

    const float32 = input[0];
    const pcm16 = new Int16Array(float32.length);
    for (let i = 0; i < float32.length; i++) {
      const clamped = Math.max(-1, Math.min(1, float32[i]));
      pcm16[i] = clamped < 0 ? clamped * 0x8000 : clamped * 0x7fff;
    }
    // Transfer the buffer to avoid a copy
    this.port.postMessage({ pcm16 }, [pcm16.buffer]);
    return true;
  }
}

registerProcessor("pcm-processor", PCMProcessor);

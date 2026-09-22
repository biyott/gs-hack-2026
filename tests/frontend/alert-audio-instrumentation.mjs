export function instrumentAudio() {
  const events = [];
  let nextId = 0;
  let activeSpeech = null;
  const activeBeeps = new Set();
  const resumes = [];
  const cancelledSpeech = [];
  let deferResume = false;
  const emit = (kind, details = {}) => events.push({ kind, at: Date.now(), ...details });
  class Oscillator {
    constructor() {
      this.id = ++nextId;
      this.frequency = { value: 0 };
      this.onended = null;
      this.timer = null;
    }
    connect() {}
    disconnect() {}
    start() {
      activeBeeps.add(this.id);
      emit("beep-start", { id: this.id, overlap: Boolean(activeSpeech) || activeBeeps.size > 1 });
    }
    stop(when) {
      if (this.timer !== null) clearTimeout(this.timer);
      const finish = () => {
        if (activeBeeps.delete(this.id)) emit("beep-stop", { id: this.id });
        this.onended?.();
      };
      if (when === undefined) finish();
      else this.timer = setTimeout(finish, Math.max(0, when * 1000 - Date.now()));
    }
  }
  class Context {
    constructor() {
      this.destination = {};
    }
    get currentTime() {
      return Date.now() / 1000;
    }
    resume() {
      emit("resume");
      return deferResume ? new Promise((resolve) => resumes.push(resolve)) : Promise.resolve();
    }
    createOscillator() {
      return new Oscillator();
    }
    createGain() {
      return { gain: { setValueAtTime() {}, exponentialRampToValueAtTime() {} }, connect() {} };
    }
    close() {
      emit("context-close");
      return Promise.resolve();
    }
  }
  class Utterance {
    constructor(text) {
      this.text = text;
      this.lang = "";
      this.rate = 1;
      this.onend = null;
      this.onerror = null;
    }
  }
  Object.defineProperty(window, "AudioContext", { configurable: true, value: Context });
  Object.defineProperty(window, "SpeechSynthesisUtterance", {
    configurable: true,
    value: Utterance,
  });
  Object.defineProperty(window, "speechSynthesis", {
    configurable: true,
    value: {
      cancel() {
        emit("speech-cancel", { wasActive: Boolean(activeSpeech) });
        if (activeSpeech) cancelledSpeech.push(activeSpeech);
        activeSpeech = null;
      },
      speak(utterance) {
        emit("speech-start", {
          text: utterance.text,
          overlap: Boolean(activeSpeech) || activeBeeps.size > 0,
        });
        activeSpeech = utterance;
      },
    },
  });
  window.audioProbe = {
    events,
    setDeferred(value) {
      deferResume = value;
    },
    resumeAll() {
      for (const resolve of resumes.splice(0)) resolve();
    },
    finishCancelled() {
      for (const utterance of cancelledSpeech.splice(0)) {
        utterance.onend?.();
        utterance.onerror?.();
      }
    },
    clear() {
      events.length = 0;
    },
    get active() {
      return { speech: Boolean(activeSpeech), beeps: activeBeeps.size };
    },
  };
}

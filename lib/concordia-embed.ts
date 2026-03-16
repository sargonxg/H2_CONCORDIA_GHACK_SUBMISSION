// Web Component wrapper for CONCORDIA
// Usage: <concordia-mediator api-endpoint="..." case-id="..." />

export function registerConcordiaElement() {
  if (typeof window === 'undefined') return;
  if (customElements.get('concordia-mediator')) return;

  class ConcordiaMediator extends HTMLElement {
    private shadow: ShadowRoot;
    private iframe: HTMLIFrameElement | null = null;

    static get observedAttributes() {
      return ['api-endpoint', 'case-id', 'party-a', 'party-b', 'theme', 'layout'];
    }

    constructor() {
      super();
      this.shadow = this.attachShadow({ mode: 'open' });
    }

    connectedCallback() {
      const apiEndpoint = this.getAttribute('api-endpoint') || window.location.origin;
      const layout = this.getAttribute('layout') || 'full';

      this.shadow.innerHTML = `
        <style>
          :host { display: block; width: 100%; height: 100%; }
          iframe { width: 100%; height: 100%; border: none; border-radius: 12px; }
        </style>
        <iframe src="${apiEndpoint}/embed?layout=${layout}&caseId=${this.getAttribute('case-id') || ''}"
                allow="microphone; camera; display-capture"></iframe>
      `;

      this.iframe = this.shadow.querySelector('iframe');
    }

    attributeChangedCallback(name: string, oldValue: string, newValue: string) {
      if (this.iframe && oldValue !== newValue) {
        this.iframe.contentWindow?.postMessage({
          type: `concordia:attributeChanged`,
          payload: { name, value: newValue }
        }, '*');
      }
    }

    disconnectedCallback() {
      this.iframe = null;
    }
  }

  customElements.define('concordia-mediator', ConcordiaMediator);
}

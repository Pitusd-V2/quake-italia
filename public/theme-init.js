// Applica tema (chiaro di base), testo e contrasto prima del primo disegno, per evitare "lampi".
// È un file a parte (non uno <script> dentro la pagina) così la Content-Security-Policy
// può vietare tutti gli script in linea.
(function () {
  try {
    var s = JSON.parse(localStorage.getItem('quakeitalia:settings:v1') || '{}');
    var r = document.documentElement;
    r.dataset.theme = s.theme === 'dark' || s.theme === 'auto' ? s.theme : 'light';
    if (s.textSize === 'normal' || s.textSize === 'large' || s.textSize === 'xlarge') r.dataset.textSize = s.textSize;
    if (s.highContrast === true) r.dataset.contrast = 'high';
  } catch (e) {
    document.documentElement.dataset.theme = 'light';
  }
})();

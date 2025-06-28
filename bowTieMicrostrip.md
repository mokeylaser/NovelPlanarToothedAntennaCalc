# Bow‑Tie Microstrip Antenna — Key Equations & JavaScript Implementation

---

## 1  Effective Relative Permittivity (ε\_eff)   *(Eq. 11)*

$$
\varepsilon_{\text{eff}}\;=\;\frac{\varepsilon_r+1}{2}\;+
\;\frac{\varepsilon_r-1}{2}\Bigl(1+\frac{24h}{W+W_c}\Bigr)^{-1/2}
$$

*Variables*

* **ε\_r** : substrate relative permittivity
* **h** : substrate thickness (m)
* **W** : mouth width at outer edge (m)
* **W\_c** : width at the feed gap (m)

---

## 2  Fringing‑Field Length Extension (ΔL)   *(Eq. 10)*

$$
\Delta L\;=\;\frac{0.412\,h\,(\varepsilon_{\text{eff}}+0.3)
\left(\dfrac{W+W_c}{2h}+0.262\right)}
{(\varepsilon_{\text{eff}}-0.258)
\left(\dfrac{W+W_c}{2h}+0.813\right)}
$$

---

## 3  Fundamental Resonance Frequency (f\_r)   *(Eq. 9)*

$$
\displaystyle
f_r\;=\;\frac{1.152\,c}{2\,L\sqrt{\varepsilon_{\text{eff}}}}
\;\frac{(W+2\Delta L)+(W_c+2\Delta L)}{(W+2\Delta L)(S+2\Delta L)}
$$

*Extra variables*

* **c** : speed of light ≈ 299 792 458 m/s
* **L** : half‑height of each triangular wing (m)
* **S** : slanted‑edge (flare) length (m)

---

## 4  JavaScript Drop‑in Functions

```javascript
const C0 = 299792458; // speed of light (m/s)

// ε_eff  (Eq. 11)
function epsEff(eps_r, h, W, Wc) {
  return 0.5 * (eps_r + 1) +
         0.5 * (eps_r - 1) * Math.pow(1 + 24 * h / (W + Wc), -0.5);
}

// ΔL  (Eq. 10)
function deltaL(h, eps_eff, W, Wc) {
  const k = (W + Wc) / (2 * h);
  return (0.412 * h * (eps_eff + 0.3) * (k + 0.262)) /
         ((eps_eff - 0.258) * (k + 0.813));
}

// f_r  (Eq. 9)
function resonanceFreq(L, W, Wc, S, h, eps_r) {
  const eps_eff = epsEff(eps_r, h, W, Wc);
  const dL      = deltaL(h, eps_eff, W, Wc);
  const num     = (W + 2 * dL) + (Wc + 2 * dL);
  const den     = (W + 2 * dL) * (S + 2 * dL);
  return (1.152 * C0 * num) / (2 * L * den * Math.sqrt(eps_eff));
}

// Example usage
const L  = 0.025;   // metres
const W  = 0.018;
const Wc = 0.003;
const S  = 0.020;
const h  = 0.0016;
const er = 4.4;     // FR‑4

console.log(`f_r ≈ ${ (resonanceFreq(L,W,Wc,S,h,er)/1e9).toFixed(3) } GHz`);
```

---

### Quick Notes & Tips

* These closed‑form expressions are a **first‑order estimate**; plan to fine‑tune in an EM solver (HFSS, CST, Sonnet, openEMS…).
* The empirical factor **1.152** compensates for the bow‑tie flare; omit it when comparing against pure cavity‑model literature.
* Tight control of **h** and **ε\_r** fabrication tolerances is crucial—both slide ε\_eff **and** ΔL.

Happy etching & simulating! 🎸

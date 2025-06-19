KC3VJA 16-June-2025
I really like planar toothed log periodic antennas. I think they look cool, and in my experience, they are very functional. 
About 18 months ago, I was sitting through a boring seminar, and I decided to see if I could write a calculator app for my favorite antenna.
I started working on it in the seminar, then I spent most of the following weeknd getting it working. I tweaked it here and there for a few months, then I mostly forgot about it.
Two months ago, I decided to jump back in and make the calculator into a usable and user-friendly web app. This is the result so far.
I based the calculations on: A. Scheuring, S. Wuensch and M. Siegel, "A Novel Analytical Model of Resonance Effects of Log-Periodic Planar Antennas," 
in IEEE Transactions on Antennas and Propagation, vol. 57, no. 11, pp. 3482-3488, Nov. 2009, doi: 10.1109/TAP.2009.2025191.

Traditional calculators treat the "teeth" of the antenna as half or quarter-wave resonators, based on drawing an imaginary line down the center of the tooth, and 
using those radii to approximate the length of the antenna element. 

This calculator is "novel" in the sense that it bases the resonant frequency on the length of the edge of the gap or "anti-tooth". In simulations of 
a planar toothed antenna using something like CST Studio, one can see that the current at resonance is concentrated at the points
where the teeth meet the bowtie section, as shown in the paper referenced above. 





 

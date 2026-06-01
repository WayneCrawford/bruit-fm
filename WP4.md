# WP4: Seafloor Signal Separation and Noise Removal

This WP applies advanced signal processing techniques to separate signal/noise sources and tests the use of a new rotational sensor.

## Objectives
Increase sensitivity to low-frequency seismological signals (normal modes, teleseisms...)
- Improve the quality and depth penetration of ambient noise and compliance techniques
- Better understand the sources of noise and the noise floor in this frequency band

## Tasks

| Number | Title | Responsable | Status |  Project Management |
| ------ | ------ | ---------- | ------ | ------------------- |
| T4.1   | ~~Reducing horizontal noise using a rotational seismometer~~ | @Crawford, Frederic | Replaced by T4.5 |  |
| T4.2   | Signal separation/removal techniques | Ker, @Crawford |  completed | |
| T4.3   | Separating seismological and biological signals | Ker, Duval | not started | |
| T4.4   | Noise reduction challenge | @Crawford, Duval, Ker | underway | |
| T4.5   | Rotational seismometer specification | @Crawford | underway | |

## Deliverables

| Number | Title | Due Date | Status |
| ------ | ------ | ---------- | ------ |
| D4.1  | Report on rotational seismometer integration in BBOBS | M12 | not started |
| D4.2 | Open source software for noise separation and removal | M24-48 | Completed: Crawford, Amininan, Rebeyrol |
| D4.3 | Catalog of seafloor noise sources | M36 | not started |
| D4.3 | Scientific articles | M24-48 | Rebeyrol, Aminian |

## Details

### ~~Task 4.1: Reducing horizontal noise using a rotational seismometer~~
The task was planned to reducing seafloor horizontal noise levels using the iXblue blueSeis-1C rotational seismometer. iXblue
was sold, renamed as eXail, and the new management removed the bleuSeis division.  **Task 4.5 replaces this task.**

### Task 4.2: Signal processing techniques for signal separation and noise removal
This task will be run in collaboration between IPGP and IFREMER with the support of a postdoctoral researcher specialised in signal analysis/processing and a broad group of signal processing experts from ESIEE, iXBlue, GEO3BCN and GIPSA-Lab.
- **4.2.1 Revisiting the transfer function approach**. Develop new methods to determine the transfer function, using critical data window and solution selection as well as improvements to the conventional transfer function using analytic signal theory.
- **4.2.2 Signal separation based on adaptive template subtraction**. We will adapt a family of short templates (obtained by recording, modelling or learning) on longer signals. We will develop shaping filters in a spectrogram or wavelet domain to perform a fast optimisation of template adaptation in
amplitude, time and frequency.
- **4.2.3: Physics-based noise removal** Compare the effectiveness of the above techniques with
methods based on the known physical relations (for example, optimised sensor reorientation)
- **4.2.4 Frontier techniques**: In environments where strong scattered and non-stationary background
noise is present, we will investigate broad source separation methods relying on very-limited modelling assumptions (e.g. Ning et al., 2014).

### Task 4.3: Separating seismological and biological signals
We will develop an approach to separate simultaneous seismological and whale call signals in the shared frequency band around 20 Hz, including the challenging chorus footprint (Bouffaut et al., 2018). We will use recently developed signal deconvolution/restoration techniques (SPOQ) using sparse non-convex norm-ratio penalties (Cherni et al., 2020) to characterise the overlapping signals using robust statistical measures (moments and moment ratios) to enhance their differences and assist their separation.

### Task 4.4: The Bruit-FM open data noise reduction challenge
Proposed in mid-project, the challenge asks researchers to reduce noise on real and synthetic datasets, and to send
their results to us.  Once the results are received and rated, a community workshop will be held to compare the different
methods and to draw conclusions about the most effecient existing methods and pathways for future improvements.
Challenge and training datasets are available on Zenodo, and an article describing the Challenge has been submitted
to Seismica.

### Task 4.5: Rotational seismometer specification
After the restructuring of eXail in 2023 led to the abandonment of their BlueSeis rotational seismology division, this
project decided to redirect the funds, originally planned for the addition of a BlueSeis rotational seismometer to an existing broad-band OBS, to the design of a BBOBS with rotational seismometer with enhanced rotational sensitivity, so that the seafloor instrument could have comparable horizontal channel noise levels to a buried instrument.

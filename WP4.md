# WP4: Seafloor Signal Separation and Noise Removal

[Work Package Management Site](https://resana.numerique.gouv.fr/public/perimetre/consulter/121579#)

This WP applies advanced signal processing techniques to separate signal/noise sources and tests the use of a new rotational sensor.

## Objectives
Increase sensitivity to low-frequency seismological signals (normal modes, teleseisms...)
- Improve the quality and depth penetration of ambient noise and compliance techniques
- Better understand the sources of noise and the noise floor in this frequency band

## Tasks

| Number | Title | Responsable | Status |  Project Page |
| ------ | ------ | ---------- | ------ | ------------- |
| T4.1   | Reducing horizontal noise using a rotational seismometer | @WayneCrawford, Frederic | not started | [Page](https://resana.numerique.gouv.fr/public/perimetre/consulter/132782) |
| T4.2 | Signal separation/removal techniques | Ker, @WayneCrawford |  not started | |
| T4.3  | Separating seismological and biological signals | Ker, Duval | not started | |

## Deliverables

| Number | Title | Due Date | Status |
| ------ | ------ | ---------- | ------ |
| D4.1  | Report on rotational seismometer integration in BBOBS | M12 | not started |
| D4.2 | Open source software for noise separation and removal | M24-48 | not started |
| D4.3 | Catalog of seafloor noise sources | M36 | not started |
| D4.3 | Scientific articles | M24-48 | not started |

## Details

### Task 4.1: Reducing horizontal noise using a rotational seismometer
We will investigate reducing seafloor horizontal noise levels using the iXblue blueSeis-1C rotational seismometer. This task is divided into sequential subtasks: 

1. **Conception**. Mechanical analysis of integration of blueSeis-1C into INSU-IPGP BBOBS;
2. **Manufacturing**: Construction of blueSeis-1C and modified BBOBS parts
3. **Installation** of the rotational seismometer in a BBOBS
4. **Calibration table evaluation**. Using iXblue’s state of the art 3-axis calibration table
5. **Analysis of results**. Compare calibration table tests with predicted noise level improvements. Modify installation and retest if needed
6. **Near-shore test**: Deployment offshore Brest to validate instrument and obtain high-current data
7. **At-sea test**. Leverage yearly month-long expeditions by the OBS team to the deep seafloor Lucky Strike volcano.
   We will request a 1-day cruise extension for summer 2023 or 2024
8. **Analysis and scientific article**.

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

### Risks:
**Task 4.1** risks are 1) inability to integrate the rotational seismometer into the BBOBS seismometer sphere or 2) less horizontal noise reduction than predicted. These risks will be evaluated in the first 2-5 subtasks, before the major cost and personnel items are engaged. The risk of the technique not working is low, as the relation between horizontal signal and rotational measurements has already been demonstrated for a less sensitive rotational seismometer using the same technology [Bernauer et al., 2018]. 

**Task 4.2** is relatively low risk: We know the existing methods very well and have identified weaknesses that we can improve on. We will quantify improvements, limitations and benefits using synthetic and measured data. 

**Task 4.3** is high-risk, high-reward. It uses few resources and failure has no impact on other tasks.

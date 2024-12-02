# NOISE REDUCTION CHALLENGE: REAL DATA

8 days of data, sampled at 1 sps, from near the RAINBOW hydrothermal field.
Lots of earthquakes and a relatively weak infragravity wave signal.
Data, our processing codes (using [tiskitpy](https://github.com/WayneCrawford/tiskitpy)) and results are [here](CHALLENGE/RAINBOW_files/README.md).


## Original data

Code used: [run_original.py](../RAINBOW_files/run_original.py)

### Waveforms

![Original waveforms](../RAINBOW_files/plots/original.waveforms.png)

### Z Channel Probabilistic Power Spectral Density

![Original Z-channel PPSD](../RAINBOW_files/plots/original.Z-PPSD.png)

### Z-H Coherence

![Waveforms](../RAINBOW_files/plots/original.ZHcoher.png)

### Z-H Transfer function

![Waveforms](../RAINBOW_files/plots/original.ZHrf.png)



## After rotation and transfer function noise removal

Code used: [run_clean.py](../RAINBOW_files/run_clean.py)

### Z waveform comparison

![Z waveforms](../RAINBOW_files/plots/tiskit.z_compare.png)

### Z Power Spectral Density comparison

![Cleaned PSDs](../RAINBOW_files/plots/tiskit.sd_compare.png)

### Best Z-H Coherence

![Cleaned Coherence](../RAINBOW_files/plots/tiskit.ZHcoher.png)

### Best Compliance

![Cleaned Compliance](../RAINBOW_files/plots/tiskit_compliance_Pa-1.png)



## Cleaned, plus removal of manually identified glitches and other anomalies

Code used: [run_tiskit_avoid.py](../RAINBOW_files/run_tiskit_avoid.py)

### Z waveform comparison

![Z waveform comparison](../RAINBOW_files/plots/tiskit-avoid.z_compare.png)

### Z Power Spectral Density comparison

![PSD comparison](../RAINBOW_files/plots/tiskit-avoid.sd_compare.png)

### Best Z-H Coherence

![Coherence](../RAINBOW_files/plots/tiskit-avoid.ZHcoher.png)

### Best Compliance

![Compliance](../RAINBOW_files/plots/tiskit-avoid_compliance_Pa-1.png)



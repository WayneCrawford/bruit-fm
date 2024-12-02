# NOISE REDUCTION CHALLENGE: REAL DATA

8 days of data, sampled at 1 sps, from near the RAINBOW hydrothermal field.
Lots of earthquakes and a relatively weak infragravity wave signal.
Data, our processing codes (using [tiskitpy](https://github.com/WayneCrawford/tiskitpy)) and results are [here](CHALLENGE/RAINBOW_files/README.md).

## Original data

[run_obspy.py](../RAINBOW_files/run_obspy.py)

### Waveforms

![Waveforms](../RAINBOW_files/plots/AS02.streamplot.png)

### Probabilistic Power Spectral Densities

![Waveforms](../RAINBOW_files/plots/AS02.Z-PPSD.png)

### Compliance

![Waveforms](../RAINBOW_files/plots/AS02.compliance.png)

## After rotation and transfer function noise removal

[run_tiskitpy.py](../RAINBOW_files/run_tiskitpy.py)

### Waveforms

![Automatic Waveforms](../RAINBOW_files/plots/AS02.Automatic_z_compare.png)

### Z-channel Power Spectral Densities compared

![Automatic PSDs](../RAINBOW_files/plots/AS02.Automatic.sd_compare.png)

### Pressure-acceleration coherence of cleaned data

![Automatic Coherence](../RAINBOW_files/plots/AS02.Automatic.ZHcoher.png)

### Compliance of cleaned data (amplitude problem, probably using COUNTS)

![Automatic Compliance](../RAINBOW_files/plots/AS02.Automatic.ZHrf.png)

## The above, plus manually identifying and removing glitches and other anomalies

We get a better result if we manually identify glitches and other anomalous noise:

[run_tiskitpy.py](../RAINBOW_files/run_tiskitpy.py)

### Waveforms

![Manual Waveforms](../RAINBOW_files/plots/AS02.Manual_z_compare.png)

## Z-channel Power spectral densities

![Manual PSDs](../RAINBOW_files/plots/AS02.Manual.sd_compare.png)

## Pressure-acceleration coherence

![Manual Coherence](../RAINBOW_files/plots/AS02.Manual.ZHcoher.png)

## Compliance (amplitude problem, probably using COUNTS)

![Manual Compliance](../RAINBOW_files/plots/AS02.Manual.ZHrf.png)

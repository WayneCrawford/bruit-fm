# NOISE REDUCTION CHALLANGE: REAL DATA

8 days of data, sampled at 1 sps, from near the RAINBOW hydrothermal field.
Lots of earthquakes and a relatively weak infragravity wave signal.
Data, our processing codes (using [tiskitpy](https://github.com/WayneCrawford/tiskitpy) and results are [here](CHALLENGE/RAINBOW_files/README.md).

## Original data

[run_obspy.py](CHALLENGE/RAINBOW_files/run_obspy.py)

### Waveforms

![Waveforms](CHALLENGE/RAINBOW_files/plots/AS02.streamplot.png)

### Probabilistic Power Spectral Densities

![Waveforms](CHALLENGE/RAINBOW_files/plots/AS02.Z-PPSD.png)

### Compliance

![Waveforms](CHALLENGE/RAINBOW_files/plots/AS02.compliance.png)

## After rotation and transfer function noise removal

[run_tiskitpy.py](CHALLENGE/RAINBOW_files/run_tiskitpy.py)

### Waveforms

![Automatic Waveforms](CHALLENGE/RAINBOW_files/plots/AS02.Automatic_z_compare.png)

### Probabilistic Power Spectral Densities

![Automatic PSDs](CHALLENGE/RAINBOW_files/plots/AS02.Automatic.sd_compare.png)

### Pressure-acceleration coherence of cleaned data

![Automatic Coherence](CHALLENGE/RAINBOW_files/plots/AS02.Automatic.ZHcoher.png)

### Compliance of cleaned data (amplitude problem, probably using COUNTS)

![Automatic Compliance](CHALLENGE/RAINBOW_files/plots/AS02.Automatic.ZHrf.png)

## The above, plus manually identifying and removing glitches and other anomalies

We get a better result if we manually identify glitches and other anomalous noise:

[run_tiskitpy.py](CHALLENGE/RAINBOW_files/run_tiskitpy.py)

### Waveforms

![Manual Waveforms](CHALLENGE/RAINBOW_files/plots/AS02.Manual_z_compare.png)

## Power spectral densities

![Manual PSDs](CHALLENGE/RAINBOW_files/plots/AS02.Manual.sd_compare.png)

## Pressure-acceleration coherence

![Manual Coherence](CHALLENGE/RAINBOW_files/plots/AS02.Manual.ZHcoher.png)

## Compliance (amplitude problem, probably using COUNTS)

![Manual Compliance](CHALLENGE/RAINBOW_files/plots/AS02.Manual.ZHrf.png)

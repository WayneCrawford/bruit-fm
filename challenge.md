# The Noise Reduction Challenge

We propose two datasets as a challenge to all researchers to

1) minimize non-seismological noise;
2) calculate the seafloor compliance (seafloor motion divided by pressure as a function of frequency).

The first dataset ("REAL") is seafloor data recorded on the Mid-Atlantic Ridge.  The second dataset ("SYNTH") is synthetic, based on models of infragravity wave energy, instrument noise and seafloor tilt. We also provide examples of processing the first dataset, using the [tiskitpy](https://tiskitpy.readthedocs.io) package, as well as codes for packaging your results for submission and the codes we use to evaluate the answers.

All researchers are invited to process these data and submit their results.
All participants will be invited to be co-authors of a community paper comparing the different methods and results.

## Links

- [The dataset](https://doi.org/10.5281/zenodo.17132828).  Includes example processing, submission, and evaluation codes.
- [Kaggle competition site](https://www.kaggle.com/competitions/the-bruit-fm-open-data-noise-reduction-challenge).  Presents the challenge and specifies [data](https://www.kaggle.com/competitions/the-bruit-fm-open-data-noise-reduction-challenge/data) formats.
- [Competition submission site](https://form.jotform.com/262153865166058)
- [Examples of processing the REAL dataset](CHALLENGE/EXAMPLE.zip).
- [Article preprint](https://doi.org/10.48550/arXiv.2606.05941)

# Results of our processing

Here are the results of processing the "REAL" dataset using [tiskitpy](https://tiskitpy.readthedocs.io).  The "REAL" dataset consists of 8 days of data, sampled at 1 sps, from the ARC-EN-SUB experiment near the RAINBOW hydrothermal field.
There are lots of earthquakes and a relatively weak infragravity wave signal.
Our processing codes are available with [the dataset](https://doi.org/10.5281/zenodo.17132828).

Can you do better?

### Original data

[run_original.py](CHALLENGE/RAINBOW_files/run_original.py)

#### Waveforms

![Original waveforms](CHALLENGE/RAINBOW_files/plots/original.waveforms.png)

#### Compliance

*Not enough coherence to calculate compliance*



### After rotation and transfer function noise removal

[run_tiskit.py](CHALLENGE/RAINBOW_files/run_tiskit.py)

#### Z Waveform

![Cleaned Z Waveform](CHALLENGE/RAINBOW_files/plots/tiskit.z_waveform.png)

#### Compliance

![Cleaned Z Compliance](CHALLENGE/RAINBOW_files/plots/tiskit_compliance_Pa-1.png)



#### Manual select time spans to avoid

We get a better result if we manually identify glitches and other anomalous noise to avoid:

[run_tiskit_avoid.py](CHALLENGE/RAINBOW_files/run_tiskit_avoid.py)

##### Z Waveform

![Manual Waveforms](CHALLENGE/RAINBOW_files/plots/tiskit-avoid.z_waveform.png)

##### Compliance

Compliance gets to higher frequencies, but is probably too low at the highest frequencies (not accounting for noise on pressure channel)

![Manual Compliance](CHALLENGE/RAINBOW_files/plots/tiskit-avoid_compliance_Pa-1.png)


### More details available [here](CHALLENGE/RAINBOW_details/README.md)


Coming!

# Data and submission formats

See [here](https://www.kaggle.com/competitions/the-bruit-fm-open-data-noise-reduction-challenge)

Here is an example of seafloor data and its cleaning using the python ``tiskit`` code

## tiskit

[tiskit](https://github.com/WayneCrawford/tiskit) is documented at tiskit.readthedocs.io, including how to install, examples and a complete
description of each component class.

## Installing

Installation instructions are found [in the documentation](https://tiskit.readthedocs.io/en/latest/install.html).  Unfortunately,
if you install using ``pip install tiskit``, ``tiskit`` will be named `tiskit-py` and you will need to modify line 10 of 
``run_data_cleaner.py`` from

``` python
from tiskit import CleanRotator, SpectralDensity, DataCleaner
```

to

``` python
from tiskit-py import CleanRotator, SpectralDensity, DataCleaner
```

If anything does not work for you, please tell Wayne or, better yet, leave an [issue](https://github.com/WayneCrawford/tiskit/issues)
at the [development website](https://github.com/WayneCrawford/tiskit).

## Files to download

The script requires tiskit 0.3

Run the script using `python3 run_data_cleaner.py`  When you run it for the first time, `CleanRotator` will download an earthquake
catalog to your directory.

- [run_data_cleaner.py](Files/run_data_cleaner.py)
- [Data File](Files/XS.S11D.LH.2016.12.11.mseed): contains one day of data from a seafloor broadband OBS
- [Metadata File](Files/stations_PILAB_S_decimated.xml): contains an inventory of the station and the channel responses.

## Images of results

`run_data_cleaner.py` should plot the orginal power spectral densities for the four channels, then the following image, which compares the PSDs obtained from:
- The original data
- The original data plus simple rotation (CleanRotator class)
- The original data, cleaned using the DataCleaner class and a *time*-domain stream-cleaning method
- The rotated data, cleaned using the DataCleaner class and a time-domain stream-cleaning method
- The original data, cleaned using the DataCleaner class and a *frequency*-domain stream-cleaning method
- The rotated data, cleaned using the DataCleaner class and a frequency-domain stream-cleaning method
- The rotated data, with the PSD calculated taking into account the DataCleaner

![XS.S11D_2048s_comparePSDs.png](Images/XS.S11D_2048s_comparePSDs.png)

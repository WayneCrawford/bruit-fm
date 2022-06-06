Here is an example of seafloor data and its cleaning using Wayne's codes

## Wayne's processing module
Wayne's code is called [tiskit](https://github.com/WayneCrawford/tiskit) and it's available online at github.  It uses [obspy](https://github.com/obspy/obspy/wiki/).  Please install `obspy` first following their installation instructions, then install `tiskit` within your `obspy` environment using the instructions on the `tiskit` webpage. I think that the `obspy` environment contains all of the moddules needed for `tiskit`, please tell me if this is not so.

There is a problem with tiskit, which makes it not reduce noise on the data stream as much as it should  (compare the output file XXX.png , which is what tiskit is currently getting, to YYY.png, which is what it should get.)

## Files to download

There is a data file, a metadata file and the python run script

- <a href="files/XS.S11D.LH.2016.12.11.mseed">Download Data File</a>
- <a href="files/stations_PILAB_S_decimated.xml">Download Metadata File</a>
- <a href="files/run_data_cleaner.py">Python Script</a>

## Images of results
PSD of corrected stream
<img src="img/XS.S11D_2048s_streamPSD.png" class="img-responsive" alt=""> </div>

Direct calculation of corrected PSD from input stream
<img src="img/XS.S11D_2048s_directPSD.png" class="img-responsive" alt=""> </div>

"""
Calculate compliance automatically using tiskitpy using two cleaning steps
- Rotation of vertical channel to mimimize noise
- Transfer-function based noise removal (channel 1, then 2, then H)
"""
from obspy.core.stream import read
from obspy import read_inventory, UTCDateTime

from tiskitpy import (SpectralDensity, ResponseFunctions,
                      CleanRotator, DataCleaner, CleanedStream,
                      TimeSpans)

from output_compliance import output_compliance


# Define high noise periods
#   Times where we see glitches in the data
glitches = TimeSpans([
            ['2022-05-08T02:00', '2022-05-08T08:15'],  # Seismometer wait time
            ['2022-05-08T14:24:30', '2022-05-08T14:25:00'],
            ['2022-05-17T17:15', '2022-05-17T19:21'],  # End of data 
        ])
#   Times where we see ugliness in low-pass filtered data
LP_bads = TimeSpans([
            ['2022-05-08T02:00', '2022-05-08T08:30'],  # Seismometer wait time
            ['2022-05-08T13:49', '2022-05-08T14:09'],  # 1-2 transient
            ['2022-05-08T20:00', '2022-05-08T21:00'],  # Big Z transient
            ['2022-05-10T23:05', '2022-05-11T01:05'],  # LP EQ?
            ['2022-05-17T17:19', '2022-05-17T19:20'],  # LP EQ?
        ])
#   Times where we see earthquakes in low-pass filtered data
LP_EQs = TimeSpans([
            ['2022-05-09T07:03', '2022-05-09T08:13'],
            ['2022-05-09T23:00', '2022-05-10T01:18'],
            ['2022-05-10T23:05', '2022-05-11T01:05'],
            ['2022-05-17T17:19', '2022-05-17T19:20'],
            ['2022-05-23T05:45', '2022-05-23T11:22'],
            ['2022-05-24T03:00', '2022-05-24T08:39'],
            ['2022-05-26T04:40', '2022-05-26T07:00'],
            ['2022-05-26T12:00', '2022-05-26T14:00'],
            ['2022-05-26T15:53', '2022-05-26T18:00'],
            ['2022-05-27T03:44', '2022-05-27T04:53'],
            ['2022-05-28T14:00', '2022-05-28T15:00'],
        ])

# read the data and metadata
stream = read('XX.AS02.mseed')
inv = read_inventory('AS02_L.station.xml')

# Create a superclass of Stream that carries transformation information
stream = CleanedStream(stream)
# Set up a dictionary for streams with different levels of cleaning
streams = {'orig': stream}

#  NOISE REDUCTION:
name = 'tiskit-avoid'   # start of output filenames
avoid_spans = glitches + LP_bads + LP_EQs

#  Reduce Z-channel noise by simple rotation
cr = CleanRotator(stream, avoid_spans=avoid_spans)
streams['rot'] = cr.apply(stream)

#  Reduce Z-channel noise by transfer-function removal
#    Tilt only
dc_tilt = DataCleaner(streams['rot'], ['*1', '*2'], avoid_spans=avoid_spans)
streams['rot_tilt'] = dc_tilt.clean_stream(streams['rot'])
#    Tilt and compliance
dc_all = DataCleaner(streams['rot'], ['*1', '*2', '*H'], avoid_spans=avoid_spans)
streams['rot_all'] = dc_all.clean_stream(streams['rot'])

# Plot rotation+tilt+pressure corrected waveform
streams['rot_all'].select(channel='LHZ').plot(outfile=f'plots/{name}.z_waveform.png')

# Compare Z-channel original, simple rotation, and rotation + Tilt&compliance noise reduction
z_compare = (stream.select(channel='*Z')
             + streams['rot'].select(channel='*Z')
             + streams['rot_all'].select(channel='*Z'))
z_compare.plot(outfile=f'plots/{name}.z_compare.png')
sd_compare = SpectralDensity.from_stream(z_compare, inv=inv, avoid_spans=avoid_spans)
sd_compare.plot(overlay=True, outfile=f'plots/{name}.sd_compare.png')

# Calculate compliance using on rotation + "Tilt only" transfer function removal
sd = SpectralDensity.from_stream(streams['rot_tilt'], inv=inv, avoid_spans=avoid_spans)
sd.plot_one_coherence('*Z', '*H', outfile=f'plots/{name}.ZHcoher.png')
rf = ResponseFunctions(sd, '*H', ['*Z'])
# rf.plot(outfile=f'plots/AS02.cleaned.ZHrf.png')
wdepth = 2554  # Water depth in meters
rf.to_norm_compliance(wdepth)
rf.plot(outfile=f'plots/{name}.RF_compliance.png')

# Output compliance
output_compliance(rf, name, max_freq=0.05)

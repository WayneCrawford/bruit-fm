"""
Calculate compliance automatically using tiskitpy using two cleaning steps
- Rotation of vertical channel to mimimize noise
- Transfer-function based noise removal (channel 1, then 2, then H)
"""
from obspy.core.stream import read
from obspy import read_inventory, UTCDateTime
from tiskitpy import (SpectralDensity, ResponseFunctions,
                      CleanRotator, DataCleaner, CleanedStream)

from output_compliance import output_compliance

# read the data and metadata
stream = read('XX.AS02.mseed')
inv = read_inventory('AS02_L.station.xml')

# Create a superclass of Stream that carries transformation information
stream = CleanedStream(stream)
# Set up a dictionary for streams with different levels of cleaning
streams = {'orig': stream}

name = 'tiskit'   # start of output filenames

#  Reduce Z-channel noise by simple rotation
cr = CleanRotator(stream)
streams['rot'] = cr.apply(stream)

#  Reduce Z-channel noise by transfer-function removal
#    Tilt only
dc_tilt = DataCleaner(streams['rot'], ['*1', '*2'])
streams['rot_tilt'] = dc_tilt.clean_stream(streams['rot'])
#    Tilt and compliance
dc_all = DataCleaner(streams['rot'], ['*1', '*2', '*H'])
streams['rot_all'] = dc_all.clean_stream(streams['rot'])

# Plot rotation+tilt+pressure corrected waveform
streams['rot_all'].select(channel='LHZ').plot(outfile=f'plots/{name}.z_waveform.png')

# Compare Z-channel original, simple rotation, and rotation + Tilt&compliance noise reduction
z_compare = (stream.select(channel='*Z')
             + streams['rot'].select(channel='*Z')
             + streams['rot_all'].select(channel='*Z'))
z_compare.plot(outfile=f'plots/{name}.z_compare.png')
sd_compare = SpectralDensity.from_stream(z_compare, inv=inv)
sd_compare.plot(overlay=True, outfile=f'plots/{name}.sd_compare.png')

# Calculate compliance using on rotation + "Tilt only" transfer function removal
sd = SpectralDensity.from_stream(streams['rot_tilt'], inv=inv,)
sd.plot_one_coherence('*Z', '*H', outfile=f'plots/{name}.ZHcoher.png')
rf = ResponseFunctions(sd, '*H', ['*Z'])
# rf.plot(outfile=f'plots/AS02.cleaned.ZHrf.png')
wdepth = 2554  # Water depth in meters
rf.to_norm_compliance(wdepth)
rf.plot(outfile=f'plots/{name}.compliance.png')

# Output compliance
output_compliance(rf, name, max_freq=0.05)